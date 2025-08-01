"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Info, User } from "lucide-react"
import { SessionManager } from "@/lib/session-manager"

export default function LandingPage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const sessionManagerRef = useRef<SessionManager | null>(null)

  useEffect(() => {
    console.log("🏠 Main page useEffect running")
    
    // Set client flag to prevent hydration mismatch
    setIsClient(true)

    // Initialize session manager only on client
    sessionManagerRef.current = SessionManager.getInstance()
    
    // Reset session when returning to main page (start fresh journey)
    console.log("🏠 About to reset and start new session")
    sessionManagerRef.current.resetAndStartNewSession()

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

  const handleGetStarted = () => {
    // Just navigate to the profile editing flow
    router.push("/profile")
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-start">
          <span className="text-xs text-blue-500 font-semibold absolute -translate-y-3 translate-x-1 -ml-1">beta</span>
          <h1 className="text-xl font-bold">app.page</h1>
        </div>
        {/* <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowTooltip(!showTooltip)
              if (!showTooltip && sessionManagerRef.current) {
                sessionManagerRef.current.trackHintClick()
              }
            }}
            onBlur={() => setTimeout(() => setShowTooltip(false), 150)}
          >
            <Info className="h-5 w-5" />
          </Button>
          {showTooltip && (
            <div className="absolute right-0 top-12 w-80 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10">
              <div className="mb-2 font-semibold">💡 Hint:</div>
              <ul className="space-y-1 text-xs">
                <li>• Click "Get Started" to begin the task</li>
                <li>• You'll be taken to a dashboard where you can explore</li>
                <li>• Look for ways to access your profile settings</li>
              </ul>
            </div>
          )}
        </div> */}
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Thank you for helping us try our new feature</h2>


          <div className="mb-8">
            <p className="text-lg text-gray-700 mb-4">
              Your goal is to update your profile name. Navigate through the interface to find where you can edit your profile and change your name.
            </p>
          </div>


          <Button
            onClick={handleGetStarted}
            className="bg-gray-900 text-white hover:bg-gray-800 px-5 py-5 text-md"
          >
            Get Started
          </Button>
        </div>
      </main>

      <footer className="py-8 border-t">
        <div className="text-center text-sm text-gray-600">
          <p>This is a usability test to help us improve the user experience.</p>
          <p className="mt-1">
            Your actions and feedback are being recorded to help us understand user behavior.
          </p>
        </div>
      </footer>
    </div>
  )
}
