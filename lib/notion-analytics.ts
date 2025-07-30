import { Client, isNotionClientError } from "@notion/client"
import { generateFunnyName } from "./funny-names"

console.log("=== INITIALIZING NOTION CLIENT ===")

// Validate environment variables
if (!process.env.NOTION_TOKEN) {
  console.error("NOTION_TOKEN is not set")
  throw new Error("NOTION_TOKEN environment variable is required")
}

if (!process.env.NOTION_DATABASE_ID) {
  console.error("NOTION_DATABASE_ID is not set")
  throw new Error("NOTION_DATABASE_ID environment variable is required")
}

if (!process.env.NOTION_TOKEN.startsWith("secret_")) {
  console.error("NOTION_TOKEN has wrong format:", process.env.NOTION_TOKEN.substring(0, 10) + "...")
  throw new Error("NOTION_TOKEN must start with 'secret_' - check your integration token")
}

console.log("✅ Environment variables validated")
console.log("- Token format: secret_...")
console.log("- Database ID:", process.env.NOTION_DATABASE_ID)

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const DATABASE_ID = process.env.NOTION_DATABASE_ID

export type TaskStatus = "Success" | "Failed" | "Abandoned" | "In Progress"

export async function startSessionInNotion(sessionId: string): Promise<string> {
  console.log("=== STARTING NOTION SESSION ===")
  console.log("Session ID:", sessionId)

  try {
    const funnyName = generateFunnyName()
    console.log("Generated name:", funnyName)

    // Test database access first
    console.log("Testing database access...")
    const dbResponse = await notion.databases.retrieve({ database_id: DATABASE_ID })
    console.log("✅ Database accessible:", dbResponse.title?.[0]?.plain_text || "Untitled")

    console.log("Creating new page...")
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: {
        Name: {
          title: [{ text: { content: funnyName } }],
        },
        "Task Success": {
          select: { name: "In Progress" },
        },
        "Start Time": {
          date: { start: new Date().toISOString() },
        },
        "Time on Task": {
          number: 0,
        },
      },
    })

    console.log("✅ Page created successfully:", response.id)
    return response.id
  } catch (error) {
    console.error("❌ Error in startSessionInNotion:")

    if (isNotionClientError(error)) {
      console.error("Notion API Error:")
      console.error("- Code:", error.code)
      console.error("- Status:", error.status)
      console.error("- Body:", error.body)

      // Parse the error body for more details
      try {
        const errorDetails = JSON.parse(error.body)
        console.error("- Message:", errorDetails.message)
        console.error("- Details:", errorDetails)

        // Provide specific error messages
        if (error.code === "unauthorized") {
          throw new Error("Notion API unauthorized - check your NOTION_TOKEN")
        }
        if (error.code === "object_not_found") {
          throw new Error("Database not found - check your NOTION_DATABASE_ID and integration permissions")
        }
        if (error.code === "validation_error") {
          throw new Error(`Notion validation error: ${errorDetails.message}`)
        }

        throw new Error(`Notion API error (${error.code}): ${errorDetails.message}`)
      } catch (parseError) {
        throw new Error(`Notion API error (${error.code}): ${error.body}`)
      }
    } else {
      console.error("Non-Notion error:", error)
      throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export async function updateSessionInNotion(pageId: string, status: TaskStatus): Promise<void> {
  console.log("=== UPDATING NOTION SESSION ===")
  console.log("Page ID:", pageId)
  console.log("Status:", status)

  if (!pageId) {
    console.warn("No pageId provided, skipping update")
    return
  }

  try {
    // Get the current page to calculate time on task
    console.log("Retrieving page...")
    const pageResponse = await notion.pages.retrieve({ page_id: pageId })
    console.log("✅ Page retrieved successfully")

    const properties = (pageResponse as any).properties
    const startTimeString = properties["Start Time"]?.date?.start

    let timeOnTask = 0
    if (startTimeString) {
      const startTime = new Date(startTimeString)
      const endTime = new Date()
      timeOnTask = Math.round((endTime.getTime() - startTime.getTime()) / 1000)
      console.log("Calculated time on task:", timeOnTask, "seconds")
    } else {
      console.warn("No start time found, using 0 for time on task")
    }

    console.log("Updating page properties...")
    await notion.pages.update({
      page_id: pageId,
      properties: {
        "Task Success": { select: { name: status } },
        "End Time": { date: { start: new Date().toISOString() } },
        "Time on Task": { number: timeOnTask },
      },
    })

    console.log("✅ Page updated successfully")
  } catch (error) {
    console.error("❌ Error in updateSessionInNotion:")

    if (isNotionClientError(error)) {
      console.error("Notion API Error:")
      console.error("- Code:", error.code)
      console.error("- Status:", error.status)
      console.error("- Body:", error.body)

      if (error.code === "object_not_found") {
        throw new Error("Page not found - it may have been deleted")
      }

      throw new Error(`Notion API error (${error.code}): ${error.body}`)
    } else {
      console.error("Non-Notion error:", error)
      throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export async function getAnalytics() {
  console.log("=== GETTING ANALYTICS ===")

  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: "Task Success",
        select: {
          does_not_equal: "In Progress",
        },
      },
      sorts: [{ property: "Start Time", direction: "descending" }],
    })

    console.log("✅ Analytics query successful, found", response.results.length, "sessions")

    const sessions = response.results.map((page: any) => ({
      name: page.properties.Name?.title?.[0]?.text?.content || "Unknown",
      taskSuccess: page.properties["Task Success"]?.select?.name || "Unknown",
      startTime: page.properties["Start Time"]?.date?.start || "",
      endTime: page.properties["End Time"]?.date?.start || "",
      timeOnTask: page.properties["Time on Task"]?.number || 0,
    }))

    const totalSessions = sessions.length
    const successfulSessions = sessions.filter((s) => s.taskSuccess === "Success").length
    const abandonedSessions = sessions.filter((s) => s.taskSuccess === "Abandoned").length
    const failedSessions = sessions.filter((s) => s.taskSuccess === "Failed").length

    return {
      summary: {
        totalSessions,
        successfulSessions,
        failedSessions,
        abandonedSessions,
        averageTimeOnTask:
          totalSessions > 0 ? Math.round(sessions.reduce((sum, s) => sum + s.timeOnTask, 0) / totalSessions) : 0,
        successRate: totalSessions > 0 ? Math.round((successfulSessions / totalSessions) * 100) : 0,
      },
      sessions: sessions.slice(0, 10),
    }
  } catch (error) {
    console.error("❌ Error in getAnalytics:")

    if (isNotionClientError(error)) {
      console.error("Notion API Error:", error.code, error.body)
      throw new Error(`Failed to fetch analytics: ${error.code}`)
    } else {
      console.error("Non-Notion error:", error)
      throw new Error(`Analytics error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
