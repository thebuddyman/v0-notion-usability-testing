import { Client } from "@notion/client"

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const DATABASE_ID = process.env.NOTION_DATABASE_ID!

export type MetricType = "visit" | "start_click" | "exit"

// Function to add a new metric entry to Notion
export async function addMetricEntry(eventType: MetricType) {
  try {
    await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties: {
        "Event Type": {
          select: {
            name: eventType,
          },
        },
        Timestamp: {
          date: {
            start: new Date().toISOString(),
          },
        },
        Count: {
          number: 1,
        },
      },
    })
  } catch (error) {
    console.error("Error adding metric to Notion:", error)
    throw error
  }
}

// Function to get aggregated stats from Notion
export async function getStats() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
    })

    // Count occurrences of each event type
    const stats = {
      visits: 0,
      start_clicks: 0,
      exits: 0,
    }

    response.results.forEach((page: any) => {
      const eventType = page.properties["Event Type"]?.select?.name

      switch (eventType) {
        case "visit":
          stats.visits += 1
          break
        case "start_click":
          stats.start_clicks += 1
          break
        case "exit":
          stats.exits += 1
          break
      }
    })

    return stats
  } catch (error) {
    console.error("Error fetching stats from Notion:", error)
    throw error
  }
}

// Alternative approach: Use a single row per metric type and update counts
export async function getOrCreateMetricPage(eventType: MetricType) {
  try {
    // First, try to find existing page for this event type
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: "Event Type",
        select: {
          equals: eventType,
        },
      },
    })

    if (response.results.length > 0) {
      // Update existing page
      const page = response.results[0] as any
      const currentCount = page.properties.Count?.number || 0

      await notion.pages.update({
        page_id: page.id,
        properties: {
          Count: {
            number: currentCount + 1,
          },
          "Last Updated": {
            date: {
              start: new Date().toISOString(),
            },
          },
        },
      })
    } else {
      // Create new page
      await notion.pages.create({
        parent: {
          database_id: DATABASE_ID,
        },
        properties: {
          "Event Type": {
            select: {
              name: eventType,
            },
          },
          Count: {
            number: 1,
          },
          "Last Updated": {
            date: {
              start: new Date().toISOString(),
            },
          },
        },
      })
    }
  } catch (error) {
    console.error("Error updating metric in Notion:", error)
    throw error
  }
}

// Function to get stats using the single-row approach
export async function getStatsOptimized() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
    })

    const stats = {
      visits: 0,
      start_clicks: 0,
      exits: 0,
    }

    response.results.forEach((page: any) => {
      const eventType = page.properties["Event Type"]?.select?.name
      const count = page.properties.Count?.number || 0

      switch (eventType) {
        case "visit":
          stats.visits = count
          break
        case "start_click":
          stats.start_clicks = count
          break
        case "exit":
          stats.exits = count
          break
      }
    })

    return stats
  } catch (error) {
    console.error("Error fetching stats from Notion:", error)
    throw error
  }
}
