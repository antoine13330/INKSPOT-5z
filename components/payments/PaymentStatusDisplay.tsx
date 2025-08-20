import { useState, useEffect } from 'react'
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'

interface PaymentStatusDisplayProps {
  appointmentId: string
  initialStatus: string
  amount: number
  currency: string
  className?: string
}

const statusConfig = {
  PENDING: {
    label: 'En attente de paiement',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  COMPLETED: {
    label: 'Paiement confirmé',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  FAILED: {
    label: 'Paiement échoué',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  REFUNDED: {
    label: 'Paiement remboursé',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
}

export function PaymentStatusDisplay({
  appointmentId,
  initialStatus,
  amount,
  currency,
  className = ''
}: PaymentStatusDisplayProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const { isConnected } = usePaymentStatus({
    onPaymentConfirmed: (data) => {
      if (data.appointmentId === appointmentId) {
        setCurrentStatus(data.status)
        setIsUpdating(true)
        
        // Réinitialiser l'état après 2 secondes
        setTimeout(() => setIsUpdating(false), 2000)
      }
    },
    
    onStatusUpdated: (data) => {
      if (data.appointmentId === appointmentId) {
        setCurrentStatus(data.status)
        setIsUpdating(true)
        
        // Réinitialiser l'état après 2 secondes
        setTimeout(() => setIsUpdating(false), 2000)
      }
    }
  })

  const config = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.PENDING
  const IconComponent = config.icon

  return (
    <div className={`${className}`}>
      <div className={`
        ${config.bgColor} ${config.borderColor}
        border rounded-lg p-4 transition-all duration-300
        ${isUpdating ? 'scale-105 shadow-lg' : ''}
      `}>
        <div className="flex items-center space-x-3">
          <IconComponent className={`h-5 w-5 ${config.color}`} />
          <div className="flex-1">
            <p className={`font-medium ${config.color}`}>
              {config.label}
            </p>
            <p className="text-sm text-gray-600">
              {amount} {currency}
            </p>
          </div>
          
          {isUpdating && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
        
        {!isConnected && (
          <div className="mt-2 text-xs text-gray-500">
            Mise à jour en temps réel non disponible
          </div>
        )}
      </div>
    </div>
  )
}

