import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Basic system info (always available)
    const systemInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'unknown',
      database: 'checking...'
    }

    // Try database connection (optional for health check)
    try {
      await prisma.$queryRaw`SELECT 1 as test`
      systemInfo.database = 'connected'
    } catch (dbError) {
      console.warn('Database connection failed during health check:', dbError)
      systemInfo.database = 'disconnected'
      systemInfo.status = 'degraded'
    }

    // Check if we're in a healthy state
    const statusCode = systemInfo.status === 'healthy' ? 200 : 503

    return NextResponse.json(systemInfo, { status: statusCode })
  } catch (error) {
    console.error('Health check failed:', error)
    
    // Return basic info even if there's an error
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'unknown'
    }, { status: 500 })
  }
}