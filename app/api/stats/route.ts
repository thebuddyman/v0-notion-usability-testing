import { NextResponse } from "next/server"
import { getStatsOptimized } from "@/lib/notion"

export async function GET() {
  try {
    const stats = await getStatsOptimized()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ message: "Error fetching stats" }, { status: 500 })
  }
}

// Force dynamic rendering to ensure we always get the latest stats
export const revalidate = 0
