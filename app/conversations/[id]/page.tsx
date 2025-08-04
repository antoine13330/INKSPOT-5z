"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Phone, Video, MoreHorizontal, Wifi } from "lucide-react"
import { Button, Avatar, Badge, LoadingState, ErrorState } from "@/components/ui/base-components"
import { MessageList } from "@/components/chat/MessageList"
import { MessageInput } from "@/components/chat/MessageInput"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useApi } from "@/hooks/useApi"
import { Message, Conversation } from "@/types"
import { cn, getInitials } from "@/lib/utils"

interface ConversationPageProps {
  params: { id: string }
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const conversationId = params.id
  
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([])
  const [conversationInfo, setConversationInfo] = useState<Conversation | null>(null)

  // Mock API functions
  const fetchMessages = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock messages
    const mockMessages: Message[] = [
      {
        id: "1",
        content: "Salut ! Comment ça va ?",
        type: "TEXT",
        isFromUser: false,
        conversationId,
        senderId: "other-user",
        readBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: "2",
        content: "Très bien, merci ! Et toi ?",
        type: "TEXT",
        isFromUser: true,
        conversationId,
        senderId: session?.user?.id || "current-user",
        readBy: ["other-user"],
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      },
      {
        id: "3",
        content: "Parfait ! J'ai regardé ton portfolio, c'est vraiment impressionnant.",
        type: "TEXT",
        isFromUser: false,
        conversationId,
        senderId: "other-user",
        readBy: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
      }
    ]

    return {
      success: true,
      data: mockMessages
    }
  }

  const fetchConversation = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock conversation
    const mockConversation: Conversation = {
      id: conversationId,
      participants: [
        {
          id: session?.user?.id || "current-user",
          name: session?.user?.username || "Vous",
          username: session?.user?.username || "vous",
          avatar: session?.user?.avatar || undefined,
          role: session?.user?.role || "CLIENT"
        },
        {
          id: "other-user",
          name: "John Doe",
          username: "@johndoe",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          role: "PRO"
        }
      ],
      unreadCount: 0,
      isActive: true,
      type: "DIRECT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return {
      success: true,
      data: mockConversation
    }
  }

  // API hooks
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages
  } = useApi(fetchMessages, {
    immediate: !!session?.user?.id
  })

  const {
    data: conversationData,
    isLoading: conversationLoading,
    error: conversationError,
    refetch: refetchConversation
  } = useApi(fetchConversation, {
    immediate: !!session?.user?.id
  })

  // Update state when data changes
  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData)
    }
  }, [messagesData])

  useEffect(() => {
    if (conversationData) {
      setConversationInfo(conversationData)
    }
  }, [conversationData])

  // Get other participant
  const otherParticipant = conversationInfo?.participants.find(
    p => p.id !== session?.user?.id
  )

  const displayName = otherParticipant?.name || otherParticipant?.username || "Utilisateur"
  const initials = getInitials(displayName)

  // Handle send message
  const handleSendMessage = (messageData: { content: string; type: string }) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageData.content,
      type: messageData.type as any,
      isFromUser: true,
      conversationId,
      senderId: session?.user?.id || "current-user",
      readBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, newMessage])
  }

  // Handle message read
  const handleMessageRead = (messageId: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, readBy: [...msg.readBy, session?.user?.id || ""] }
          : msg
      )
    )
  }

  // Loading state
  if (messagesLoading || conversationLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState message="Chargement de la conversation..." />
      </div>
    )
  }

  // Error state
  if (messagesError || conversationError) {
    return (
      <div className="min-h-screen bg-background">
        <ErrorState 
          message="Erreur lors du chargement de la conversation"
          onRetry={() => {
            refetchMessages()
            refetchConversation()
          }}
        />
      </div>
    )
  }

  // Not authenticated
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
          <p className="text-secondary">Connectez-vous pour accéder aux conversations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/conversations')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Avatar
              src={otherParticipant?.avatar}
              alt={displayName}
              fallback={initials}
              size="md"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground">{displayName}</h2>
                {otherParticipant?.role === "PRO" && (
                  <Badge variant="secondary" size="sm">PRO</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-success" />
                  <span className="text-secondary">En ligne</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface rounded-lg border border-border">
          <MessageList
            messages={messages}
            currentUserId={session.user.id}
            onMessageRead={handleMessageRead}
            data-messages-container
          />
          
          {/* Typing Indicator */}
          <TypingIndicator 
            typingUsers={typingUsers}
          />
        </div>

        {/* Message Input */}
        <div className="mt-4">
          <MessageInput
            onSendMessage={handleSendMessage}
            conversationId={conversationId}
            senderId={session.user.id}
            placeholder="Tapez votre message..."
          />
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
