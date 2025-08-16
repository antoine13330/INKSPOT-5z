import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'

interface WebSocketMessage {
  type: 'MESSAGE' | 'TYPING' | 'READ' | 'ONLINE_STATUS'
  data: any
  timestamp: string
}

interface UseWebSocketOptions {
  url: string
  onMessage?: (message: WebSocketMessage) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  autoReconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  autoReconnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setIsConnecting(true)
    
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        setReconnectAttempts(0)
        reconnectAttemptsRef.current = 0
        onOpen?.()
        
        // Send authentication if needed
        if (typeof window !== 'undefined' && window.localStorage) {
          const token = localStorage.getItem('next-auth.session-token')
          if (token) {
            ws.send(JSON.stringify({
              type: 'AUTH',
              data: { token }
            }))
          }
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        setIsConnecting(false)
        onClose?.()

        // Auto-reconnect logic
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          setReconnectAttempts(reconnectAttemptsRef.current)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        setIsConnecting(false)
        onError?.(error)
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      setIsConnecting(false)
      console.error('Failed to create WebSocket:', error)
    }
  }, [url, onMessage, onOpen, onClose, onError, autoReconnect, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      return true
    } else {
      toast.error("Connection lost. Trying to reconnect...")
      return false
    }
  }, [])

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    sendMessage({
      type: 'TYPING',
      data: { conversationId, isTyping },
      timestamp: new Date().toISOString()
    })
  }, [sendMessage])

  const sendMessageRead = useCallback((conversationId: string, messageId: string) => {
    sendMessage({
      type: 'READ',
      data: { conversationId, messageId },
      timestamp: new Date().toISOString()
    })
  }, [sendMessage])

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    isConnecting,
    reconnectAttempts,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    sendMessageRead
  }
}