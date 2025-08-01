import { NextResponse } from "next/server"
import { getAnalytics } from "@/lib/notion-analytics"

export async function GET() {
  try {
    const stats = await getAnalytics()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ message: "Error fetching stats" }, { status: 500 })
  }
}

// Force dynamic rendering to ensure we always get the latest stats
export const revalidate = 0
