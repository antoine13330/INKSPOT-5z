import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// In-memory storage for performance metrics (in production, use a proper database)
const performanceMetrics = new Map<string, Array<{ value: number; timestamp: number }>>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { metric, value, timestamp } = body

    // Validate required fields
    if (!metric || typeof value !== 'number' || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: metric, value, timestamp' },
        { status: 400 }
      )
    }

    // Store the metric
    if (!performanceMetrics.has(metric)) {
      performanceMetrics.set(metric, [])
    }
    
    const metricData = performanceMetrics.get(metric)!
    metricData.push({ value, timestamp })

    // Keep only last 1000 data points per metric to prevent memory issues
    if (metricData.length > 1000) {
      metricData.splice(0, metricData.length - 1000)
    }

    // Log the metric for debugging
    console.log(`Performance metric received: ${metric} = ${value} at ${new Date(timestamp).toISOString()}`)

    // Optionally store in database for persistence
    try {
      await prisma.performanceMetric.create({
        data: {
          name: metric,
          value: value,
          timestamp: new Date(timestamp),
          metadata: { source: 'client-side' }
        }
      })
    } catch (dbError) {
      console.warn('Failed to store metric in database:', dbError)
      // Continue execution even if DB storage fails
      // This might happen if the database hasn't been migrated yet
    }

    return NextResponse.json({ 
      success: true, 
      message: `Metric ${metric} stored successfully`,
      storedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error processing performance metric:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric')
    const limit = parseInt(searchParams.get('limit') || '100')

    if (metric) {
      // Return specific metric data
      const metricData = performanceMetrics.get(metric) || []
      return NextResponse.json({
        metric,
        data: metricData.slice(-limit),
        count: metricData.length
      })
    } else {
      // Return all available metrics
      const allMetrics: Record<string, {
        count: number;
        latestValue: number | null;
        latestTimestamp: number | null;
      }> = {}
      for (const [metricName, data] of performanceMetrics.entries()) {
        allMetrics[metricName] = {
          count: data.length,
          latestValue: data.length > 0 ? data[data.length - 1].value : null,
          latestTimestamp: data.length > 0 ? data[data.length - 1].timestamp : null
        }
      }
      
      return NextResponse.json({
        availableMetrics: Object.keys(allMetrics),
        metrics: allMetrics
      })
    }
  } catch (error) {
    console.error('Error retrieving performance metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
