import { toast } from 'sonner'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface UserStatus {
  userId: string
  status: 'online' | 'offline'
  conversationId: string
  timestamp: string
}

class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map()
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private messageHandlers: Map<string, (message: any) => void> = new Map()
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000

  constructor() {
    // Nettoyer les connexions au démontage de la page
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnectAll()
      })
    }
  }

  // Connecter un utilisateur à une conversation
  connect(userId: string, conversationId: string, onMessage?: (message: any) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Vérifier si une connexion existe déjà pour cet utilisateur
        if (this.connections.has(userId)) {
          console.log(`WebSocket connection already exists for user ${userId}`)
          resolve()
          return
        }

        const isBrowser = typeof window !== 'undefined'
        const wsUrl = isBrowser
          ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/websocket`
          : 'ws://localhost:3001/api/websocket'
        const ws = new WebSocket(wsUrl)
        
        // Stocker le gestionnaire de messages
        if (onMessage) {
          this.messageHandlers.set(userId, onMessage)
        }

        ws.onopen = () => {
          console.log(`WebSocket connected for user ${userId} in conversation ${conversationId}`)
          
          // Envoyer l'authentification
          ws.send(JSON.stringify({
            type: 'AUTH',
            userId: userId,
            conversationId: conversationId
          }))
          
          this.connections.set(userId, ws)
          resolve()
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            const handler = this.messageHandlers.get(userId)
            if (handler) {
              handler(message)
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        ws.onclose = (event) => {
          console.log(`WebSocket disconnected for user ${userId}`)
          this.connections.delete(userId)
          this.messageHandlers.delete(userId)
          
          // Tentative de reconnexion automatique
          this.scheduleReconnect(userId, conversationId)
        }

        ws.onerror = (error) => {
          console.error(`WebSocket error for user ${userId}:`, error)
          reject(error)
        }

      } catch (error) {
        console.error('Failed to initialize WebSocket:', error)
        reject(error)
      }
    })
  }

  // Programmer une tentative de reconnexion
  private scheduleReconnect(userId: string, conversationId: string) {
    const timeout = setTimeout(() => {
      console.log(`Attempting to reconnect user ${userId}...`)
      this.connect(userId, conversationId, this.messageHandlers.get(userId))
        .catch(error => {
          console.error(`Reconnection failed for user ${userId}:`, error)
        })
    }, this.reconnectInterval)
    
    this.reconnectTimeouts.set(userId, timeout)
  }

  // Déconnecter un utilisateur
  disconnect(userId: string) {
    const connection = this.connections.get(userId)
    if (connection) {
      connection.close()
      this.connections.delete(userId)
      this.messageHandlers.delete(userId)
    }

    const timeout = this.reconnectTimeouts.get(userId)
    if (timeout) {
      clearTimeout(timeout)
      this.reconnectTimeouts.delete(userId)
    }
  }

  // Déconnecter tous les utilisateurs
  disconnectAll() {
    for (const [userId] of this.connections) {
      this.disconnect(userId)
    }
  }

  // Envoyer un message
  send(userId: string, message: any): boolean {
    const connection = this.connections.get(userId)
    const OPEN_STATE = (typeof WebSocket !== 'undefined' && (WebSocket as any).OPEN) || 1
    if (connection && connection.readyState === OPEN_STATE) {
      connection.send(JSON.stringify(message))
      return true
    } else {
      console.warn(`WebSocket not connected for user ${userId}`)
      return false
    }
  }

  // Vérifier si un utilisateur est connecté
  isConnected(userId: string): boolean {
    const connection = this.connections.get(userId)
    const OPEN_STATE = (typeof WebSocket !== 'undefined' && (WebSocket as any).OPEN) || 1
    return connection?.readyState === OPEN_STATE
  }

  // Obtenir le nombre de connexions actives
  getActiveConnectionsCount(): number {
    return this.connections.size
  }

  // Nettoyer les connexions inactives
  cleanup() {
    for (const [userId, connection] of this.connections.entries()) {
      if (connection.readyState === WebSocket.CLOSED || connection.readyState === WebSocket.CLOSING) {
        this.connections.delete(userId)
        this.messageHandlers.delete(userId)
      }
    }
  }
}

// Instance singleton
export const websocketManager = new WebSocketManager()

// Hook personnalisé pour utiliser le gestionnaire WebSocket
export function useWebSocketManager() {
  const connect = (userId: string, conversationId: string, onMessage?: (message: any) => void) => {
    return websocketManager.connect(userId, conversationId, onMessage)
  }

  const disconnect = (userId: string) => {
    websocketManager.disconnect(userId)
  }

  const send = (userId: string, message: any) => {
    return websocketManager.send(userId, message)
  }

  const isConnected = (userId: string) => {
    return websocketManager.isConnected(userId)
  }

  return {
    connect,
    disconnect,
    send,
    isConnected,
    getActiveConnectionsCount: websocketManager.getActiveConnectionsCount.bind(websocketManager)
  }
}
