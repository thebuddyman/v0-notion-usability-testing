"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Info, User, ChevronDown } from "lucide-react"
import { SessionManager } from "@/lib/session-manager"

export default function ProfilePage() {
  const router = useRouter()
  const [showTooltip, setShowTooltip] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const sessionManagerRef = useRef<SessionManager | null>(null)

  useEffect(() => {
    // Get existing session manager
    sessionManagerRef.current = SessionManager.getInstance()
    
    // Track that user reached the profile page (step 2)
    if (sessionManagerRef.current) {
      sessionManagerRef.current.trackStepView()
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <header className="flex justify-between items-center p-4 border-b">
        <div className="flex items-start">
          <span className="text-xs text-blue-500 font-semibold absolute -translate-y-3 translate-x-1">beta</span>
          <h1 className="text-xl font-bold">app.page</h1>
        </div>

        <div className="flex items-center gap-4">


          {/* Info Icon */}
          <div className="relative">
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
                  <li>• Look in the top navigation bar</li>
                  <li>• Find the user avatar icon with a dropdown arrow</li>
                  <li>• Click on it to see profile options</li>
                </ul>
              </div>
            )}
          </div>

          {/* Avatar Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2 hover:bg-white"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showDropdown && (
              <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  <button
                    onClick={() => router.push("/edit-profile")}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-500"
                  >

                    Edit Profile
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-500">
                    Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-500">
                    Help
                  </button>
                  <hr className="my-1" />
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-500">
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Welcome to your Dashboard</h2>

          <p className="text-lg text-gray-600 mb-8">
            This is your main dashboard.
          </p>
        </div>
      </main>
    </div>
  )
}