import { useCallback, useMemo, useRef, useEffect, useState } from 'react'

// Performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private cache = new Map<string, any>()
  private debounceTimers = new Map<string, NodeJS.Timeout>()
  private throttleTimers = new Map<string, number>()

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  // Smart caching with TTL
  cacheWithTTL<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): T {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    }
    this.cache.set(key, item)
    return data
  }

  getCached<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  // Debounced function execution
  debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key)!)
      }
      
      const timer = setTimeout(() => {
        func(...args)
        this.debounceTimers.delete(key)
      }, delay)
      
      this.debounceTimers.set(key, timer)
    }
  }

  // Throttled function execution
  throttle<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    limit: number = 100
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const now = Date.now()
      const lastCall = this.throttleTimers.get(key) || 0
      
      if (now - lastCall >= limit) {
        func(...args)
        this.throttleTimers.set(key, now)
      }
    }
  }

  // Clear all caches and timers
  clearAll(): void {
    this.cache.clear()
    this.debounceTimers.forEach(timer => clearTimeout(timer))
    this.debounceTimers.clear()
    this.throttleTimers.clear()
  }
}

// React hooks for performance optimization
export function usePerformanceOptimizer() {
  const optimizer = useMemo(() => PerformanceOptimizer.getInstance(), [])
  
  const debounced = useCallback(
    <T extends (...args: any[]) => any>(
      key: string,
      func: T,
      delay: number = 300
    ) => optimizer.debounce(key, func, delay),
    [optimizer]
  )

  const throttled = useCallback(
    <T extends (...args: any[]) => any>(
      key: string,
      func: T,
      limit: number = 100
    ) => optimizer.throttle(key, func, limit),
    [optimizer]
  )

  const cacheData = useCallback(
    <T>(key: string, data: T, ttl?: number) => optimizer.cacheWithTTL(key, data, ttl),
    [optimizer]
  )

  const getCachedData = useCallback(
    <T>(key: string) => optimizer.getCached<T>(key),
    [optimizer]
  )

  return {
    debounced,
    throttled,
    cacheData,
    getCachedData,
    clearAll: optimizer.clearAll.bind(optimizer)
  }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const elementRef = useRef<HTMLElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [options])

  return { elementRef, isIntersecting }
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }))
  }, [items, itemHeight, containerHeight, scrollTop])

  const totalHeight = items.length * itemHeight

  return {
    visibleItems,
    totalHeight,
    scrollTop,
    setScrollTop
  }
}

// Memory management utilities
export function useMemoryOptimization() {
  const cleanupRef = useRef<(() => void)[]>([])

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupRef.current.push(cleanup)
  }, [])

  const cleanup = useCallback(() => {
    cleanupRef.current.forEach(fn => fn())
    cleanupRef.current = []
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  return { addCleanup, cleanup }
}

// Network request optimization
export class RequestOptimizer {
  private pendingRequests = new Map<string, Promise<any>>()
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  async request<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: { ttl?: number; dedupe?: boolean } = {}
  ): Promise<T> {
    const { ttl = 5 * 60 * 1000, dedupe = true } = options

    // Check cache first
    const cached = this.requestCache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    // Deduplicate requests
    if (dedupe && this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Make request
    const request = requestFn().then(data => {
      this.requestCache.set(key, { data, timestamp: Date.now(), ttl })
      this.pendingRequests.delete(key)
      return data
    })

    if (dedupe) {
      this.pendingRequests.set(key, request)
    }

    return request
  }

  clearCache(): void {
    this.requestCache.clear()
  }

  clearPending(): void {
    this.pendingRequests.clear()
  }
}

export const requestOptimizer = new RequestOptimizer()
