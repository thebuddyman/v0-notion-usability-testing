import { NextResponse } from "next/server"
import { getAnalytics } from "@/lib/notion-analytics"

export async function GET() {
  try {
    console.log("Fetching analytics...")
    const analytics = await getAnalytics()
    console.log("Analytics fetched successfully:", analytics.summary)
    return NextResponse.json(analytics)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
    console.error("Error in /api/analytics:", errorMessage)

    // Return a structured error response
    return NextResponse.json(
      {
        error: "Failed to fetch analytics from Notion.",
        message: errorMessage,
        summary: {
          totalSessions: 0,
          successfulSessions: 0,
          failedSessions: 0,
          abandonedSessions: 0,
          averageTimeOnTask: 0,
          successRate: 0,
        },
        sessions: [],
      },
      { status: 500 },
    )
  }
}

export const revalidate = 0
