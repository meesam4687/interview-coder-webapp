import { motion } from "framer-motion"
import { LinkedinBadge } from "@/components/ui/linked-in-badge"
import { Button } from "@/components/ui/button"
import { HeroVideo } from "@/components/ui/hero-video"
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
    ? "https://github.com/ibttf/interview-coder/releases/download/v1.0.5/Interview.Coder-arm64.dmg"
    : "https://github.com/ibttf/interview-coder/releases/download/v1.0.5/Interview.Coder-x64.dmg"

  return (
    <main className="relative overflow-hidden flex flex-col items-center justify-center md:pt-36">
      <div className="container px-4 text-center max-w-2xl mx-auto lg:max-w-6xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LinkedinBadge />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 text-center text-md lg:text-[24px] font-medium text-[#B3B3B3] font-['Inter']"
          style={{
            fontFamily: '"Inter", "Inter Placeholder", sans-serif',
            fontWeight: 500
          }}
        >
          Meet Interview Coder
        </motion.h2>
        <motion.h1
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-10 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto"
        >
          <span className="white-gradient">Invisible AI for </span>{" "}
          <span className="highlighter-gradient">Technical</span>{" "}
          <span className="white-gradient">Interviews</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col md:flex-row gap-4 md:gap-12 w-full justify-center items-center md:text-medium text-sm"
        >
          <Button className="bg-primary w-full md:w-auto max-w-[280px] h-10 text-sm">
            <Link href={downloadUrl} className="flex gap-2">
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
          <Button
            variant="highlight"
            className="w-full md:w-auto max-w-[280px] h-10 text-sm"
          >
            <Link href="/waitlist" className="flex gap-2">
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

        <HeroVideo />
      </div>
    </main>
  )
}
