import { useEffect } from 'react'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'
import { useRouter } from 'next/navigation'

interface PaymentStatusNotifierProps {
  appointmentId?: string
  onStatusChange?: (status: string) => void
  redirectOnPayment?: boolean
  redirectPath?: string
}

export function PaymentStatusNotifier({
  appointmentId,
  onStatusChange,
  redirectOnPayment = false,
  redirectPath = '/profile/appointments'
}: PaymentStatusNotifierProps) {
  const router = useRouter()

  const { isConnected } = usePaymentStatus({
    onPaymentConfirmed: (data) => {
      console.log('Payment confirmed:', data)
      
      // Appeler le callback personnalisé
      onStatusChange?.(data.status)
      
      // Rediriger si demandé
      if (redirectOnPayment && redirectPath) {
        setTimeout(() => {
          router.push(redirectPath)
        }, 2000) // Attendre 2 secondes pour que l'utilisateur voie la notification
      }
    },
    
    onStatusUpdated: (data) => {
      console.log('Status updated:', data)
      
      // Appeler le callback personnalisé
      onStatusChange?.(data.status)
    },
    
    autoRefresh: true,
    refreshInterval: 30000 // 30 secondes
  })

  // Écouter les événements de rafraîchissement globaux
  useEffect(() => {
    const handleGlobalRefresh = () => {
      // Rafraîchir les données de l'application
      window.location.reload()
    }

    window.addEventListener('payment-status-refresh', handleGlobalRefresh)
    
    return () => {
      window.removeEventListener('payment-status-refresh', handleGlobalRefresh)
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isConnected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Connexion en cours...</span>
          </div>
        </div>
      )}
    </div>
  )
}

