"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Conversation } from '@/types'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle } from 'lucide-react'


// Mock API function for testing when API is not available
const fetchMockConversations = async (): Promise<{ success: boolean; data?: Conversation[]; error?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock data
  const mockConversations: Conversation[] = [
    {
      id: "1",
      members: [
        {
          id: "member1",
          conversationId: "1",
          userId: "user1",
          joinedAt: new Date().toISOString(),
          lastReadAt: new Date().toISOString(),
          user: {
            id: "user1",
            email: "john@example.com",
            username: "@johndoe",
            firstName: "John",
            lastName: "Doe",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
            role: "PRO",
            status: "ACTIVE",
            verified: true,
            specialties: [],
            portfolio: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
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
      members: [
        {
          id: "member2",
          conversationId: "2",
          userId: "user2",
          joinedAt: new Date().toISOString(),
          lastReadAt: new Date().toISOString(),
          user: {
            id: "user2",
            email: "jane@example.com",
            username: "@janesmith",
            firstName: "Jane",
            lastName: "Smith",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
            role: "CLIENT",
            status: "ACTIVE",
            verified: true,
            specialties: [],
            portfolio: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
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
      members: [
        {
          id: "member3",
          conversationId: "3",
          userId: "user3",
          joinedAt: new Date().toISOString(),
          lastReadAt: new Date().toISOString(),
          user: {
            id: "user3",
            email: "mike@example.com",
            username: "@mikejohnson",
            firstName: "Mike",
            lastName: "Johnson",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
            role: "PRO",
            status: "ACTIVE",
            verified: true,
            specialties: [],
            portfolio: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations()
    }
  }, [session?.user?.id])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        console.warn('API returned error, using mock data')
        // Fallback to mock data if API fails
        const mockData = await fetchMockConversations()
        if (mockData.success && mockData.data) {
          setConversations(mockData.data)
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      // Fallback to mock data on error
      try {
        const mockData = await fetchMockConversations()
        if (mockData.success && mockData.data) {
          setConversations(mockData.data)
        }
      } catch (mockError) {
        console.error('Error with mock data:', mockError)
      }
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Aucune conversation</h3>
            <p className="text-muted-foreground">
              Commencez à discuter avec d'autres artistes en commentant leurs posts !
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                className="block"
              >
                <div className="p-4 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage 
                        src={conversation.members[0]?.user?.avatar} 
                        alt={conversation.members[0]?.user?.firstName || 'User'} 
                      />
                      <AvatarFallback>
                        {conversation.members[0]?.user?.firstName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {conversation.members[0]?.user?.firstName && conversation.members[0]?.user?.lastName 
                            ? `${conversation.members[0].user.firstName} ${conversation.members[0].user.lastName}`
                            : conversation.members[0]?.user?.username || 'Utilisateur'}
                        </h3>
                        {conversation.members[0]?.user?.role === 'PRO' && (
                          <Badge variant="secondary">PRO</Badge>
                        )}
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right text-xs text-muted-foreground">
                      {conversation.lastMessage && (
                        <div>
                          {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                        </div>
                      )}
                      {conversation.unreadCount > 0 && (
                        <div className="mt-1">
                          <Badge variant="default" className="bg-primary text-primary-foreground">
                            {conversation.unreadCount}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
