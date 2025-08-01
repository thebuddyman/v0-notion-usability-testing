"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Heart, ArrowRight, Info, MessageSquare } from "lucide-react"
import Link from "next/link"
import { SessionManager } from "@/lib/session-manager"

export default function ThankYouPage() {
  const [showTooltip, setShowTooltip] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const sessionManagerRef = useRef<SessionManager | null>(null)

  useEffect(() => {
    // Try to get existing session manager from localStorage
    sessionManagerRef.current = SessionManager.getInstance()
    
    // Track that user reached thank you page (step 4)
    if (sessionManagerRef.current) {
      sessionManagerRef.current.trackStepView()
    }
  }, [])

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!feedback.trim()) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          sessionId: sessionManagerRef.current?.sessionId || "",
          pageId: sessionManagerRef.current?.pageId || "",
        }),
      })
      
      if (response.ok) {
        setFeedbackSubmitted(true)
        setFeedback("")
      } else {
        console.error("Failed to submit feedback")
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
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
              <div className="mb-2 font-semibold">🎉 Task Completed!</div>
              <ul className="space-y-1 text-xs">
                <li>• You successfully found and used the Edit Profile feature</li>
                <li>• Your navigation and interaction patterns were recorded</li>
                <li>• Click "Back to Home" to start a new test session</li>
                <li>• Click "View Results" to see analytics from all sessions</li>
              </ul>
            </div>
          )}
        </div> */}
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Profile Updated Successfully!
          </h2>
          
          <p className="text-lg text-gray-600 mb-4">
            Great job! You successfully completed the profile editing task.
          </p>
          
          <p className="text-gray-500 mb-8">
            Your interaction data has been recorded and will help us improve the user experience. 
            Thank you for participating in this usability test!
          </p>

          {/* Feedback Form */}
          <div className="mb-8 max-w-md mx-auto">
            {!feedbackSubmitted ? (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                    <label htmlFor="feedback" className="text-sm font-medium text-gray-700">
                      Share your thoughts (optional)
                    </label>
                  </div>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="How was your experience? Any suggestions or feedback?"
                    className="min-h-[100px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {feedback.length}/500 characters
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={!feedback.trim() || isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            ) : (
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Thank you for your feedback!</p>
                <p className="text-green-600 text-sm">Your insights help us improve the experience.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild className="bg-gray-900 text-white hover:bg-gray-800">
              <Link href="/" className="inline-flex items-center gap-2">
                Back to Home
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
{/*             
            <Button asChild variant="outline">
              <Link href="/metrics" className="inline-flex items-center gap-2">
                View Results
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button> */}
          </div>
        </div>
      </main>

      <footer className="py-8 border-t">
        <div className="text-center text-sm text-gray-600">
          <p className="flex items-center justify-center gap-2">
            Made with <Heart className="h-4 w-4 text-red-500 fill-current" /> for the community
          </p>
        </div>
      </footer>
    </div>
  )
}