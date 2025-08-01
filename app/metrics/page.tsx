"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Users, RefreshCw, TrendingUp, AlertCircle, Info } from "lucide-react"

type AnalyticsData = {
  summary: {
    totalSessions: number
    successfulSessions: number
    failedSessions: number
    abandonedSessions: number
    averageTimeOnTask: number
    successRate: number
  }
  sessions: Array<{
    name: string
    taskSuccess: string
    startTime: string
    endTime: string
    timeOnTask: number
    hintClicks: number
    stepViews: number
  }>
  error?: string
  message?: string
}

export default function MetricsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      setError(null)

      console.log("Fetching analytics...")
      const response = await fetch("/api/analytics")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("Server returned non-JSON response")
      }

      const data = await response.json()
      console.log("Analytics data received:", data)

      if (data.error) {
        setError(data.message || data.error)
      }

      setAnalytics(data)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")

      // Set fallback data
      setAnalytics({
        summary: {
          totalSessions: 0,
          successfulSessions: 0,
          failedSessions: 0,
          abandonedSessions: 0,
          averageTimeOnTask: 0,
          successRate: 0,
        },
        sessions: [],
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "Failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "Abandoned":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status === "Success" ? "default" : status === "Failed" ? "destructive" : "secondary"
    return <Badge variant={variant}>{status}</Badge>
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 text-center relative">
          {/* <div className="absolute top-0 right-0">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowTooltip(!showTooltip)}
              onBlur={() => setTimeout(() => setShowTooltip(false), 150)}
            >
              <Info className="h-5 w-5" />
            </Button>
            {showTooltip && (
              <div className="absolute right-0 top-12 w-80 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10">
                <div className="mb-2 font-semibold">📊 Analytics Dashboard</div>
                <ul className="space-y-1 text-xs">
                  <li>• View real-time usability testing results</li>
                  <li>• Track success rates and completion times</li>
                  <li>• Each session gets a funny name for easy identification</li>
                  <li>• Data is automatically stored in Notion</li>
                  <li>• Click "Refresh Data" to see the latest results</li>
                </ul>
              </div>
            )}
          </div> */}
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-2">User session analytics stored in Notion with funny names!</p>
          <Button
            onClick={fetchAnalytics}
            variant="outline"
            size="sm"
            className="mt-4 bg-transparent"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Error loading analytics</p>
              </div>
              <p className="text-sm text-red-500 mt-2">{error}</p>
              <p className="text-xs text-gray-500 mt-2">
                Make sure your NOTION_TOKEN and NOTION_DATABASE_ID environment variables are set correctly.
              </p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-center">Loading analytics from Notion...</p>
        ) : analytics ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.summary.totalSessions}</div>
                  <p className="text-xs text-muted-foreground">Unique user sessions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.summary.successRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.summary.successfulSessions} successful completions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Time on Task</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTime(analytics.summary.averageTimeOnTask)}</div>
                  <p className="text-xs text-muted-foreground">Average session duration</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abandoned</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.summary.abandonedSessions}</div>
                  <p className="text-xs text-muted-foreground">Sessions abandoned due to inactivity</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.sessions.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.sessions.map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(session.taskSuccess)}
                          <div>
                            <p className="font-medium">{session.name}</p>
                            <p className="text-sm text-gray-500">{new Date(session.startTime).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">{formatTime(session.timeOnTask)}</span>
                          <span className="text-sm text-blue-600">💡 {session.hintClicks}</span>
                          <span className="text-sm text-green-600">📍 {session.stepViews}/4</span>
                          {getStatusBadge(session.taskSuccess)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No sessions recorded yet. Visit the landing page to generate some data!
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-center text-red-500">Failed to load analytics data</p>
        )}

        <div className="mt-8 text-center">
          <Button asChild>
            <Link href="/">Back to Landing Page</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
