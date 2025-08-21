'use client'

import { createContext, useContext, ReactNode } from 'react'
import { usePaymentStatus } from '@/hooks/usePaymentStatus'
import { toast } from 'sonner'

interface PaymentNotificationContextType {
  isConnected: boolean
}

const PaymentNotificationContext = createContext<PaymentNotificationContextType | undefined>(undefined)

export function usePaymentNotification() {
  const context = useContext(PaymentNotificationContext)
  if (context === undefined) {
    throw new Error('usePaymentNotification must be used within a PaymentNotificationProvider')
  }
  return context
}

interface PaymentNotificationProviderProps {
  children: ReactNode
}

export function PaymentNotificationProvider({ children }: PaymentNotificationProviderProps) {
  const { isConnected } = usePaymentStatus({
    onPaymentConfirmed: (data) => {
      // Notification globale pour tous les utilisateurs
      toast.success('🎉 Paiement confirmé !', {
        description: 'Votre rendez-vous a été confirmé et payé.',
        duration: 6000,
        action: {
          label: 'Voir',
          onClick: () => {
            // Rediriger vers la page des rendez-vous
            window.location.href = '/profile/appointments'
          }
        }
      })
    },
    
    onStatusUpdated: (data) => {
      // Notification pour les changements de statut
      toast.info('📅 Statut mis à jour', {
        description: `Le statut de votre rendez-vous est maintenant : ${data.status}`,
        duration: 4000,
      })
    }
  })

  const value = {
    isConnected
  }

  return (
    <PaymentNotificationContext.Provider value={value}>
      {children}
      
      {/* Indicateur de connexion WebSocket */}
      {!isConnected && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg shadow-lg text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span>Mise à jour en cours...</span>
            </div>
          </div>
        </div>
      )}
    </PaymentNotificationContext.Provider>
  )
}


