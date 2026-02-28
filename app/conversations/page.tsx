"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Conversation } from '@/types'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageCircle, Filter, Search, Check, CheckCheck, Clock } from 'lucide-react'


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
  const [sortOrder, setSortOrder] = useState<'date' | 'name'>('date')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pro'>('all')
  

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

  // Fonction pour déterminer le statut du dernier message
  const getMessageStatus = (conversation: Conversation) => {
    if (!conversation.lastMessage) return null
    
    const isFromCurrentUser = conversation.lastMessage.senderId === session?.user?.id
    const isRead = conversation.lastMessage.readBy.includes(session?.user?.id || '')
    
    if (isFromCurrentUser) {
      return isRead ? 'read' : 'sent'
    } else {
      return 'received'
    }
  }

  // Fonction pour obtenir l'icône de statut
  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'read':
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      case 'sent':
        return <Check className="w-4 h-4 text-gray-400" />
      case 'received':
        return <Check className="w-4 h-4 text-gray-400" />

      default:
        return null
    }
  }

  // Affichage du temps (12:34, Yesterday, 18/08/2025)
  const formatTimestamp = (isoDate?: string) => {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (isYesterday) {
      return 'Yesterday'
    }
    return date.toLocaleDateString()
  }

  // Récupérer l'autre participant de la conversation
  const getOtherMember = (c: Conversation) => {
    const other = c.members?.find(m => m.userId !== session?.user?.id)
    return other || c.members?.[0]
  }

  // Filtrer et trier les conversations
  const filteredAndSortedConversations = conversations
    .filter((conversation) => {
      // Filtre par statut
      if (filterStatus === 'pro' && conversation.members?.[0]?.user?.role !== 'PRO') return false
      
      // Filtre par recherche
      if (searchTerm) {
        const memberName = conversation.members?.[0]?.user?.firstName || ''
        const memberLastName = conversation.members?.[0]?.user?.lastName || ''
        const memberUsername = conversation.members?.[0]?.user?.username || ''
        const memberBusinessName = conversation.members?.[0]?.user?.businessName || ''
        const lastMessage = conversation.lastMessage?.content || ''
        
        const searchableText = `${memberName} ${memberLastName} ${memberUsername} ${memberBusinessName} ${lastMessage}`.toLowerCase()
        if (!searchableText.includes(searchTerm.toLowerCase())) return false
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'name': {
          const nameA = (a.members?.[0]?.user?.firstName || '') + (a.members?.[0]?.user?.lastName || '') || (a.members?.[0]?.user?.businessName || '') || (a.members?.[0]?.user?.username || '')
          const nameB = (b.members?.[0]?.user?.firstName || '') + (b.members?.[0]?.user?.lastName || '') || (b.members?.[0]?.user?.businessName || '') || (b.members?.[0]?.user?.username || '')
          return nameA.localeCompare(nameB)
        }
        case 'date':
        default: {
          const dateA = new Date(a.lastMessage?.createdAt || a.createdAt).getTime()
          const dateB = new Date(b.lastMessage?.createdAt || b.createdAt).getTime()
          return dateB - dateA
        }
      }
    })

  return (
    <div className="min-h-screen bg-background">
      {/* Bandeau amélioré */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-semibold">Messages</h1>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center text-xs text-muted-foreground mr-2">
                {filteredAndSortedConversations.length} conversation{filteredAndSortedConversations.length > 1 ? 's' : ''}
              </div>
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'pro')}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>

                  <SelectItem value="pro">Artistes PRO</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'date' | 'name')}>
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue placeholder="Trier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Par date</SelectItem>
                  <SelectItem value="name">Par nom</SelectItem>

                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Barre de recherche */}
          <div className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher dans les conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4">
        {filteredAndSortedConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Aucun résultat' : 'Aucune conversation'}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all' 
                ? 'Essayez de modifier vos critères de recherche ou de filtrage.'
                : 'Commencez à discuter avec d\'autres artistes en commentant leurs posts !'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredAndSortedConversations.map((conversation) => {
              const member = getOtherMember(conversation)
              const displayName = member?.user?.firstName && member?.user?.lastName
                ? `${member.user.firstName} ${member.user.lastName}`
                : member?.user?.businessName || member?.user?.username || 'Utilisateur'
              return (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.id}`}
                  className="block hover:bg-accent/5"
                >
                  <div className="flex items-center gap-3 py-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member?.user?.avatar} alt={displayName} />
                        <AvatarFallback>{displayName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>

                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="font-semibold truncate">{displayName}</span>
                          {member?.user?.role === 'PRO' && (
                            <Badge variant="secondary" className="px-1 py-0 text-[10px]">PRO</Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground shrink-0">
                          {formatTimestamp(conversation.lastMessage?.createdAt || conversation.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage?.content}
                        </p>
                        <div className="shrink-0">
                          {getStatusIcon(getMessageStatus(conversation))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
