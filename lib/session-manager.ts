// Client-side session management
export class SessionManager {
  private static SESSION_KEY = "app_page_session"
  private static PAGE_ID_KEY = "app_page_id"
  private static HINT_CLICKS_KEY = "app_hint_clicks"
  private static STEP_COUNT_KEY = "app_step_count"
  private static LAST_TRACKED_PATH_KEY = "app_last_tracked_path"
  private static INACTIVITY_TIMEOUT = 30000 // 30 seconds of inactivity = abandoned
  private static instance: SessionManager | null = null
  
  private sessionId: string
  private startTime: Date
  private lastActivity: Date
  private inactivityTimer: NodeJS.Timeout | null = null
  private pageId: string | null = null
  private hintClicks: number = 0
  private stepCount: number = 1 // Start at 1 for the initial welcome page
  private lastTrackedPath: string = "" // Track which path we last incremented for
  private isResetting: boolean = false // Flag to prevent multiple resets

  constructor() {
    // Only initialize if we're on the client side
    if (typeof window === "undefined") {
      this.sessionId = ""
      this.startTime = new Date()
      this.lastActivity = new Date()
      return
    }
    
    this.sessionId = this.getOrCreateSessionId()
    this.startTime = new Date()
    this.lastActivity = new Date()
    this.loadPersistedData()
    this.setupInactivityTracking()
  }

  // Singleton pattern to ensure we have only one session manager across pages
  static getInstance(): SessionManager {
    if (typeof window === "undefined") {
      // Return a dummy instance for SSR
      return new SessionManager()
    }
    
    if (!SessionManager.instance) {
      console.log("🏗️ Creating new SessionManager instance")
      SessionManager.instance = new SessionManager()
    } else {
      console.log("♻️ Reusing existing SessionManager instance")
    }
    return SessionManager.instance
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

  private loadPersistedData() {
    if (typeof window === "undefined") return

    // Load pageId
    const storedPageId = localStorage.getItem(SessionManager.PAGE_ID_KEY)
    if (storedPageId) {
      this.pageId = storedPageId
    }

    // Load hint clicks
    const storedHintClicks = localStorage.getItem(SessionManager.HINT_CLICKS_KEY)
    if (storedHintClicks) {
      this.hintClicks = parseInt(storedHintClicks, 10) || 0
    }

    // Load step count
    const storedStepCount = localStorage.getItem(SessionManager.STEP_COUNT_KEY)
    if (storedStepCount) {
      this.stepCount = parseInt(storedStepCount, 10) || 1
    }

    // Load last tracked path
    const storedLastTrackedPath = localStorage.getItem(SessionManager.LAST_TRACKED_PATH_KEY)
    if (storedLastTrackedPath) {
      this.lastTrackedPath = storedLastTrackedPath
    }
  }

  private persistData() {
    if (typeof window === "undefined") return

    if (this.pageId) {
      localStorage.setItem(SessionManager.PAGE_ID_KEY, this.pageId)
    }
    localStorage.setItem(SessionManager.HINT_CLICKS_KEY, this.hintClicks.toString())
    localStorage.setItem(SessionManager.STEP_COUNT_KEY, this.stepCount.toString())
    localStorage.setItem(SessionManager.LAST_TRACKED_PATH_KEY, this.lastTrackedPath)
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
    if (typeof window === "undefined") return
    
    // If we already have a pageId, don't start a new session
    if (this.pageId) {
      console.log("⚠️ Session already started with Page ID:", this.pageId)
      return
    }
    
    try {
      console.log("=== STARTING SESSION TRACKING ===")
      const data = await this._trackAction("start")
      if (data?.pageId) {
        this.pageId = data.pageId
        this.persistData() // Persist the pageId
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

  trackHintClick() {
    if (typeof window === "undefined") return
    
    this.hintClicks++
    this.persistData() // Persist the updated hint count
    console.log(`💡 Hint clicked (${this.hintClicks} times)`)
    
    // Update the session in Notion with the new hint count
    // If pageId is not set yet, try to wait a bit for session to initialize
    if (!this.pageId) {
      console.log("⏳ PageId not ready, waiting 1 second before updating hint clicks...")
      setTimeout(() => this.updateHintClicks(), 1000)
    } else {
      this.updateHintClicks()
    }
  }

  trackStepView() {
    if (typeof window === "undefined") return
    
    // Get current path to avoid double-counting the same page
    const currentPath = window.location.pathname
    
    // If we've already tracked this path, don't increment again
    if (this.lastTrackedPath === currentPath) {
      console.log(`📍 Step already tracked for path: ${currentPath} (step ${this.stepCount})`)
      return
    }
    
    // Increment step count and track this path
    this.stepCount++
    this.lastTrackedPath = currentPath
    this.persistData() // Persist the updated step count and path
    console.log(`📍 Step viewed: ${currentPath} (step ${this.stepCount})`)
    
    // Update the session in Notion with the new step count
    this.updateStepViews()
  }

  private async updateStepViews() {
    if (!this.pageId) return
    
    try {
      const response = await fetch("/api/track-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_steps",
          pageId: this.pageId,
          stepCount: this.stepCount,
        }),
      })
      
      if (!response.ok) {
        console.error("Failed to update step views")
      }
    } catch (error) {
      console.error("Error updating step views:", error)
    }
  }

  private async updateHintClicks() {
    if (!this.pageId) {
      console.warn("Cannot update hint clicks: pageId is null. Session may not have started properly.")
      return
    }
    
    try {
      console.log(`🔄 Updating hint clicks to ${this.hintClicks} for page ${this.pageId}`)
      const response = await fetch("/api/track-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_hints",
          pageId: this.pageId,
          hintClicks: this.hintClicks,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to update hint clicks:", response.status, errorText)
      } else {
        console.log("✅ Hint clicks updated successfully")
      }
    } catch (error) {
      console.error("Error updating hint clicks:", error)
    }
  }

  async trackSuccess() {
    if (typeof window === "undefined") return
    
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
    if (typeof window === "undefined") return
    
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

  async resetAndStartNewSession() {
    if (typeof window === "undefined") return
    
    // Prevent multiple resets in quick succession
    if (this.isResetting) {
      console.log("⚠️ Already resetting session, skipping duplicate call")
      return
    }
    
    this.isResetting = true
    
    try {
      console.log("🔄 Resetting session for new journey")
      console.log("Previous session ID:", this.sessionId)
      console.log("Previous page ID:", this.pageId)
      
      // Reset all counters
      this.hintClicks = 0
      this.stepCount = 1
      this.lastTrackedPath = ""
      
      // Clear the previous session's pageId since we'll create a new one
      this.pageId = null
      
      // Generate new session ID
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(SessionManager.SESSION_KEY, this.sessionId)
      
      // Persist the reset values
      this.persistData()
      
      console.log("✅ Session reset complete - starting new session")
      console.log("New session ID:", this.sessionId)
      
      // Start the new session immediately
      await this.trackStart()
    } finally {
      // Reset the flag after a short delay to allow for the session to fully initialize
      setTimeout(() => {
        this.isResetting = false
      }, 1000)
    }
  }

  cleanup() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }
  }
}
