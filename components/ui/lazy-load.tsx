'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { flushSync } from 'react-dom'
import Loading from './loading'

interface LazyLoadProps {
  children: React.ReactNode
  threshold?: number
  rootMargin?: string
  fallback?: React.ReactNode
  className?: string
}

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

interface LazyComponentProps {
  component: () => Promise<{ default: React.ComponentType<unknown> }>
  fallback?: React.ReactNode
  props?: unknown
}

// Lazy Load Hook
export const useLazyLoad = (
  threshold = 0.1,
  rootMargin: string = '50px'
) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return { ref, isVisible }
}

// Lazy Load Component
export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  fallback = <Loading size="sm" />,
  className = '',
}) => {
  const { ref, isVisible } = useLazyLoad(threshold, rootMargin)

  return (
    <div ref={ref} className={className}>
      {children}
      {!isVisible && fallback}
    </div>
  )
}

// Lazy Image Component
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = '/placeholder-image.jpg',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={hasError ? placeholder : src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}

// Lazy Component Loader
export const LazyComponent: React.FC<LazyComponentProps> = ({
  component,
  fallback = <Loading size="md" />,
  props = {},
}) => {
  const [Component, setComponent] = useState<React.ComponentType<unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    component()
      .then((module) => {
        if (isMounted) {
          setComponent(() => module.default)
        }
      })
      .catch((error) => {
        console.error('Failed to load component:', error)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [component])

  if (isLoading) {
    return fallback
  }

  return Component ? <Component {...(props as any)} /> : fallback
}

// Lazy List Component
interface LazyListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  pageSize?: number
  threshold?: number
  className?: string
}

export const LazyList = <T,>({
  items,
  renderItem,
  pageSize = 10,
  threshold = 0.1,
  className = '',
}: LazyListProps<T>) => {
  const [visibleItems, setVisibleItems] = useState(pageSize)
  const { ref, isVisible } = useLazyLoad(threshold, '100px')

  useEffect(() => {
    if (isVisible && visibleItems < items.length) {
      setVisibleItems((prev) => Math.min(prev + pageSize, items.length))
    }
  }, [isVisible, visibleItems, items.length, pageSize])

  return (
    <div className={className}>
      {items.slice(0, visibleItems).map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
      {visibleItems < items.length && (
        <div ref={ref} className="flex justify-center p-4">
          <Loading size="sm" />
        </div>
      )}
    </div>
  )
}

// Lazy Modal Component
interface LazyModalProps {
  isOpen: boolean
  onClose: () => void
  component: () => Promise<{ default: React.ComponentType<unknown> }>
  fallback?: React.ReactNode
  props?: unknown
}

export const LazyModal: React.FC<LazyModalProps> = ({
  isOpen,
  onClose,
  component,
  fallback = <Loading size="lg" />,
  props = {},
}) => {
  const [ModalComponent, setModalComponent] = useState<React.ComponentType<unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && !ModalComponent) {
      setIsLoading(true)
      component()
        .then((module) => {
          setModalComponent(() => module.default)
        })
        .catch((error) => {
          console.error('Failed to load modal component:', error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, component, ModalComponent])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {isLoading ? (
          fallback
        ) : (
          ModalComponent && <ModalComponent {...(props as any)} onClose={onClose} />
        )}
      </div>
    </div>
  )
}

// Lazy Route Component
interface LazyRouteProps {
  component: () => Promise<{ default: React.ComponentType<unknown> }>
  fallback?: React.ReactNode
  props?: unknown
}

export const LazyRoute: React.FC<LazyRouteProps> = ({
  component,
  fallback = <Loading size="lg" />,
  props = {},
}) => {
  // Render Suspense with provided fallback; ensure LazyComponent itself doesn't render its own fallback simultaneously
  return (
    <Suspense fallback={fallback}>
      <LazyComponent component={component} fallback={null} props={props} />
    </Suspense>
  )
}

// Performance monitoring for lazy loading
export const useLazyLoadPerformance = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    loadCount: 0,
    errorCount: 0,
  })
  const [, setVersion] = useState(0)

  const forceRender = () => setVersion((v) => v + 1)

  const trackLoad = (loadTime: number) => {
    setMetrics((prev) => {
      const newLoadCount = prev.loadCount + 1
      const newLoadTime = prev.loadCount === 0 ? loadTime : (prev.loadTime + loadTime) / 2
      return {
        loadTime: newLoadTime,
        loadCount: newLoadCount,
        errorCount: prev.errorCount,
      }
    })
    forceRender()
  }

  const trackError = () => {
    setMetrics((prev) => ({
      loadTime: prev.loadTime,
      loadCount: prev.loadCount,
      errorCount: prev.errorCount + 1,
    }))
    forceRender()
  }

  return { metrics, trackLoad, trackError }
} 