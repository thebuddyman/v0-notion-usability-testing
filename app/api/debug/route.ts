import { NextResponse } from "next/server"

export async function GET() {
  const hasNotionToken = !!process.env.NOTION_TOKEN
  const hasNotionDb = !!process.env.NOTION_DATABASE_ID
  const tokenFormat = process.env.NOTION_TOKEN?.substring(0, 20) + "..."
  
  return NextResponse.json({
    environment: {
      NOTION_TOKEN_EXISTS: hasNotionToken,
      NOTION_TOKEN_FORMAT: tokenFormat,
      NOTION_DATABASE_ID_EXISTS: hasNotionDb,
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
      NODE_ENV: process.env.NODE_ENV,
    }
  })
}