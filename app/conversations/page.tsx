"use client"

import React from 'react'
import { useSession } from 'next-auth/react'
import { Conversation } from '@/types'
import { useApi } from '@/hooks/useApi'
import { ConversationList } from '@/components/conversation/conversation-list'
import { BottomNavigation } from '@/components/bottom-navigation'
import { Container, EmptyState } from '@/components/ui/base-components'
import { Button } from '@/components/ui/base-components'
import { MessageCircle } from 'lucide-react'

// Mock API function
const fetchConversations = async (): Promise<{ success: boolean; data?: Conversation[]; error?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock data
  const mockConversations: Conversation[] = [
    {
      id: "1",
      participants: [
        {
          id: "user1",
          name: "John Doe",
          username: "@johndoe",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          role: "PRO"
        }
      ],
      lastMessage: {
        id: "msg1",
        content: "Salut ! J'ai regardé votre portfolio, c'est vraiment impressionnant.",
        type: "TEXT",
        isFromUser: false,
        conversationId: "1",
        senderId: "user1",
        readBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      unreadCount: 2,
      isActive: true,
      type: "DIRECT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "2",
      participants: [
        {
          id: "user2",
          name: "Jane Smith",
          username: "@janesmith",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
          role: "CLIENT"
        }
      ],
      lastMessage: {
        id: "msg2",
        content: "Parfait, je vous envoie les détails du projet.",
        type: "TEXT",
        isFromUser: true,
        conversationId: "2",
        senderId: "currentUser",
        readBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      unreadCount: 0,
      isActive: true,
      type: "DIRECT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "3",
      participants: [
        {
          id: "user3",
          name: "Mike Johnson",
          username: "@mikejohnson",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
          role: "PRO"
        }
      ],
      lastMessage: {
        id: "msg3",
        content: "Merci pour votre retour, je vais travailler sur les modifications.",
        type: "TEXT",
        isFromUser: false,
        conversationId: "3",
        senderId: "user3",
        readBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      unreadCount: 1,
      isActive: true,
      type: "DIRECT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  return {
    success: true,
    data: mockConversations
  }
}

export default function ConversationsPage() {
  const { data: session } = useSession()
  
  const {
    data: conversations,
    isLoading,
    error,
    refetch
  } = useApi(fetchConversations, {
    immediate: !!session?.user?.id
  })

  if (!session) {
    return (
      <Container>
        <EmptyState
          icon={MessageCircle}
          title="Connexion requise"
          description="Connectez-vous pour voir vos conversations"
          action={
            <a href="/auth/login">
              <Button>Se connecter</Button>
            </a>
          }
        />
      </Container>
    )
  }

  return (
    <ConversationList 
      conversations={conversations || []}
      showSearch={true}
      title="Messages"
      loading={isLoading}
      error={error}
      onRetry={refetch}
    />
  )
}
