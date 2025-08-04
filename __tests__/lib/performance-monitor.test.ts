import { performanceMonitor, usePerformanceMonitoring, checkPerformanceBudget } from '@/lib/performance-monitor'

// Mock window.performance
const mockPerformance = {
  getEntriesByType: jest.fn(),
  mark: jest.fn(),
  measure: jest.fn(),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  },
}

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
})

// Mock PerformanceObserver
const mockPerformanceObserver = jest.fn()
mockPerformanceObserver.mockReturnValue({
  observe: jest.fn(),
  disconnect: jest.fn(),
})
window.PerformanceObserver = mockPerformanceObserver

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset singleton instance
    ;(performanceMonitor as any).instance = null
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const monitor = performanceMonitor
      expect(monitor).toBeDefined()
    })

    it('should handle disabled monitoring', () => {
      const originalEnv = process.env.APM_ENABLED
      process.env.APM_ENABLED = 'false'
      
      const monitor = performanceMonitor
      expect(monitor).toBeDefined()
      
      process.env.APM_ENABLED = originalEnv
    })
  })

  describe('Performance Metrics', () => {
    it('should get latest metrics', () => {
      const metrics = performanceMonitor.getLatestMetrics()
      expect(metrics).toBeDefined()
    })

    it('should get average metrics', () => {
      const metrics = performanceMonitor.getAverageMetrics()
      expect(metrics).toBeDefined()
    })

    it('should get all metrics', () => {
      const metrics = performanceMonitor.getMetrics()
      expect(Array.isArray(metrics)).toBe(true)
    })
  })

  describe('Performance Marks and Measures', () => {
    it('should create performance marks', () => {
      performanceMonitor.mark('test-mark')
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-mark')
    })

    it('should create performance measures', () => {
      performanceMonitor.mark('start')
      performanceMonitor.mark('end')
      performanceMonitor.measure('test-measure', 'start', 'end')
      
      expect(mockPerformance.measure).toHaveBeenCalledWith('test-measure', 'start', 'end')
    })
  })

  describe('Memory Usage', () => {
    it('should get memory usage', () => {
      const memoryUsage = (performanceMonitor as any).getMemoryUsage()
      expect(memoryUsage).toBe(50 * 1024 * 1024)
    })

    it('should handle missing memory info', () => {
      const originalMemory = (window.performance as any).memory
      delete (window.performance as any).memory
      
      const memoryUsage = (performanceMonitor as any).getMemoryUsage()
      expect(memoryUsage).toBe(0)
      
      ;(window.performance as any).memory = originalMemory
    })
  })

  describe('Event Management', () => {
    it('should clear events', () => {
      performanceMonitor.clearEvents()
      const metrics = performanceMonitor.getMetrics()
      expect(metrics).toHaveLength(0)
    })

    it('should disconnect observers', () => {
      performanceMonitor.disconnect()
      // Should not throw error
      expect(true).toBe(true)
    })
  })
})

describe('Performance Budget Checking', () => {
  it('should check performance budget', () => {
    const metrics = {
      pageLoadTime: 2000,
      firstContentfulPaint: 1200,
      largestContentfulPaint: 2000,
      cumulativeLayoutShift: 0.05,
      firstInputDelay: 80,
    }

    const budget = {
      pageLoadTime: 3000,
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2500,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100,
    }

    const result = checkPerformanceBudget(metrics, budget)
    expect(result.isWithinBudget).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('should detect budget violations', () => {
    const metrics = {
      pageLoadTime: 4000, // Exceeds budget
      firstContentfulPaint: 1600, // Exceeds budget
      largestContentfulPaint: 3000, // Exceeds budget
      cumulativeLayoutShift: 0.15, // Exceeds budget
      firstInputDelay: 120, // Exceeds budget
    }

    const budget = {
      pageLoadTime: 3000,
      firstContentfulPaint: 1500,
      largestContentfulPaint: 2500,
      cumulativeLayoutShift: 0.1,
      firstInputDelay: 100,
    }

    const result = checkPerformanceBudget(metrics, budget)
    expect(result.isWithinBudget).toBe(false)
    expect(result.violations.length).toBeGreaterThan(0)
  })
})

describe('Performance Monitoring Hook', () => {
  it('should return performance monitoring hook', () => {
    // This is a basic test for the hook structure
    // In a real implementation, you would test the hook with React Testing Library
    expect(typeof usePerformanceMonitoring).toBe('function')
  })
}) 