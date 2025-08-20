import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { MessageCircle, User } from 'lucide-react'

interface Message {
  id: string
  content: string
  senderId: string
  conversationId: string
  createdAt: string
  sender?: {
    username: string
    firstName?: string
    lastName?: string
  }
}

interface ConversationNotification {
  id: string
  messageId: string
  conversationId: string
  senderName: string
  content: string
  timestamp: string
  read: boolean
}

export function useConversationNotifications() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<ConversationNotification[]>([])
  const lastSeenRef = useRef<Date | null>(null)
  const isInConversationRef = useRef(false)
  const isInConversationsListRef = useRef(false)

  // Initialiser la date de dernière connexion
  useEffect(() => {
    if (session?.user?.id) {
      const lastSeen = localStorage.getItem(`lastSeen_${session.user.id}`)
      if (lastSeen) {
        lastSeenRef.current = new Date(lastSeen)
      } else {
        lastSeenRef.current = new Date()
        localStorage.setItem(`lastSeen_${session.user.id}`, lastSeenRef.current.toISOString())
      }
    }
  }, [session?.user?.id])

  // Mettre à jour la date de dernière connexion
  useEffect(() => {
    if (session?.user?.id) {
      const updateLastSeen = () => {
        const now = new Date()
        lastSeenRef.current = now
        localStorage.setItem(`lastSeen_${session.user.id}`, now.toISOString())
      }

      // Mettre à jour quand l'utilisateur devient actif
      const handleUserActivity = () => {
        updateLastSeen()
      }

      // Mettre à jour avant que l'utilisateur quitte la page
      const handleBeforeUnload = () => {
        updateLastSeen()
      }

      window.addEventListener('focus', handleUserActivity)
      window.addEventListener('click', handleUserActivity)
      window.addEventListener('keydown', handleUserActivity)
      window.addEventListener('beforeunload', handleBeforeUnload)

      return () => {
        window.removeEventListener('focus', handleUserActivity)
        window.removeEventListener('click', handleUserActivity)
        window.removeEventListener('keydown', handleUserActivity)
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }, [session?.user?.id])

  // Fonction pour notifier qu'on est dans une conversation
  const setInConversation = (conversationId: string | null) => {
    isInConversationRef.current = !!conversationId
  }

  // Fonction pour notifier qu'on est dans la liste des conversations
  const setInConversationsList = (inList: boolean) => {
    isInConversationsListRef.current = inList
  }

  // Fonction pour traiter un nouveau message
  const handleNewMessage = (message: Message, conversationId: string) => {
    if (!session?.user?.id || message.senderId === session.user.id) {
      return // Ignorer ses propres messages
    }

    // Vérifier si le message est récent (après la dernière connexion)
    const messageDate = new Date(message.createdAt)
    const lastSeen = lastSeenRef.current
    if (lastSeen && messageDate <= lastSeen) {
      return // Message trop ancien
    }

    // Créer la notification
    const senderName = message.sender?.firstName && message.sender?.lastName
      ? `${message.sender.firstName} ${message.sender.lastName}`
      : message.sender?.username || 'Utilisateur'

    const notification: ConversationNotification = {
      id: `${message.id}_${Date.now()}`,
      messageId: message.id,
      conversationId,
      senderName,
      content: message.content,
      timestamp: message.createdAt,
      read: false
    }

    // Ajouter à la liste des notifications
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Garder max 10 notifications

    // Mettre à jour le compteur de messages non lus
    setUnreadCount(prev => prev + 1)

    // Afficher la notification toast seulement si on n'est pas dans la conversation
    if (!isInConversationRef.current || isInConversationRef.current && !isInConversationsListRef.current) {
      showMessageToast(notification)
    }
  }

  // Fonction pour afficher une notification toast
  const showMessageToast = (notification: ConversationNotification) => {
    const truncatedContent = notification.content.length > 50 
      ? notification.content.substring(0, 50) + '...'
      : notification.content

    toast(
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-sm text-gray-900">
              {notification.senderName}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-1">{truncatedContent}</p>
          <p className="text-xs text-gray-500">
            {new Date(notification.timestamp).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>,
      {
        duration: 5000,
        position: 'top-right',
        action: {
          label: 'Voir',
          onClick: () => {
            // Rediriger vers la conversation
            window.location.href = `/conversations/${notification.conversationId}`
          }
        }
      }
    )
  }

  // Marquer une notification comme lue
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }

  // Marquer toutes les notifications d'une conversation comme lues
  const markConversationAsRead = (conversationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.conversationId === conversationId ? { ...n, read: true } : n
      )
    )
    
    // Mettre à jour le compteur
    const unreadInConversation = notifications.filter(n => 
      n.conversationId === conversationId && !n.read
    ).length
    setUnreadCount(prev => Math.max(0, prev - unreadInConversation))
  }

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  // Nettoyer les anciennes notifications
  useEffect(() => {
    const cleanup = setInterval(() => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      setNotifications(prev => 
        prev.filter(n => new Date(n.timestamp) > oneDayAgo)
      )
    }, 60 * 60 * 1000) // Nettoyer toutes les heures

    return () => clearInterval(cleanup)
  }, [])

  return {
    unreadCount,
    notifications: notifications.filter(n => !n.read),
    allNotifications: notifications,
    handleNewMessage,
    setInConversation,
    setInConversationsList,
    markNotificationAsRead,
    markConversationAsRead,
    markAllAsRead
  }
}
