import { useEffect, useRef } from 'react'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'

interface AutoRefreshAppointmentsProps {
  onRefresh: () => void
  children: React.ReactNode
  className?: string
}

export function AutoRefreshAppointments({
  onRefresh,
  children,
  className = ''
}: AutoRefreshAppointmentsProps) {
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  usePaymentStatus({
    onPaymentConfirmed: () => {
      // Rafraîchir immédiatement
      onRefresh()
      
      // Rafraîchir à nouveau après 3 secondes pour s'assurer que tout est à jour
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        onRefresh()
      }, 3000)
    },
    
    onStatusUpdated: () => {
      // Rafraîchir immédiatement
      onRefresh()
    }
  })

  // Nettoyage du timeout
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={className}>
      {children}
    </div>
  )
}


