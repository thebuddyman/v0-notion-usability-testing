import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("=== FEEDBACK SUBMISSION API ===")
  
  try {
    const body = await request.json()
    console.log("Request body:", body)
    
    const { feedback, pageId, sessionId } = body
    
    // Validate required fields
    if (!feedback?.trim()) {
      console.error("Missing feedback in request")
      return NextResponse.json(
        { success: false, message: "Feedback is required" },
        { status: 400 }
      )
    }
    
    if (!pageId) {
      console.error("Missing pageId in request")
      return NextResponse.json(
        { success: false, message: "Page ID is required" },
        { status: 400 }
      )
    }
    
    console.log("Processing feedback submission...")
    console.log("- Feedback:", feedback)
    console.log("- Page ID:", pageId)
    console.log("- Session ID:", sessionId)
    
    // Import the Notion function dynamically to avoid initialization issues
    const { updateFeedbackInNotion } = await import("@/lib/notion-analytics")
    
    try {
      await updateFeedbackInNotion(pageId, feedback.trim())
      
      console.log("✅ Feedback submitted successfully")
      return NextResponse.json({
        success: true,
        message: "Feedback submitted successfully",
      })
      
    } catch (notionError) {
      console.error("Error updating feedback in Notion:", notionError)
      return NextResponse.json(
        {
          success: false,
          message: `Failed to submit feedback: ${notionError instanceof Error ? notionError.message : "Unknown error"}`,
        },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error("Error in feedback submission API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    )
  }
}