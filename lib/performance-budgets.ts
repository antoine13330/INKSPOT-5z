import { performanceMonitor } from './performance-monitor'
import { redisCache } from './redis-cache'
import { databaseOptimizer } from './database-optimizer'

export interface PerformanceBudget {
  name: string
  metric: string
  threshold: number
  unit: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
}

export interface BudgetViolation {
  budget: PerformanceBudget
  currentValue: number
  threshold: number
  timestamp: Date
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface PerformanceAlert {
  id: string
  type: 'BUDGET_VIOLATION' | 'PERFORMANCE_DEGRADATION' | 'RESOURCE_EXHAUSTION'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  details: unknown
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
}

class PerformanceBudgets {
  private static instance: PerformanceBudgets
  private budgets: PerformanceBudget[] = []
  private violations: BudgetViolation[] = []
  private alerts: PerformanceAlert[] = []

  private constructor() {
    this.initializeBudgets()
  }

  static getInstance(): PerformanceBudgets {
    if (!PerformanceBudgets.instance) {
      PerformanceBudgets.instance = new PerformanceBudgets()
    }
    return PerformanceBudgets.instance
  }

  private initializeBudgets() {
    // Frontend performance budgets
    this.budgets = [
      // Page load time
      {
        name: 'Page Load Time',
        metric: 'pageLoadTime',
        threshold: 3000, // 3 seconds
        unit: 'ms',
        severity: 'HIGH',
        description: 'Maximum time for page to load completely',
      },
      
      // First Contentful Paint
      {
        name: 'First Contentful Paint',
        metric: 'firstContentfulPaint',
        threshold: 1500, // 1.5 seconds
        unit: 'ms',
        severity: 'HIGH',
        description: 'Time to first contentful paint',
      },
      
      // Largest Contentful Paint
      {
        name: 'Largest Contentful Paint',
        metric: 'largestContentfulPaint',
        threshold: 2500, // 2.5 seconds
        unit: 'ms',
        severity: 'MEDIUM',
        description: 'Time to largest contentful paint',
      },
      
      // Cumulative Layout Shift
      {
        name: 'Cumulative Layout Shift',
        metric: 'cumulativeLayoutShift',
        threshold: 0.1, // 10%
        unit: '',
        severity: 'MEDIUM',
        description: 'Cumulative layout shift score',
      },
      
      // First Input Delay
      {
        name: 'First Input Delay',
        metric: 'firstInputDelay',
        threshold: 100, // 100ms
        unit: 'ms',
        severity: 'HIGH',
        description: 'Time to first input response',
      },
      
      // Memory usage
      {
        name: 'Memory Usage',
        metric: 'memoryUsage',
        threshold: 50 * 1024 * 1024, // 50MB
        unit: 'bytes',
        severity: 'MEDIUM',
        description: 'Maximum memory usage per page',
      },
      
      // Database query time
      {
        name: 'Database Query Time',
        metric: 'dbQueryTime',
        threshold: 100, // 100ms
        unit: 'ms',
        severity: 'HIGH',
        description: 'Maximum time for database queries',
      },
      
      // Cache hit rate
      {
        name: 'Cache Hit Rate',
        metric: 'cacheHitRate',
        threshold: 0.8, // 80%
        unit: '%',
        severity: 'MEDIUM',
        description: 'Minimum cache hit rate',
      },
      
      // API response time
      {
        name: 'API Response Time',
        metric: 'apiResponseTime',
        threshold: 500, // 500ms
        unit: 'ms',
        severity: 'HIGH',
        description: 'Maximum API response time',
      },
      
      // Bundle size
      {
        name: 'JavaScript Bundle Size',
        metric: 'bundleSize',
        threshold: 500 * 1024, // 500KB
        unit: 'bytes',
        severity: 'MEDIUM',
        description: 'Maximum JavaScript bundle size',
      },
    ]
  }

  // Check all budgets
  async checkBudgets(): Promise<BudgetViolation[]> {
    const violations: BudgetViolation[] = []
    
    for (const budget of this.budgets) {
      const violation = await this.checkBudget(budget)
      if (violation) {
        violations.push(violation)
        await this.createAlert(violation)
      }
    }
    
    this.violations.push(...violations)
    return violations
  }

  // Check individual budget
  private async checkBudget(budget: PerformanceBudget): Promise<BudgetViolation | null> {
    let currentValue = 0
    
    switch (budget.metric) {
      case 'pageLoadTime':
      case 'firstContentfulPaint':
      case 'largestContentfulPaint':
      case 'cumulativeLayoutShift':
      case 'firstInputDelay':
      case 'memoryUsage': {
        const metrics = performanceMonitor.getLatestMetrics()
        if (metrics) {
          currentValue = metrics[budget.metric as keyof typeof metrics] || 0
        }
        break
      }
        
      case 'dbQueryTime': {
        const queryStats = databaseOptimizer.getQueryStats()
        currentValue = queryStats.reduce((sum, stat) => sum + stat.executionTime, 0) / queryStats.length
        break
      }
        
      case 'cacheHitRate': {
        const cacheStats = await redisCache.getStats()
        currentValue = cacheStats.hits / (cacheStats.hits + cacheStats.misses)
        break
      }
        
      case 'apiResponseTime':
        // This would be measured from API middleware
        currentValue = 0 // Placeholder
        break
        
      case 'bundleSize':
        // This would be measured during build
        currentValue = 0 // Placeholder
        break
    }
    
    if (currentValue > budget.threshold) {
      return {
        budget,
        currentValue,
        threshold: budget.threshold,
        timestamp: new Date(),
        severity: budget.severity,
      }
    }
    
    return null
  }

