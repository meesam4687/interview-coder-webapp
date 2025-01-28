import { motion } from "framer-motion"
import { LinkedinBadge } from "@/components/ui/linked-in-badge"
import { Button } from "@/components/ui/button"
import { HeroVideo } from "@/components/ui/hero-video"
import { WingsBackground } from "@/components/ui/WingsBackground"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

export const HeroSection = () => {
  const [isSilicon, setIsSilicon] = useState(false)

  useEffect(() => {
    const platform = navigator.platform.toLowerCase()
    setIsSilicon(platform.includes("mac") && !platform.includes("intel"))
  }, [])

  const downloadUrl = isSilicon
    ? "https://github.com/ibttf/interview-coder/releases/download/v1.0.7/Interview-Coder-arm64.dmg"
    : "https://github.com/ibttf/interview-coder/releases/download/v1.0.7/Interview-Coder-x64.dmg"

  return (
    <main className="relative min-h-[90vh] overflow-hidden flex flex-col items-center justify-center lg:pt-36">
      {/* <WingsBackground /> */}
      <LinkedinBadge />
      <div className="container relative z-10 px-4 text-center max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.3]"
        >
          <span className="white-gradient pb-6">F*ck Leetcode.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12 text-center text-md lg:text-[16px] lg:px-24 font-medium text-[#B3B3B3] font-['Inter']"
          style={{
            fontFamily: '"Inter", "Inter Placeholder", sans-serif',
            fontWeight: 500
          }}
        >
          Interview Coder is an{" "}
          <span className="highlighter-gradient">undetectable</span> desktop
          application to help you pass your Leetcode interviews.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button className="bg-primary w-full sm:w-auto px-6 py-2">
            <Link href={downloadUrl} className="flex items-center gap-2">
              <Image
                src="/apple.svg"
                alt="Apple"
                width={16}
                height={16}
                className="w-4 h-4"
              />
              Download for Mac
            </Link>
          </Button>
          <Button variant="highlight" className="w-full sm:w-auto px-6 py-2">
            <Link href="/waitlist" className="flex items-center gap-2">
              <Image
                src="/windows.svg"
                alt="Windows"
                width={16}
                height={16}
                className="w-5 h-5"
              />
              Windows Waitlist
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8"
        >
          <HeroVideo />
        </motion.div>
      </div>
    </main>
  )
}
