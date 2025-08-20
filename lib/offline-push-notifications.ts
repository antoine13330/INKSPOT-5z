import { prisma } from "./prisma"
import { sendNotificationToUser, NotificationPayload } from "./notifications"
import { getSocketIOServer } from "./websocket"

/**
 * Système de notifications push pour utilisateurs hors ligne
 * Détecte automatiquement si un utilisateur est hors ligne et lui envoie une notification push
 */

export interface OfflineNotificationContext {
  type: 'message' | 'proposal' | 'image' | 'booking' | 'collaboration'
  recipientId: string
  senderId: string
  data: {
    conversationId?: string
    proposalId?: string
    bookingId?: string
    collaborationId?: string
    postId?: string
    imageUrl?: string
    senderName?: string
    content?: string
    title?: string
    [key: string]: any
  }
}

/**
 * Vérifie si un utilisateur est actuellement hors ligne
 * Se base sur le système WebSocket existant pour détecter les utilisateurs connectés
 */
export async function isUserOffline(userId: string): Promise<boolean> {
  try {
    const socketIOServer = getSocketIOServer()
    
    if (!socketIOServer) {
      console.warn('SocketIO server not available, assuming user is offline')
      return true
    }

    // Vérifier si l'utilisateur a des sockets connectées
    const sockets = await socketIOServer.fetchSockets()
    const userConnected = sockets.some((socket: any) => socket.data?.userId === userId)
    
    if (userConnected) {
      return false
    }

    // Vérification additionnelle via lastActiveAt si disponible
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActiveAt: true }
    })

    if (user?.lastActiveAt) {
      const minutesSinceLastActive = Math.floor(
        (Date.now() - user.lastActiveAt.getTime()) / (1000 * 60)
      )
      // Considérer comme hors ligne si pas d'activité depuis plus de 5 minutes
      return minutesSinceLastActive > 5
    }

    return true
  } catch (error) {
    console.error('Error checking if user is offline:', error)
    // En cas d'erreur, considérer comme hors ligne pour garantir l'envoi de notifications
    return true
  }
}

/**
 * Envoie une notification push si l'utilisateur est hors ligne
 */
export async function sendOfflinePushNotification(context: OfflineNotificationContext): Promise<boolean> {
  try {
    const isOffline = await isUserOffline(context.recipientId)
    
    if (!isOffline) {
      console.log(`User ${context.recipientId} is online, skipping push notification`)
      return false
    }

    // Vérifier que l'utilisateur a des abonnements push actifs
    const pushSubscriptions = await prisma.pushSubscription.findMany({
      where: { userId: context.recipientId }
    })

    if (pushSubscriptions.length === 0) {
      console.log(`User ${context.recipientId} has no push subscriptions`)
      return false
    }

    const notificationPayload = await createNotificationPayload(context)
    const success = await sendNotificationToUser(context.recipientId, notificationPayload)

    if (success) {
      console.log(`Push notification sent to offline user ${context.recipientId} for ${context.type}`)
    }

    return success
  } catch (error) {
    console.error('Error sending offline push notification:', error)
    return false
  }
}

/**
 * Crée le payload de notification adapté au type d'événement
 */
