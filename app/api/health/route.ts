import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getHealthCheck } from "@/middleware/monitoring"

export async function GET(request: NextRequest) {
  try {
    // Get basic health info
    const healthData = getHealthCheck()
    
    // Test database connection
    let dbStatus = 'healthy'
    let dbResponseTime = 0
    
    try {
      const startTime = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbResponseTime = Date.now() - startTime
    } catch (error) {
      dbStatus = 'unhealthy'
      console.error('Database health check failed:', error)
    }
    
    // Get system info
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuUsage: process.cpuUsage(),
      resourceUsage: process.resourceUsage()
    }
    
    // Calculate overall status
    const isHealthy = healthData.status === 'healthy' && dbStatus === 'healthy'
    
    const response = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: healthData.timestamp,
      checks: {
        application: {
          status: healthData.status,
          uptime: healthData.uptime,
          memory: healthData.memory,
          metrics: healthData.metrics
        },
        database: {
          status: dbStatus,
          responseTime: `${dbResponseTime}ms`
        },
        system: systemInfo
      },
      version: process.env.npm_package_version || 'unknown'
    }
    
    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    )
  }
}