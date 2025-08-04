export interface PerformanceMetrics {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  timeToInteractive: number
  memoryUsage: number
  cpuUsage: number
}

export interface APMConfig {
  enabled: boolean
  endpoint: string
  apiKey: string
  sampleRate: number
  maxEvents: number
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private config: APMConfig
  private events: PerformanceMetrics[] = []
  private observers: Map<string, PerformanceObserver> = new Map()

  private constructor() {
    this.config = {
      enabled: process.env.APM_ENABLED === 'true',
      endpoint: process.env.APM_ENDPOINT || '',
      apiKey: process.env.APM_API_KEY || '',
      sampleRate: parseFloat(process.env.APM_SAMPLE_RATE || '1.0'),
      maxEvents: parseInt(process.env.APM_MAX_EVENTS || '1000'),
    }

    if (this.config.enabled && typeof window !== 'undefined') {
      this.initializeObservers()
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private initializeObservers() {
    // Observe navigation timing
    this.observeNavigationTiming()
    
    // Observe paint timing
    this.observePaintTiming()
    
    // Observe layout shifts
    this.observeLayoutShifts()
    
    // Observe first input delay
    this.observeFirstInput()
    
    // Observe largest contentful paint
    this.observeLargestContentfulPaint()
  }

  private observeNavigationTiming() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const metrics: Partial<PerformanceMetrics> = {
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          timeToInteractive: navigation.domInteractive - navigation.fetchStart,
        }
        this.recordMetrics(metrics)
      }
    }
  }

  private observePaintTiming() {
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetrics({
              firstContentfulPaint: entry.startTime,
            })
          }
        }
      })
      
      paintObserver.observe({ entryTypes: ['paint'] })
      this.observers.set('paint', paintObserver)
    }
  }

  private observeLayoutShifts() {
    if ('PerformanceObserver' in window) {
      const layoutObserver = new PerformanceObserver((list) => {
        let cumulativeLayoutShift = 0
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cumulativeLayoutShift += (entry as any).value
          }
        }
        this.recordMetrics({
          cumulativeLayoutShift,
        })
      })
      
      layoutObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.set('layout-shift', layoutObserver)
    }
  }

  private observeFirstInput() {
    if ('PerformanceObserver' in window) {
      const inputObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetrics({
            firstInputDelay: entry.processingStart - entry.startTime,
          })
        }
      })
      
      inputObserver.observe({ entryTypes: ['first-input'] })
      this.observers.set('first-input', inputObserver)
    }
  }

  private observeLargestContentfulPaint() {
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetrics({
            largestContentfulPaint: entry.startTime,
          })
        }
      })
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.set('largest-contentful-paint', lcpObserver)
    }
  }

  private recordMetrics(metrics: Partial<PerformanceMetrics>) {
    if (!this.config.enabled) return

    // Apply sampling
    if (Math.random() > this.config.sampleRate) return

    const fullMetrics: PerformanceMetrics = {
      pageLoadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      timeToInteractive: 0,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
      ...metrics,
    }

    this.events.push(fullMetrics)

    // Limit events array size
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents)
    }

    // Send to APM service
    this.sendToAPM(fullMetrics)
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  private getCPUUsage(): number {
    // This would require a more sophisticated implementation
    // For now, return a placeholder
    return 0
  }

  private async sendToAPM(metrics: PerformanceMetrics) {
    if (!this.config.endpoint || !this.config.apiKey) return

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metrics,
        }),
      })
    } catch (error) {
      console.error('Failed to send metrics to APM:', error)
    }
  }

  // Public API
  getMetrics(): PerformanceMetrics[] {
    return [...this.events]
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.events.length > 0 ? this.events[this.events.length - 1] : null
  }

  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.events.length === 0) return {}

    const sums = this.events.reduce(
      (acc, event) => ({
        pageLoadTime: acc.pageLoadTime + event.pageLoadTime,
        firstContentfulPaint: acc.firstContentfulPaint + event.firstContentfulPaint,
        largestContentfulPaint: acc.largestContentfulPaint + event.largestContentfulPaint,
        cumulativeLayoutShift: acc.cumulativeLayoutShift + event.cumulativeLayoutShift,
        firstInputDelay: acc.firstInputDelay + event.firstInputDelay,
        timeToInteractive: acc.timeToInteractive + event.timeToInteractive,
        memoryUsage: acc.memoryUsage + event.memoryUsage,
        cpuUsage: acc.cpuUsage + event.cpuUsage,
      }),
      {
        pageLoadTime: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        timeToInteractive: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      }
    )

    const count = this.events.length
    return {
      pageLoadTime: sums.pageLoadTime / count,
      firstContentfulPaint: sums.firstContentfulPaint / count,
      largestContentfulPaint: sums.largestContentfulPaint / count,
      cumulativeLayoutShift: sums.cumulativeLayoutShift / count,
      firstInputDelay: sums.firstInputDelay / count,
      timeToInteractive: sums.timeToInteractive / count,
      memoryUsage: sums.memoryUsage / count,
      cpuUsage: sums.cpuUsage / count,
    }
  }

  // Custom performance marks
  mark(name: string) {
    if ('performance' in window) {
      performance.mark(name)
    }
  }

  measure(name: string, startMark: string, endMark: string) {
    if ('performance' in window) {
      try {
        const measure = performance.measure(name, startMark, endMark)
        this.recordMetrics({
          pageLoadTime: measure.duration,
        })
      } catch (error) {
        console.error('Failed to measure performance:', error)
      }
    }
  }

  // Clear events
  clearEvents() {
    this.events = []
  }

  // Disconnect observers
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers.clear()
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// Performance monitoring hooks
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  useEffect(() => {
    const updateMetrics = () => {
      const latest = performanceMonitor.getLatestMetrics()
      if (latest) {
        setMetrics(latest)
      }
    }

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000)
    updateMetrics() // Initial update

    return () => clearInterval(interval)
  }, [])

  return { metrics, performanceMonitor }
}

// Performance budget monitoring
export interface PerformanceBudget {
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
}

export const checkPerformanceBudget = (metrics: PerformanceMetrics, budget: PerformanceBudget) => {
  const violations: string[] = []

  if (metrics.pageLoadTime > budget.pageLoadTime) {
    violations.push(`Page load time (${metrics.pageLoadTime}ms) exceeds budget (${budget.pageLoadTime}ms)`)
  }

  if (metrics.firstContentfulPaint > budget.firstContentfulPaint) {
    violations.push(`First contentful paint (${metrics.firstContentfulPaint}ms) exceeds budget (${budget.firstContentfulPaint}ms)`)
  }

  if (metrics.largestContentfulPaint > budget.largestContentfulPaint) {
    violations.push(`Largest contentful paint (${metrics.largestContentfulPaint}ms) exceeds budget (${budget.largestContentfulPaint}ms)`)
  }

  if (metrics.cumulativeLayoutShift > budget.cumulativeLayoutShift) {
    violations.push(`Cumulative layout shift (${metrics.cumulativeLayoutShift}) exceeds budget (${budget.cumulativeLayoutShift})`)
  }

  if (metrics.firstInputDelay > budget.firstInputDelay) {
    violations.push(`First input delay (${metrics.firstInputDelay}ms) exceeds budget (${budget.firstInputDelay}ms)`)
  }

  return {
    violations,
    isWithinBudget: violations.length === 0,
  }
} 