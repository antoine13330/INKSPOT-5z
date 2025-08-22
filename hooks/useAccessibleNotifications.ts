"use client"

import { useToast } from "./use-toast"
import { useCallback } from "react"

export interface AccessibleNotificationOptions {
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  // ACCESSIBILITY: Visual indicators for different types of alerts
  visualIndicator?: '🔔' | '✅' | '⚠️' | '❌' | '💬' | '📅' | '💳' | '📢'
  priority?: 'low' | 'medium' | 'high'
  // ACCESSIBILITY: Screen reader announcements
  announceToScreenReader?: boolean
}

export function useAccessibleNotifications() {
  const { toast } = useToast()

  // ACCESSIBILITY: Screen reader announcement function
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }, [])

  // ACCESSIBILITY: Enhanced notification system for hearing-impaired users
  const showAccessibleNotification = useCallback((options: AccessibleNotificationOptions) => {
    const {
      title,
      message,
      type = 'info',
      duration = 5000,
      visualIndicator,
      priority = 'medium',
      announceToScreenReader: shouldAnnounce = true
    } = options

    // ACCESSIBILITY: Choose appropriate visual indicator based on type
    let indicator = visualIndicator
    if (!indicator) {
      switch (type) {
        case 'success':
          indicator = '✅'
          break
        case 'warning':
          indicator = '⚠️'
          break
        case 'error':
          indicator = '❌'
          break
        case 'info':
        default:
          indicator = '🔔'
          break
      }
    }

    // ACCESSIBILITY: Create accessible toast with visual indicators
    const accessibleTitle = indicator + (title ? ` ${title}` : '')
    const variant = type === 'error' ? 'destructive' : 'default'

    toast({
      title: accessibleTitle,
      description: message,
      variant,
      duration: priority === 'high' ? 10000 : duration,
      // ACCESSIBILITY: Add CSS classes for visual emphasis
      className: `
        ${priority === 'high' ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/25' : ''}
        ${priority === 'medium' ? 'ring-1 ring-blue-500/50' : ''}
        transition-all duration-300
      `
    })

    // ACCESSIBILITY: Announce to screen readers
    if (shouldAnnounce) {
      const announceMessage = `${title ? title + ': ' : ''}${message}`
      const ariaPriority = priority === 'high' ? 'assertive' : 'polite'
      announceToScreenReader(announceMessage, ariaPriority)
    }

    // ACCESSIBILITY: For high priority notifications, also focus management
    if (priority === 'high') {
      // Find the toast element and ensure it's focusable for screen readers
      setTimeout(() => {
        const toastElement = document.querySelector('[data-state="open"][role="alert"]')
        if (toastElement && toastElement instanceof HTMLElement) {
          toastElement.focus()
        }
      }, 100)
    }

  }, [toast, announceToScreenReader])

  // ACCESSIBILITY: Specific notification types with predefined settings
  const showSuccessNotification = useCallback((message: string, title?: string) => {
    showAccessibleNotification({
      title,
      message,
      type: 'success',
      visualIndicator: '✅',
      priority: 'medium'
    })
  }, [showAccessibleNotification])

  const showErrorNotification = useCallback((message: string, title?: string) => {
    showAccessibleNotification({
      title,
      message,
      type: 'error',
      visualIndicator: '❌',
      priority: 'high'
    })
  }, [showAccessibleNotification])

  const showMessageNotification = useCallback((message: string, title?: string) => {
    showAccessibleNotification({
      title,
      message,
      type: 'info',
      visualIndicator: '💬',
      priority: 'medium'
    })
  }, [showAccessibleNotification])

  const showBookingNotification = useCallback((message: string, title?: string) => {
    showAccessibleNotification({
      title,
      message,
      type: 'info',
      visualIndicator: '📅',
      priority: 'medium'
    })
  }, [showAccessibleNotification])

  const showPaymentNotification = useCallback((message: string, title?: string) => {
    showAccessibleNotification({
      title,
      message,
      type: 'info',
      visualIndicator: '💳',
      priority: 'high'
    })
  }, [showAccessibleNotification])

  return {
    showAccessibleNotification,
    showSuccessNotification,
    showErrorNotification,
    showMessageNotification,
    showBookingNotification,
    showPaymentNotification,
    announceToScreenReader
  }
}