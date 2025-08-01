"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info, User, ArrowLeft, ChevronDown } from "lucide-react"
import { SessionManager } from "@/lib/session-manager"

export default function EditProfilePage() {
  const router = useRouter()
  const [name, setName] = useState("John Doe") // Default name
  const [showTooltip, setShowTooltip] = useState(false)
   const [showDropdown, setShowDropdown] = useState(false)
  const sessionManagerRef = useRef<SessionManager | null>(null)

  useEffect(() => {
    // Get existing session manager
    sessionManagerRef.current = SessionManager.getInstance()
    
    // Track that user reached the edit profile page (step 3)
    if (sessionManagerRef.current) {
      sessionManagerRef.current.trackStepView()
    }
  }, [])

  const handleSave = async () => {
    // Track that user completed all steps
    if (sessionManagerRef.current) {
      await sessionManagerRef.current.trackSuccess()
    }

    // Navigate to success page
    router.push("/thank-you")
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex justify-between items-center p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-start">
            <span className="text-xs text-blue-500 font-semibold absolute -translate-y-3 translate-x-1">beta</span>
            <h1 className="text-xl font-bold">app.page</h1>
          </div>
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
                  <li>• Edit the "Full Name" field below</li>
                  <li>• Type in your preferred name</li>
                  <li>• Click the blue "Save Profile" button when ready</li>
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

      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-500" />
            </div>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
            <p className="text-gray-600">Update your profile information</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-400">Email</Label>
              <Input
                id="email"
                type="email"
                value="john.doe@example.com"
                disabled
                className="w-full bg-gray-100 text-gray-500"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!name.trim()}
              >
                Save Profile
              </Button>

              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}