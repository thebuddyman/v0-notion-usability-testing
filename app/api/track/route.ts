import { NextResponse } from "next/server"
import { getOrCreateMetricPage, type MetricType } from "@/lib/notion"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event } = body

    let eventType: MetricType | null = null
    switch (event) {
      case "visit":
        eventType = "visit"
        break
      case "start_click":
        eventType = "start_click"
        break
      case "exit":
        eventType = "exit"
        break
      default:
        return NextResponse.json({ message: "Invalid event type" }, { status: 400 })
    }

    // Update the metric in Notion
    await getOrCreateMetricPage(eventType)

    return NextResponse.json({ success: true, message: `Tracked ${eventType}` })
  } catch (error) {
    // Handle non-JSON body from sendBeacon
    try {
      const textBody = await request.text()
      if (textBody.includes("exit")) {
        await getOrCreateMetricPage("exit")
        return NextResponse.json({ success: true, message: "Tracked exit" })
      }
    } catch (textError) {
      console.error("Error parsing text body:", textError)
    }

    console.error("Error tracking event:", error)
    return NextResponse.json({ message: "Error processing request" }, { status: 500 })
  }
}
