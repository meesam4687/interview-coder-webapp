import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia"
})
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Create a Supabase client with admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    console.error("No signature found in webhook request")
    return NextResponse.json({ error: "No signature found" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log("Received webhook event:", event.type)
  } catch (err) {
    console.error("Error verifying webhook signature:", err)
    return NextResponse.json(
      {
        error: `Webhook Error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      },
      { status: 400 }
    )
  }

  try {
    // Handle subscription updates
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription
      console.log("Processing subscription update:", {
        subscriptionId: subscription.id,
        status: subscription.status,
        cancelAt: subscription.cancel_at
      })

      // Try to get user_id from metadata first
      let userId = subscription.metadata.user_id

      // If not in metadata, try to find it in the database
      if (!userId) {
        console.log("No user_id in metadata, searching in database...")
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single()

        if (sub) {
          userId = sub.user_id
          console.log("Found user_id in database:", userId)
        }
      }

      if (!userId) {
        console.error("No user_id found in metadata or database")
        return NextResponse.json({ error: "No user_id found" }, { status: 400 })
      }

      // Update subscription in database
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          cancel_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
          canceled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null
        })
        .eq("user_id", userId)

      if (updateError) {
        console.error("Error updating subscription:", updateError)
        return NextResponse.json(
          { error: "Error updating subscription" },
          { status: 500 }
        )
      }

      console.log("Successfully updated subscription for user:", userId)
      return NextResponse.json({ received: true })
    }

    // Handle setup intent events
    if (
      event.type === "setup_intent.created" ||
      event.type === "setup_intent.succeeded"
    ) {
      const setupIntent = event.data.object as Stripe.SetupIntent
      console.log("Processing setup intent:", {
        id: setupIntent.id,
        status: setupIntent.status,
        metadata: setupIntent.metadata
      })
      return NextResponse.json({ received: true })
    }

    // Handle payment method events
    if (event.type === "payment_method.attached") {
      const paymentMethod = event.data.object as Stripe.PaymentMethod
      console.log("Processing payment method:", {
        id: paymentMethod.id,
        type: paymentMethod.type,
        customer: paymentMethod.customer
      })
      return NextResponse.json({ received: true })
    }

    // Handle checkout session completion and payment success
    if (
      event.type === "checkout.session.completed" ||
      event.type === "payment_intent.succeeded"
    ) {
      console.log("Processing payment event:", event.type)

      let userId: string | undefined
      let customerId: string | undefined
      let subscriptionId: string | undefined
      let isSetupMode = false

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session
        userId = session.client_reference_id || session.metadata?.user_id
        customerId = session.customer as string
        subscriptionId = session.subscription as string
        isSetupMode = session.mode === "setup"

        console.log("Checkout session details:", {
          userId,
          customerId,
          subscriptionId,
          mode: session.mode,
          metadata: session.metadata
        })

        // If this is just a setup session (adding a card), return early
        if (isSetupMode) {
          console.log("Setup session completed, no subscription update needed")
          return NextResponse.json({ received: true })
        }
      } else {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        userId = paymentIntent.metadata?.user_id
        customerId = paymentIntent.customer as string
        subscriptionId = paymentIntent.metadata?.subscriptionId

        console.log("Payment intent details:", {
          userId,
          customerId,
          subscriptionId,
          metadata: paymentIntent.metadata
        })
      }

      if (!userId || !customerId) {
        console.error("Missing required fields:", {
          userId,
          customerId,
          subscriptionId
        })
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        )
      }

      // Get subscription details from Stripe if we have a subscription ID
      let subscription: Stripe.Subscription | null = null
      if (subscriptionId) {
        subscription = await stripe.subscriptions.retrieve(subscriptionId)
        console.log("Retrieved subscription details:", {
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end
        })
      }

      console.log("Creating/updating subscription for user:", userId)

      // Upsert subscription record using admin client
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: userId,
          status: subscription ? subscription.status : "active",
          plan: "pro",
          current_period_start: subscription
            ? new Date(subscription.current_period_start * 1000).toISOString()
            : new Date().toISOString(),
          current_period_end: subscription
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId || null,
          cancel_at: subscription?.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
          canceled_at: subscription?.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null
        })

      if (subscriptionError) {
        console.error("Error upserting subscription:", subscriptionError)
        return NextResponse.json(
          { error: "Error upserting subscription" },
          { status: 500 }
        )
      }

      console.log("Successfully processed subscription for user:", userId)
    } else {
      console.log("Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Error processing webhook:", err)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
