import { NextRequest, NextResponse } from 'next/server'

// In-memory metrics store (in production, use Redis or similar)
class MetricsStore {
  private metrics: Map<string, number> = new Map()
  private histograms: Map<string, number[]> = new Map()

  incrementCounter(name: string, value = 1) {
    this.metrics.set(name, (this.metrics.get(name) || 0) + value)
  }

  setGauge(name: string, value: number) {
    this.metrics.set(name, value)
  }

  recordHistogram(name: string, value: number) {
    const values = this.histograms.get(name) || []
    values.push(value)
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift()
    }
    this.histograms.set(name, values)
  }

  getMetric(name: string): number {
    return this.metrics.get(name) || 0
  }

  getHistogramPercentile(name: string, percentile: number): number {
    const values = this.histograms.get(name) || []
    if (values.length === 0) return 0
    
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    
    // Add counters and gauges
    for (const [key, value] of this.metrics.entries()) {
      result[key] = value
    }
    
    // Add histogram percentiles
    for (const [key, values] of this.histograms.entries()) {
      if (values.length > 0) {
        result[`${key}_p50`] = this.getHistogramPercentile(key, 50)
        result[`${key}_p95`] = this.getHistogramPercentile(key, 95)
        result[`${key}_p99`] = this.getHistogramPercentile(key, 99)
      }
    }
    
    return result
  }
}

export const metricsStore = new MetricsStore()

export function withMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const url = new URL(req.url)
    const route = url.pathname
    const method = req.method

    // Increment request counter
    metricsStore.incrementCounter(`http_requests_total`)
    metricsStore.incrementCounter(`http_requests_total_${method}`)
    metricsStore.incrementCounter(`http_requests_total_${route}`)

    let response: NextResponse
    let statusCode: number

    try {
      response = await handler(req)
      statusCode = response.status
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Request handler error:', error)
      }
      statusCode = 500
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    // Record metrics
    const duration = Date.now() - startTime
    
    // Record response time histogram
    metricsStore.recordHistogram('http_request_duration_seconds', duration / 1000)
    metricsStore.recordHistogram(`http_request_duration_seconds_${route}`, duration / 1000)
    
    // Increment status code counters
    metricsStore.incrementCounter(`http_requests_total_status_${statusCode}`)
    
    if (statusCode >= 400) {
      metricsStore.incrementCounter(`http_requests_errors_total`)
      if (statusCode >= 500) {
        metricsStore.incrementCounter(`http_requests_errors_5xx_total`)
      } else {
        metricsStore.incrementCounter(`http_requests_errors_4xx_total`)
      }
    }

    // Set current timestamp
    metricsStore.setGauge('http_last_request_timestamp', Math.floor(Date.now() / 1000))

    return response
  }
}

// Middleware function for tracking user actions
export function trackUserAction(action: string, userId?: string, metadata?: Record<string, any>) {
  metricsStore.incrementCounter(`user_actions_total`)
  metricsStore.incrementCounter(`user_actions_${action}_total`)
  
  if (userId) {
    metricsStore.incrementCounter(`user_actions_by_user_${userId}`)
  }
  
  // Log action for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`User action: ${action}`, { userId, metadata, timestamp: new Date().toISOString() })
  }
}

// Middleware for tracking business events
export function trackBusinessEvent(event: string, value?: number, metadata?: Record<string, any>) {
  metricsStore.incrementCounter(`business_events_total`)
  metricsStore.incrementCounter(`business_events_${event}_total`)
  
  if (value !== undefined) {
    metricsStore.setGauge(`business_events_${event}_value`, value)
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`Business event: ${event}`, { value, metadata, timestamp: new Date().toISOString() })
  }
}

// Export metrics in Prometheus format
export function getPrometheusMetrics(): string {
  const metrics = metricsStore.getAllMetrics()
  const lines: string[] = []
  
  for (const [key, value] of Object.entries(metrics)) {
    lines.push(`# TYPE ${key} gauge`)
    lines.push(`${key} ${value}`)
  }
  
  return lines.join('\n')
}

// Health check function
export function getHealthCheck(): Record<string, any> {
  const now = Date.now()
  const lastRequest = metricsStore.getMetric('http_last_request_timestamp') * 1000
  const timeSinceLastRequest = now - lastRequest
  
  return {
    status: timeSinceLastRequest < 60000 ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics: {
      totalRequests: metricsStore.getMetric('http_requests_total'),
      errorRate: metricsStore.getMetric('http_requests_errors_total') / Math.max(1, metricsStore.getMetric('http_requests_total')),
      avgResponseTime: metricsStore.getHistogramPercentile('http_request_duration_seconds', 50),
      p95ResponseTime: metricsStore.getHistogramPercentile('http_request_duration_seconds', 95)
    }
  }
}