async function createNotificationPayload(context: OfflineNotificationContext): Promise<NotificationPayload> {
  const { type, data } = context

  // Récupérer les informations de l'expéditeur
  const sender = await prisma.user.findUnique({
    where: { id: context.senderId },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      businessName: true,
      avatar: true
    }
  })

  const senderName = data.senderName || 
    (sender?.firstName && sender?.lastName ? `${sender.firstName} ${sender.lastName}` : 
     sender?.businessName || sender?.username || 'Un utilisateur')

  switch (type) {
    case 'message':
      return {
        title: `Nouveau message de ${senderName}`,
        body: data.content ? 
          (data.content.length > 50 ? data.content.substring(0, 50) + '...' : data.content) :
          'Vous avez reçu un nouveau message',
        icon: sender?.avatar || '/placeholder-logo.png',
        badge: '/placeholder-logo.png',
        tag: 'new-message',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'reply',
            title: 'Répondre',
            icon: '/placeholder-logo.png'
          },
          {
            action: 'view',
            title: 'Voir',
            icon: '/placeholder-logo.png'
          }
        ],
        data: {
          type: 'message',
          conversationId: data.conversationId,
          senderId: context.senderId,
          url: `/conversations/${data.conversationId}`,
          priority: 'high'
        }
      }

    case 'proposal':
    case 'booking':
      return {
        title: `Nouvelle proposition de ${senderName}`,
        body: data.title ? 
          `"${data.title}" - Cliquez pour voir les détails` :
          'Vous avez reçu une nouvelle proposition',
        icon: sender?.avatar || '/placeholder-logo.png',
        badge: '/placeholder-logo.png',
        tag: 'new-proposal',
        requireInteraction: true,
        vibrate: [300, 100, 300],
        actions: [
          {
            action: 'accept',
            title: 'Accepter',
            icon: '/placeholder-logo.png'
          },
          {
            action: 'view',
            title: 'Voir détails',
            icon: '/placeholder-logo.png'
          }
        ],
        data: {
          type: 'proposal',
          proposalId: data.proposalId || data.bookingId,
          senderId: context.senderId,
          url: data.bookingId ? `/booking/${data.bookingId}` : `/proposals/${data.proposalId}`,
          priority: 'high'
        }
      }

    case 'image':
      return {
        title: `${senderName} a partagé une image`,
        body: data.content || 'Nouvelle image partagée',
        icon: sender?.avatar || '/placeholder-logo.png',
        badge: '/placeholder-logo.png',
        image: data.imageUrl,
        tag: 'new-image',
        requireInteraction: true,
        vibrate: [150, 50, 150],
        actions: [
          {
            action: 'view',
            title: 'Voir l\'image',
            icon: '/placeholder-logo.png'
          },
          {
            action: 'like',
            title: 'J\'aime',
            icon: '/placeholder-logo.png'
          }
        ],
        data: {
          type: 'image',
          postId: data.postId,
          imageUrl: data.imageUrl,
          senderId: context.senderId,
          url: data.postId ? `/posts/${data.postId}` : '/',
          priority: 'normal'
        }
      }

    case 'collaboration':
      return {
        title: `Invitation à collaborer de ${senderName}`,
        body: 'Vous avez été invité(e) à collaborer sur un projet',
        icon: sender?.avatar || '/placeholder-logo.png',
        badge: '/placeholder-logo.png',
        tag: 'collaboration-invite',
        requireInteraction: true,
        vibrate: [250, 100, 250],
        actions: [
          {
            action: 'accept',
            title: 'Accepter',
            icon: '/placeholder-logo.png'
          },
          {
            action: 'view',
            title: 'Voir détails',
            icon: '/placeholder-logo.png'
          }
        ],
        data: {
          type: 'collaboration',
          collaborationId: data.collaborationId,
          postId: data.postId,
          senderId: context.senderId,
          url: `/collaborations/${data.collaborationId}`,
          priority: 'high'
        }
      }

    default:
      return {
        title: `Nouvelle notification de ${senderName}`,
        body: 'Vous avez une nouvelle notification',
        icon: sender?.avatar || '/placeholder-logo.png',
        badge: '/placeholder-logo.png',
        tag: 'general-notification',
        data: {
          type: 'general',
          senderId: context.senderId,
          url: '/',
          priority: 'normal'
        }
      }
  }
}

/**
 * Fonctions utilitaires pour intégrer dans les événements existants
 */

// Pour les nouveaux messages
export async function notifyOfflineUserForMessage(
  recipientId: string,
  senderId: string,
  conversationId: string,
  messageContent: string
) {
  return sendOfflinePushNotification({
    type: 'message',
    recipientId,
    senderId,
    data: {
      conversationId,
      content: messageContent
    }
  })
}

// Pour les nouvelles propositions/bookings
export async function notifyOfflineUserForProposal(
  recipientId: string,
  senderId: string,
  proposalData: {
    proposalId?: string
    bookingId?: string
    title: string
  }
) {
  return sendOfflinePushNotification({
    type: 'proposal',
    recipientId,
    senderId,
    data: proposalData
  })
}

// Pour les nouvelles images/posts
export async function notifyOfflineUserForImage(
  recipientId: string,
  senderId: string,
  imageData: {
    postId: string
    imageUrl: string
    content?: string
  }
) {
  return sendOfflinePushNotification({
    type: 'image',
    recipientId,
    senderId,
    data: imageData
  })
}

// Pour les invitations de collaboration
export async function notifyOfflineUserForCollaboration(
  recipientId: string,
  senderId: string,
  collaborationData: {
    collaborationId: string
    postId: string
  }
) {
  return sendOfflinePushNotification({
    type: 'collaboration',
    recipientId,
    senderId,
    data: collaborationData
  })
}

/**
 * Fonction générique pour notifier tous les membres hors ligne d'une conversation
 */
export async function notifyOfflineConversationMembers(
  conversationId: string,
  senderId: string,
  messageContent: string
) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          select: { userId: true }
        }
      }
    })

    if (!conversation) {
      console.error(`Conversation ${conversationId} not found`)
      return
    }

    // Notifier tous les membres sauf l'expéditeur
    const recipientIds = conversation.members
      .filter(member => member.userId !== senderId)
      .map(member => member.userId)

    const notifications = recipientIds.map(recipientId =>
      notifyOfflineUserForMessage(recipientId, senderId, conversationId, messageContent)
    )

    await Promise.all(notifications)
  } catch (error) {
    console.error('Error notifying offline conversation members:', error)
  }
}

