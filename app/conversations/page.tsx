"use client"

import React from 'react'
import { useSession } from 'next-auth/react'
import { Conversation } from '@/types'
import { useApi } from '@/hooks/useApi'


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

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
          <p className="text-muted-foreground">Connectez-vous pour voir vos conversations</p>
          <a href="/auth/login" className="text-primary hover:underline">
            Se connecter
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <p className="text-muted-foreground">Fonctionnalité en cours de développement...</p>
      </div>
    </div>
  )
}
