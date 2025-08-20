import { prisma } from "./prisma"
import { notifyOfflineUserForImage } from "./offline-push-notifications"

/**
 * Helpers pour les notifications d'images et posts
 */

/**
 * Notifie les utilisateurs intéressés par un nouveau post avec images
 * Pour l'instant, on peut notifier basé sur les interactions précédentes ou conversations
 */
export async function notifyInterestedUsersForNewPost(
  postId: string,
  authorId: string,
  imageUrls: string[],
  content: string
) {
  try {
    // Récupérer les utilisateurs qui ont eu des conversations avec l'auteur
    const recentConversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId: authorId }
        },
        updatedAt: {
          // Conversations des 30 derniers jours
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        members: {
          where: {
            userId: { not: authorId }
          },
          select: { userId: true }
        }
      },
      take: 50 // Limiter pour éviter le spam
    })

    // Collecter tous les utilisateurs uniques
    const interestedUserIds = new Set<string>()
    recentConversations.forEach(conv => {
      conv.members.forEach(member => {
        interestedUserIds.add(member.userId)
      })
    })

    // Récupérer également les utilisateurs qui ont commenté ou interagi avec les posts précédents de l'auteur
    const recentInteractions = await prisma.comment.findMany({
      where: {
        post: { authorId },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      select: { authorId: true },
      distinct: ['authorId'],
      take: 20
    })

    recentInteractions.forEach(interaction => {
      if (interaction.authorId !== authorId) {
        interestedUserIds.add(interaction.authorId)
      }
    })

    // Envoyer les notifications push
    const notifications = Array.from(interestedUserIds).map(userId =>
      notifyOfflineUserForImage(
        userId,
        authorId,
        {
          postId,
          imageUrl: imageUrls[0], // Première image comme aperçu
          content: content.length > 100 ? content.substring(0, 100) + '...' : content
        }
      )
    )

    await Promise.allSettled(notifications)
    
    console.log(`Sent image notifications to ${interestedUserIds.size} interested users for post ${postId}`)
  } catch (error) {
    console.error('Error notifying interested users for new post:', error)
  }
}

/**
 * Notifie spécifiquement quand une image est partagée dans une conversation
 */
export async function notifyConversationMembersForImage(
  conversationId: string,
  senderId: string,
  imageUrl: string,
  content?: string
) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          where: {
            userId: { not: senderId }
          },
          select: { userId: true }
        }
      }
    })

    if (!conversation) {
      console.error(`Conversation ${conversationId} not found`)
      return
    }

    // Notifier tous les membres sauf l'expéditeur
    const notifications = conversation.members.map(member =>
      notifyOfflineUserForImage(
        member.userId,
        senderId,
        {
          postId: '', // Pas de post spécifique, c'est dans une conversation
          imageUrl,
          content: content || 'Nouvelle image partagée',
          conversationId
        }
      )
    )

    await Promise.allSettled(notifications)
  } catch (error) {
    console.error('Error notifying conversation members for image:', error)
  }
}

/**
 * Notifie quand un collaborateur partage des images sur un projet
 */
export async function notifyCollaboratorsForImage(
  postId: string,
  senderId: string,
  imageUrl: string,
  content?: string
) {
  try {
    // Récupérer le post et ses collaborateurs
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        collaborations: {
          where: {
            status: 'ACCEPTED',
            proId: { not: senderId }
          },
          select: { proId: true }
        },
        author: true
      }
    })

    if (!post) {
      console.error(`Post ${postId} not found`)
      return
    }

    const notificationTargets = []

    // Notifier l'auteur du post si ce n'est pas lui qui partage
    if (post.authorId !== senderId) {
      notificationTargets.push(post.authorId)
    }

    // Notifier les autres collaborateurs
    post.collaborations.forEach(collab => {
      notificationTargets.push(collab.proId)
    })

    // Envoyer les notifications
    const notifications = notificationTargets.map(userId =>
      notifyOfflineUserForImage(
        userId,
        senderId,
        {
          postId,
          imageUrl,
          content: content || 'Nouvelle image de collaboration'
        }
      )
    )

    await Promise.allSettled(notifications)
  } catch (error) {
    console.error('Error notifying collaborators for image:', error)
  }
}

