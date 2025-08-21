import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'unknown',
      message: 'INKSPOT API is running'
    }

    return NextResponse.json(healthInfo, { status: 200 })
  } catch (error) {
    console.error('Simple health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
