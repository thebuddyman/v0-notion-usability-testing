"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, ExternalLink, Heart } from "lucide-react"
import { SessionManager } from "@/lib/session-manager"

export default function LandingPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const sessionManagerRef = useRef<SessionManager | null>(null)

  useEffect(() => {
    // Initialize session manager
    sessionManagerRef.current = new SessionManager()
    sessionManagerRef.current.trackStart()

    const handleBeforeUnload = () => {
      if (sessionManagerRef.current) {
        sessionManagerRef.current.trackExit()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      if (sessionManagerRef.current) {
        sessionManagerRef.current.cleanup()
      }
    }
  }, [])

  const handleStartClick = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      return
    }

    // Track successful completion
    if (sessionManagerRef.current) {
      await sessionManagerRef.current.trackSuccess()
    }

    // Navigate to the metrics page
    router.push("/metrics")
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-start">
          <span className="text-xs text-blue-500 font-semibold absolute -translate-y-3 translate-x-1">beta</span>
          <h1 className="text-xl font-bold">app.page</h1>
        </div>
        <Button variant="ghost" size="icon">
          <Sparkles className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Get early access to app.page</h2>
          <p className="mt-4 text-lg text-gray-600">Join the waitlist to secure your app page</p>
          <p className="mt-2 text-sm text-gray-500">e.g https://company.app.page</p>
          <form
            onSubmit={handleStartClick}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-grow"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full sm:w-auto bg-gray-900 text-white hover:bg-gray-800">
              Join waitlist
            </Button>
          </form>
        </div>
      </main>

      <footer className="py-8 border-t">
        <div className="text-center text-sm text-gray-600">
          <p>We're building app.page in 2025, and we need your help to make it happen!</p>
          <p className="mt-1">
            Help us by answering some{" "}
            <a href="#" className="underline inline-flex items-center gap-1">
              questions <ExternalLink className="h-3 w-3" />
            </a>{" "}
            about your needs <Heart className="inline-block h-4 w-4 text-blue-500 fill-current" />
          </p>
        </div>
      </footer>
    </div>
  )
}
