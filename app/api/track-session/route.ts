import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("=== TRACK SESSION API CALLED ===")

  // Check environment variables first
  const hasNotionToken = !!process.env.NOTION_TOKEN
  const hasNotionDb = !!process.env.NOTION_DATABASE_ID
  const tokenFormat = process.env.NOTION_TOKEN?.substring(0, 10) + "..."

  console.log("Environment check:")
  console.log("- NOTION_TOKEN exists:", hasNotionToken)
  console.log("- NOTION_TOKEN format:", tokenFormat)
  console.log("- NOTION_DATABASE_ID exists:", hasNotionDb)
  console.log("- NOTION_DATABASE_ID:", process.env.NOTION_DATABASE_ID)

  if (!hasNotionToken || !hasNotionDb) {
    console.error("Missing environment variables")
    return NextResponse.json(
      {
        success: false,
        message: "Server configuration error: Missing Notion credentials",
      },
      { status: 500 },
    )
  }

  let body
  try {
    // Handle both JSON and text requests (for sendBeacon)
    const contentType = request.headers.get("content-type")
    console.log("Content-Type:", contentType)

    if (contentType?.includes("application/json")) {
      body = await request.json()
    } else {
      // Handle sendBeacon requests (which send as text)
      const textBody = await request.text()
      console.log("Text body received:", textBody)

      if (textBody) {
        try {
          body = JSON.parse(textBody)
        } catch (parseError) {
          console.error("Failed to parse text body as JSON:", parseError)
          return NextResponse.json(
            {
              success: false,
              message: "Invalid JSON in request body",
            },
            { status: 400 },
          )
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Empty request body",
          },
          { status: 400 },
        )
      }
    }

    console.log("Parsed request body:", body)

    const { sessionId, pageId, action, hintClicks, stepCount } = body

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing action parameter",
        },
        { status: 400 },
      )
    }

    // Dynamically import to avoid initialization errors
    const { startSessionInNotion, updateSessionInNotion, updateHintClicksInNotion, updateStepViewsInNotion } = await import("@/lib/notion-analytics")

    switch (action) {
      case "start":
        console.log("=== STARTING NEW SESSION ===")
        try {
          const newPageId = await startSessionInNotion(sessionId || `session_${Date.now()}`)
          console.log("Session started successfully, pageId:", newPageId)
          return NextResponse.json({ success: true, pageId: newPageId })
        } catch (startError) {
          console.error("Error starting session:", startError)
          return NextResponse.json(
            {
              success: false,
              message: `Failed to start session: ${startError instanceof Error ? startError.message : "Unknown error"}`,
            },
            { status: 500 },
          )
        }

      case "success":
        console.log("=== UPDATING SESSION TO SUCCESS ===")
        if (!pageId) {
          return NextResponse.json(
            {
              success: false,
              message: "Missing pageId for success action",
            },
            { status: 400 },
          )
        }
        try {
          await updateSessionInNotion(pageId, "Success")
          return NextResponse.json({ success: true })
        } catch (successError) {
          console.error("Error updating to success:", successError)
          return NextResponse.json(
            {
              success: false,
              message: `Failed to update session: ${successError instanceof Error ? successError.message : "Unknown error"}`,
            },
            { status: 500 },
          )
        }

      case "abandon":
        console.log("=== UPDATING SESSION TO ABANDONED ===")
        if (!pageId) {
          console.warn("No pageId for abandon action, skipping")
          return NextResponse.json({ success: true })
        }
        try {
          await updateSessionInNotion(pageId, "Abandoned")
          return NextResponse.json({ success: true })
        } catch (abandonError) {
          console.error("Error updating to abandoned:", abandonError)
          return NextResponse.json({ success: true }) // Don't fail on abandon errors
        }

      case "exit":
        console.log("=== UPDATING SESSION TO FAILED ===")
        if (!pageId) {
          console.warn("No pageId for exit action, skipping")
          return NextResponse.json({ success: true })
        }
        try {
          await updateSessionInNotion(pageId, "Failed")
          return NextResponse.json({ success: true })
        } catch (exitError) {
          console.error("Error updating to failed:", exitError)
          return NextResponse.json({ success: true }) // Don't fail on exit errors
        }

      case "update_hints":
        console.log("=== UPDATING HINT CLICKS ===")
        if (!pageId) {
          return NextResponse.json(
            {
              success: false,
              message: "Missing pageId for update_hints action",
            },
            { status: 400 },
          )
        }
        try {
          await updateHintClicksInNotion(pageId, hintClicks || 0)
          return NextResponse.json({ success: true })
        } catch (hintsError) {
          console.error("Error updating hint clicks:", hintsError)
          return NextResponse.json(
            {
              success: false,
              message: `Failed to update hint clicks: ${hintsError instanceof Error ? hintsError.message : "Unknown error"}`,
            },
            { status: 500 },
          )
        }

      case "update_steps":
        console.log("=== UPDATING STEP VIEWS ===")
        if (!pageId) {
          return NextResponse.json(
            {
              success: false,
              message: "Missing pageId for update_steps action",
            },
            { status: 400 },
          )
        }
        try {
          await updateStepViewsInNotion(pageId, stepCount || 1)
          return NextResponse.json({ success: true })
        } catch (stepsError) {
          console.error("Error updating step views:", stepsError)
          return NextResponse.json(
            {
              success: false,
              message: `Failed to update step views: ${stepsError instanceof Error ? stepsError.message : "Unknown error"}`,
            },
            { status: 500 },
          )
        }

      default:
        console.log("Invalid action:", action)
        return NextResponse.json(
          {
            success: false,
            message: `Invalid action: ${action}`,
          },
          { status: 400 },
        )
    }
  } catch (parseError) {
    console.error("=== ERROR PARSING REQUEST ===")
    console.error("Parse error:", parseError)
    console.error("Request headers:", Object.fromEntries(request.headers.entries()))

    return NextResponse.json(
      {
        success: false,
        message: `Request parsing failed: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      },
      { status: 400 },
    )
  }
}
