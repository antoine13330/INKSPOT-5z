import { useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface PaymentStatusUpdate {
  type: 'PAYMENT_CONFIRMED' | 'APPOINTMENT_STATUS_UPDATED'
  appointmentId: string
  status: string
  timestamp: string
}

interface UsePaymentStatusOptions {
  onPaymentConfirmed?: (data: PaymentStatusUpdate) => void
  onStatusUpdated?: (data: PaymentStatusUpdate) => void
  autoRefresh?: boolean
  refreshInterval?: number
}

export function usePaymentStatus(options: UsePaymentStatusOptions = {}) {
  const { data: session } = useSession()
  const wsRef = useRef<WebSocket | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
    onPaymentConfirmed,
    onStatusUpdated,
    autoRefresh = true,
    refreshInterval = 30000 // 30 secondes par défaut
  } = options

  // Fonction pour rafraîchir manuellement les données
  // Empêche le dispatch en boucle : on autorise un seul dispatch à la fois.
  const isRefreshingRef = useRef(false)

  const refreshData = useCallback(() => {
    if (isRefreshingRef.current) return
    isRefreshingRef.current = true

    // Émettre un événement personnalisé pour déclencher le rafraîchissement
    window.dispatchEvent(new CustomEvent('payment-status-refresh'))

    // Relâcher le flag après le tick courant
    setTimeout(() => {
      isRefreshingRef.current = false
    }, 0)
  }, [])

  // Gestion des événements WebSocket
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data: PaymentStatusUpdate = JSON.parse(event.data)
      
      if (data.type === 'PAYMENT_CONFIRMED') {
        // Afficher une notification toast
        toast.success('Paiement confirmé !', {
          description: `Le statut de votre rendez-vous a été mis à jour.`,
          duration: 5000,
        })
        
        // Appeler le callback personnalisé
        onPaymentConfirmed?.(data)
        
        // Rafraîchir automatiquement les données
        refreshData()
        
      } else if (data.type === 'APPOINTMENT_STATUS_UPDATED') {
        // Afficher une notification toast
        toast.info('Statut mis à jour', {
          description: `Le statut de votre rendez-vous est maintenant : ${data.status}`,
          duration: 3000,
        })
        
        // Appeler le callback personnalisé
        onStatusUpdated?.(data)
        
        // Rafraîchir automatiquement les données
        refreshData()
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  }, [onPaymentConfirmed, onStatusUpdated, refreshData])

  // Connexion WebSocket
  const connectWebSocket = useCallback(() => {
    if (!session?.user?.id) return

    try {
      // Utiliser l'endpoint WebSocket existant
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/ws?userId=${session.user.id}`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for payment status updates')
      }

      wsRef.current.onmessage = handleWebSocketMessage

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...')
        setTimeout(connectWebSocket, 3000)
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }, [session?.user?.id, handleWebSocketMessage])

  // Polling de fallback si WebSocket échoue
  const startPolling = useCallback(() => {
    if (!autoRefresh || !session?.user?.id) return

    refreshIntervalRef.current = setInterval(() => {
      refreshData()
    }, refreshInterval)
  }, [autoRefresh, session?.user?.id, refreshInterval, refreshData])

  // Nettoyage
  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }, [])

  // Écouter les événements de rafraîchissement
  useEffect(() => {
    const handleRefresh = () => {
      // ici on déclencherait un fetch réel; on évite de redéclencher refreshData
    }

    window.addEventListener('payment-status-refresh', handleRefresh)
    
    return () => {
      window.removeEventListener('payment-status-refresh', handleRefresh)
    }
  }, [refreshData])

  // Connexion et gestion du cycle de vie
  useEffect(() => {
    if (session?.user?.id) {
      connectWebSocket()
      startPolling()
    }

    return cleanup
  }, [session?.user?.id, connectWebSocket, startPolling, cleanup])

  return {
    refreshData,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  }
}


