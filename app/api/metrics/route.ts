import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { redisCache } from "@/lib/redis-cache"

export async function GET(request: NextRequest) {
  try {
    const metrics = await collectMetrics()
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8'
      }
    })
  } catch (error) {
    console.error('Error collecting metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function collectMetrics(): Promise<string> {
  const metrics: string[] = []
  
  try {
    // System metrics
    const startTime = Date.now()
    const memoryUsage = process.memoryUsage()
    
    // Application metrics
    const userCount = await prisma.user.count()
    const postCount = await prisma.post.count()
    const bookingCount = await prisma.booking.count()
    const paymentCount = await prisma.payment.count()
    
    // Performance metrics
    const responseTime = Date.now() - startTime
    
    // Build Prometheus format metrics
    metrics.push(
      '# HELP inkspot_user_total Total number of users',
      '# TYPE inkspot_user_total counter',
      `inkspot_user_total ${userCount}`,
      '',
      '# HELP inkspot_post_total Total number of posts',
      '# TYPE inkspot_post_total counter',
      `inkspot_post_total ${postCount}`,
      '',
      '# HELP inkspot_booking_total Total number of bookings',
      '# TYPE inkspot_booking_total counter',
      `inkspot_booking_total ${bookingCount}`,
      '',
      '# HELP inkspot_payment_total Total number of payments',
      '# TYPE inkspot_payment_total counter',
      `inkspot_payment_total ${paymentCount}`,
      '',
      '# HELP inkspot_response_time_seconds API response time in seconds',
      '# TYPE inkspot_response_time_seconds histogram',
      `inkspot_response_time_seconds ${responseTime / 1000}`,
      '',
      '# HELP inkspot_memory_heap_bytes Memory heap usage in bytes',
      '# TYPE inkspot_memory_heap_bytes gauge',
      `inkspot_memory_heap_bytes ${memoryUsage.heapUsed}`,
      '',
      '# HELP inkspot_memory_heap_total_bytes Total memory heap size in bytes',
      '# TYPE inkspot_memory_heap_total_bytes gauge',
      `inkspot_memory_heap_total_bytes ${memoryUsage.heapTotal}`,
      '',
      '# HELP inkspot_memory_external_bytes External memory usage in bytes',
      '# TYPE inkspot_memory_external_bytes gauge',
      `inkspot_memory_external_bytes ${memoryUsage.external}`,
      '',
      '# HELP inkspot_memory_rss_bytes Resident set size in bytes',
      '# TYPE inkspot_memory_rss_bytes gauge',
      `inkspot_memory_rss_bytes ${memoryUsage.rss}`,
      '',
      '# HELP inkspot_process_uptime_seconds Process uptime in seconds',
      '# TYPE inkspot_process_uptime_seconds gauge',
      `inkspot_process_uptime_seconds ${process.uptime()}`,
      '',
      '# HELP inkspot_nodejs_version_info Node.js version info',
      '# TYPE inkspot_nodejs_version_info gauge',
      `inkspot_nodejs_version_info{version="${process.version}"} 1`
    )
    
    // Database connection metrics
    try {
      await prisma.$queryRaw`SELECT 1`
      metrics.push(
        '',
        '# HELP inkspot_database_connected Database connection status',
        '# TYPE inkspot_database_connected gauge',
        'inkspot_database_connected 1'
      )
    } catch (error) {
      metrics.push(
        '',
        '# HELP inkspot_database_connected Database connection status',
        '# TYPE inkspot_database_connected gauge',
        'inkspot_database_connected 0'
      )
    }
    
    // Redis connection metrics
    try {
      await redisCache.healthCheck()
      metrics.push(
        '',
        '# HELP inkspot_redis_connected Redis connection status',
        '# TYPE inkspot_redis_connected gauge',
        'inkspot_redis_connected 1'
      )
    } catch (error) {
      metrics.push(
        '',
        '# HELP inkspot_redis_connected Redis connection status',
        '# TYPE inkspot_redis_connected gauge',
        'inkspot_redis_connected 0'
      )
    }
    
    // Business metrics
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayBookings = await prisma.booking.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      })
      
      const todayRevenue = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: today
          }
        },
        _sum: {
          amount: true
        }
      })
      
      metrics.push(
        '',
        '# HELP inkspot_bookings_today Total bookings today',
        '# TYPE inkspot_bookings_today counter',
        `inkspot_bookings_today ${todayBookings}`,
        '',
        '# HELP inkspot_revenue_today Total revenue today in cents',
        '# TYPE inkspot_revenue_today counter',
        `inkspot_revenue_today ${todayRevenue._sum.amount || 0}`
      )
    } catch (error) {
      console.error('Error collecting business metrics:', error)
    }
    
  } catch (error) {
    console.error('Error collecting metrics:', error)
    metrics.push(
      '# HELP inkspot_metrics_error Error collecting metrics',
      '# TYPE inkspot_metrics_error gauge',
      'inkspot_metrics_error 1'
    )
  }
  
  return metrics.join('\n')
}