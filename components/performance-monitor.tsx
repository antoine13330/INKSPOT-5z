"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePerformanceOptimizer, requestOptimizer } from '@/lib/performance-optimizer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Zap, 
  Clock, 
  Database, 
  Network, 
  HardDrive, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  ExternalLink
} from 'lucide-react'

interface PerformanceMetrics {
  pageLoadTime: number
  apiResponseTime: number
  memoryUsage: number
  cacheHitRate: number
  networkLatency: number
  errorRate: number
  lastUpdated: Date
}

interface PerformanceThresholds {
  pageLoadTime: { warning: number; critical: number }
  apiResponseTime: { warning: number; critical: number }
  memoryUsage: { warning: number; critical: number }
  cacheHitRate: { warning: number; critical: number }
  networkLatency: { warning: number; critical: number }
  errorRate: { warning: number; critical: number }
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    networkLatency: 0,
    errorRate: 0,
    lastUpdated: new Date()
  })
  
  const [isVisible, setIsVisible] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [grafanaUrl, setGrafanaUrl] = useState('http://localhost:3002')
  const [thresholds, setThresholds] = useState<PerformanceThresholds>({
    pageLoadTime: { warning: 2000, critical: 5000 },
    apiResponseTime: { warning: 1000, critical: 3000 },
    memoryUsage: { warning: 80, critical: 95 },
    cacheHitRate: { warning: 60, critical: 40 },
    networkLatency: { warning: 200, critical: 500 },
    errorRate: { warning: 5, critical: 15 }
  })
  
  const { debounced, throttled, cacheData, getCachedData } = usePerformanceOptimizer()
  const intervalRef = useRef<NodeJS.Timeout>()
  const observerRef = useRef<PerformanceObserver>()

  // Initialize performance monitoring
  useEffect(() => {
    initializePerformanceMonitoring()
    return () => cleanupPerformanceMonitoring()
  }, [])

  // Auto-refresh metrics
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(collectMetrics, 10000) // Every 10 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh])

  const initializePerformanceMonitoring = useCallback(() => {
    // Performance Navigation Timing API
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart
        setMetrics(prev => ({ ...prev, pageLoadTime }))
      }
    }

    // Performance Observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        observerRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.duration > 50) { // Long task threshold
              console.warn('Long task detected:', entry)
            }
          })
        })
        observerRef.current.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error)
      }
    }

    // Memory API
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      setMetrics(prev => ({ ...prev, memoryUsage }))
    }

    // Initial metrics collection
    collectMetrics()
  }, [])

  const cleanupPerformanceMonitoring = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])

  const collectMetrics = useCallback(async () => {
    try {
      // Collect current performance metrics
      const newMetrics = await gatherPerformanceMetrics()
      
      // Cache the metrics
      cacheData('performance-metrics', newMetrics, 30000) // 30 seconds TTL
      
      setMetrics(newMetrics)
      
      // Send metrics to Grafana (temporarily disabled to avoid errors)
      // await sendMetricsToGrafana(newMetrics)
    } catch (error) {
      console.error('Error collecting performance metrics:', error)
    }
  }, [cacheData])

  const sendMetricsToGrafana = async (metrics: PerformanceMetrics) => {
    try {
      // Send each metric to Grafana via our API
      const metricData = [
        { name: 'page_load_time', value: metrics.pageLoadTime },
        { name: 'api_response_time', value: metrics.apiResponseTime },
        { name: 'memory_usage', value: metrics.memoryUsage },
        { name: 'cache_hit_rate', value: metrics.cacheHitRate },
        { name: 'network_latency', value: metrics.networkLatency },
        { name: 'error_rate', value: metrics.errorRate }
      ]

      for (const metric of metricData) {
        await fetch('/api/grafana/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metric: metric.name,
            value: metric.value,
            timestamp: Date.now()
          })
        })
      }
    } catch (error) {
      console.error('Error sending metrics to Grafana:', error)
    }
  }

  const gatherPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
    const newMetrics: Partial<PerformanceMetrics> = {
      lastUpdated: new Date()
    }

    // Page load time
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        newMetrics.pageLoadTime = navigation.loadEventEnd - navigation.loadEventStart
      }
    }

    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory
      newMetrics.memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }

    // Cache hit rate (simulated - in real app, track actual cache hits)
    const cacheHitRate = Math.random() * 100 // Replace with actual cache tracking
    newMetrics.cacheHitRate = cacheHitRate

    // Network latency (simulated - in real app, measure actual API calls)
    const networkLatency = Math.random() * 500 + 50 // 50-550ms
    newMetrics.networkLatency = networkLatency

    // API response time (simulated - in real app, track actual API response times)
    const apiResponseTime = Math.random() * 2000 + 200 // 200-2200ms
    newMetrics.apiResponseTime = apiResponseTime

    // Error rate (simulated - in real app, track actual errors)
    const errorRate = Math.random() * 10 // 0-10%
    newMetrics.errorRate = errorRate

    return newMetrics as PerformanceMetrics
  }

  const getMetricStatus = (metric: keyof PerformanceMetrics, value: number) => {
    if (metric === 'lastUpdated') return 'normal'
    
    const threshold = thresholds[metric as keyof PerformanceThresholds]
    if (!threshold) return 'normal'
    
    if (value >= threshold.critical) return 'critical'
    if (value >= threshold.warning) return 'warning'
    return 'normal'
  }

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500'
      case 'warning': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const getMetricIcon = (metric: keyof PerformanceMetrics) => {
    switch (metric) {
      case 'pageLoadTime': return <Clock className="w-4 h-4" />
      case 'apiResponseTime': return <Database className="w-4 h-4" />
      case 'memoryUsage': return <HardDrive className="w-4 h-4" />
      case 'cacheHitRate': return <Zap className="w-4 h-4" />
      case 'networkLatency': return <Network className="w-4 h-4" />
      case 'errorRate': return <AlertTriangle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const formatMetricValue = (metric: keyof PerformanceMetrics, value: number) => {
    switch (metric) {
      case 'pageLoadTime':
      case 'apiResponseTime':
      case 'networkLatency':
        return `${value.toFixed(0)}ms`
      case 'memoryUsage':
      case 'cacheHitRate':
      case 'errorRate':
        return `${value.toFixed(1)}%`
      default:
        return value.toString()
    }
  }

  const openGrafana = () => {
    window.open(grafanaUrl, '_blank')
  }

  const debouncedRefresh = debounced('refresh-metrics', collectMetrics, 1000)
  const throttledToggle = throttled('toggle-monitor', () => setIsVisible(!isVisible), 500)

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={throttledToggle}
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="w-4 h-4 mr-2" />
        Performance
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-2xl border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={debouncedRefresh}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openGrafana}
              className="h-6 w-6 p-0"
              title="Open Grafana Dashboard"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={throttledToggle}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {Object.entries(metrics).map(([key, value]) => {
          if (key === 'lastUpdated') return null
          
          const metricKey = key as keyof PerformanceMetrics
          const status = getMetricStatus(metricKey, value)
          const color = getMetricColor(status)
          const icon = getMetricIcon(metricKey)
          
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{formatMetricValue(metricKey, value)}</span>
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                </div>
              </div>
              
              {metricKey === 'memoryUsage' || metricKey === 'cacheHitRate' || metricKey === 'errorRate' ? (
                <Progress 
                  value={value} 
                  className="h-1"
                  style={{
                    '--progress-color': status === 'critical' ? '#ef4444' : 
                                       status === 'warning' ? '#f59e0b' : '#22c55e'
                  } as React.CSSProperties}
                />
              ) : null}
            </div>
          )
        })}
        
        <div className="pt-2 border-t text-xs text-muted-foreground">
          Last updated: {metrics.lastUpdated.toLocaleTimeString()}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex-1 text-xs"
          >
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestOptimizer.clearCache()}
            className="text-xs"
          >
            Clear Cache
          </Button>
        </div>
        
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={openGrafana}
            className="w-full text-xs"
          >
            <BarChart3 className="w-3 h-3 mr-2" />
            Open Grafana Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
