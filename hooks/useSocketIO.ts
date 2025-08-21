import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'

interface UseSocketIOOptions {
  url?: string
  autoConnect?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

export function useSocketIO(options: UseSocketIOOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    autoConnect = true,
    onConnect,
    onDisconnect,
    onError
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const socketRef = useRef<any>(null)

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return
    }

    setIsConnecting(true)
    
    try {
      // WebSocket désactivé - utiliser polling ou notifications push à la place
      console.log('[useSocketIO] WebSocket désactivé - utiliser polling ou notifications push à la place')
      
      // Simuler une connexion réussie pour la compatibilité
      setTimeout(() => {
        setIsConnected(true)
        setIsConnecting(false)
        onConnect?.()
        console.log('[useSocketIO] Mock connection successful')
      }, 100)

    } catch (error) {
      setIsConnecting(false)
      console.error('Failed to create mock connection:', error)
      toast.error('Failed to establish connection')
    }
  }, [onConnect])

  const disconnect = useCallback(() => {
    // WebSocket désactivé
    console.log('[useSocketIO] WebSocket désactivé - disconnect called')
    socketRef.current = null
    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    // WebSocket désactivé - utiliser polling ou notifications push à la place
    console.log('[useSocketIO] WebSocket désactivé - emit called:', event, data)
    return false
  }, [])

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    // WebSocket désactivé
    console.log('[useSocketIO] WebSocket désactivé - on called:', event)
  }, [])

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    // WebSocket désactivé
    console.log('[useSocketIO] WebSocket désactivé - off called:', event)
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }
    
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    emit,
    on,
    off
  }
}