  // Create performance alert
  private async createAlert(violation: BudgetViolation): Promise<void> {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'BUDGET_VIOLATION',
      severity: violation.severity,
      message: `${violation.budget.name} exceeded threshold`,
      details: {
        budget: violation.budget,
        currentValue: violation.currentValue,
        threshold: violation.threshold,
        unit: violation.budget.unit,
      },
      timestamp: violation.timestamp,
      resolved: false,
    }
    
    this.alerts.push(alert)
    
    // Send alert notification
    await this.sendAlertNotification(alert)
  }

  // Send alert notification
  private async sendAlertNotification(alert: PerformanceAlert): Promise<void> {
    // Implementation would integrate with notification service
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${alert.severity}] Performance Alert: ${alert.message}`, alert.details)
    }
    
    // Send to external monitoring service
    if (process.env.PERFORMANCE_MONITORING_URL) {
      try {
        await fetch(process.env.PERFORMANCE_MONITORING_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PERFORMANCE_MONITORING_TOKEN}`,
          },
          body: JSON.stringify(alert),
        })
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to send performance alert:', error)
        }
      }
    }
  }

  // Get all budgets
  getBudgets(): PerformanceBudget[] {
    return [...this.budgets]
  }

  // Add new budget
  addBudget(budget: PerformanceBudget): void {
    this.budgets.push(budget)
  }

  // Update budget
  updateBudget(name: string, updates: Partial<PerformanceBudget>): boolean {
    const index = this.budgets.findIndex(b => b.name === name)
    if (index !== -1) {
      this.budgets[index] = { ...this.budgets[index], ...updates }
      return true
    }
    return false
  }

  // Remove budget
  removeBudget(name: string): boolean {
    const index = this.budgets.findIndex(b => b.name === name)
    if (index !== -1) {
      this.budgets.splice(index, 1)
      return true
    }
    return false
  }

  // Get violations
  getViolations(filters?: {
    severity?: string[]
    startDate?: Date
    endDate?: Date
  }): BudgetViolation[] {
    let violations = [...this.violations]
    
    if (filters?.severity?.length) {
      violations = violations.filter(v => filters.severity!.includes(v.severity))
    }
    
    if (filters?.startDate) {
      violations = violations.filter(v => v.timestamp >= filters.startDate!)
    }
    
    if (filters?.endDate) {
      violations = violations.filter(v => v.timestamp <= filters.endDate!)
    }
    
    return violations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Get alerts
  getAlerts(filters?: {
    type?: string[]
    severity?: string[]
    resolved?: boolean
  }): PerformanceAlert[] {
    let alerts = [...this.alerts]
    
    if (filters?.type?.length) {
      alerts = alerts.filter(a => filters.type!.includes(a.type))
    }
    
    if (filters?.severity?.length) {
      alerts = alerts.filter(a => filters.severity!.includes(a.severity))
    }
    
    if (filters?.resolved !== undefined) {
      alerts = alerts.filter(a => a.resolved === filters.resolved)
    }
    
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Resolve alert
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = new Date()
      return true
    }
    return false
  }

  // Get performance summary
  async getPerformanceSummary(): Promise<{
    totalBudgets: number
    violations: number
    alerts: number
    criticalAlerts: number
    averageViolations: number
    topViolations: BudgetViolation[]
  }> {
    const violations = this.getViolations()
    const alerts = this.getAlerts()
    
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length
    const topViolations = violations
      .sort((a, b) => (b.currentValue / b.threshold) - (a.currentValue / a.threshold))
      .slice(0, 5)
    
    return {
      totalBudgets: this.budgets.length,
      violations: violations.length,
      alerts: alerts.length,
      criticalAlerts,
      averageViolations: violations.length / this.budgets.length,
      topViolations,
    }
  }

  // Generate performance report
  async generatePerformanceReport(): Promise<string> {
    const summary = await this.getPerformanceSummary()
    const violations = this.getViolations()
    const alerts = this.getAlerts()
    
    let report = `# Performance Budget Report\n\n`
    report += `## Summary\n`
    report += `- Total Budgets: ${summary.totalBudgets}\n`
    report += `- Violations: ${summary.violations}\n`
    report += `- Alerts: ${summary.alerts}\n`
    report += `- Critical Alerts: ${summary.criticalAlerts}\n\n`
    
    if (summary.topViolations.length > 0) {
      report += `## Top Violations\n`
      summary.topViolations.forEach((violation, index) => {
        report += `${index + 1}. ${violation.budget.name}: ${violation.currentValue}${violation.budget.unit} (threshold: ${violation.threshold}${violation.budget.unit})\n`
      })
      report += `\n`
    }
    
    if (alerts.length > 0) {
      report += `## Recent Alerts\n`
      alerts.slice(0, 10).forEach(alert => {
        report += `- [${alert.severity}] ${alert.message} (${alert.timestamp.toISOString()})\n`
      })
    }
    
    return report
  }
}

export const performanceBudgets = PerformanceBudgets.getInstance()

// Performance budget monitoring hook
export const usePerformanceBudgets = () => {
  const [violations, setViolations] = useState<BudgetViolation[]>([])
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [summary, setSummary] = useState<unknown>(null)

  useEffect(() => {
    const updateBudgets = async () => {
      const newViolations = await performanceBudgets.checkBudgets()
      const newAlerts = performanceBudgets.getAlerts()
      const newSummary = await performanceBudgets.getPerformanceSummary()
      
      setViolations(newViolations)
      setAlerts(newAlerts)
      setSummary(newSummary)
    }

    // Check budgets every 30 seconds
    const interval = setInterval(updateBudgets, 30000)
    updateBudgets() // Initial check

    return () => clearInterval(interval)
  }, [])

  return { violations, alerts, summary, performanceBudgets }
} 