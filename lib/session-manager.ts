// Client-side session management
export class SessionManager {
  private static SESSION_KEY = "app_page_session"
  private static INACTIVITY_TIMEOUT = 30000 // 30 seconds of inactivity = abandoned
  private sessionId: string
  private startTime: Date
  private lastActivity: Date
  private inactivityTimer: NodeJS.Timeout | null = null
  private pageId: string | null = null

  constructor() {
    this.sessionId = this.getOrCreateSessionId()
    this.startTime = new Date()
    this.lastActivity = new Date()
    this.setupInactivityTracking()
  }

  private getOrCreateSessionId(): string {
    if (typeof window === "undefined") return ""

    let sessionId = localStorage.getItem(SessionManager.SESSION_KEY)
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(SessionManager.SESSION_KEY, sessionId)
    }
    return sessionId
  }

  private setupInactivityTracking() {
    if (typeof window === "undefined") return

    const resetTimer = () => {
      this.lastActivity = new Date()
      if (this.inactivityTimer) {
        clearTimeout(this.inactivityTimer)
      }
      this.inactivityTimer = setTimeout(() => {
        this.trackAbandonment()
      }, SessionManager.INACTIVITY_TIMEOUT)
    }

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true)
    })

    resetTimer()
  }

  private async _trackAction(action: string) {
    console.log(`=== TRACKING ACTION: ${action} ===`)
    console.log("Session ID:", this.sessionId)
    console.log("Page ID:", this.pageId)

    // For actions other than 'start', we need a pageId.
    if (action !== "start" && !this.pageId) {
      console.warn(`Cannot track action '${action}' without a pageId. The start action might have failed.`)
      return
    }

    try {
      const requestBody = {
        action,
        sessionId: this.sessionId,
        pageId: this.pageId,
      }

      console.log("Request body:", requestBody)

      const response = await fetch("/api/track-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      // Check if the request was successful
      if (!response.ok) {
        let errorData
        try {
          // Try to parse a JSON error response from the server
          const responseText = await response.text()
          console.log("Response text:", responseText)

          if (responseText) {
            try {
              errorData = JSON.parse(responseText)
            } catch (parseError) {
              console.error("Failed to parse error response as JSON:", parseError)
              errorData = { message: responseText }
            }
          }
        } catch (e) {
          console.error("Failed to read response:", e)
        }

        const errorMessage = errorData?.message || `API Error: ${response.status} ${response.statusText}`
        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      console.log("Response data:", responseData)
      return responseData
    } catch (error) {
      // Log the specific error to the console without crashing the app
      console.error(`Failed to track action '${action}':`, error)
      throw error // Re-throw so the calling function can handle it
    }
  }

  async trackStart() {
    try {
      console.log("=== STARTING SESSION TRACKING ===")
      const data = await this._trackAction("start")
      if (data?.pageId) {
        this.pageId = data.pageId
        console.log(`✅ Session started successfully with Notion Page ID: ${this.pageId}`)
      } else {
        console.error("❌ The 'start' action failed to return a pageId from the API.")
        console.log("Response data:", data)
      }
    } catch (error) {
      console.error("❌ Failed to start session:", error)
      // Don't throw the error to prevent breaking the app
    }
  }

  async trackSuccess() {
    try {
      if (this.inactivityTimer) clearTimeout(this.inactivityTimer)
      await this._trackAction("success")
      console.log("✅ Session marked as successful")
    } catch (error) {
      console.error("❌ Failed to track success:", error)
    }
  }

  private async trackAbandonment() {
    try {
      if (this.inactivityTimer) clearTimeout(this.inactivityTimer)
      await this._trackAction("abandon")
      console.log("✅ Session marked as abandoned")
    } catch (error) {
      console.error("❌ Failed to track abandonment:", error)
    }
  }

  async trackExit() {
    try {
      if (this.inactivityTimer) clearTimeout(this.inactivityTimer)

      const requestBody = JSON.stringify({
        pageId: this.pageId,
        action: "exit",
        sessionId: this.sessionId,
      })

      // sendBeacon is "fire-and-forget" and best for exit events
      if (navigator.sendBeacon && this.pageId) {
        const success = navigator.sendBeacon("/api/track-session", requestBody)
        console.log("Exit beacon sent:", success)
      } else {
        // Fallback to fetch for older browsers or when no pageId
        await this._trackAction("exit")
      }
    } catch (error) {
      console.error("❌ Failed to track exit:", error)
    }
  }

  cleanup() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }
  }
}
