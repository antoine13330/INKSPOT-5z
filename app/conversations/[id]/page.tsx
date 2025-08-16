"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Phone, Video, MoreHorizontal, Wifi, Calendar, AlertCircle } from "lucide-react"
import { Button, Avatar, Badge, LoadingState, ErrorState } from "@/components/ui/base-components"
import { MessageList } from "@/components/chat/MessageList"
import { MessageInput } from "@/components/chat/MessageInput"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { BottomNavigation } from "@/components/bottom-navigation"
import { AppointmentProposal } from "@/components/appointments/AppointmentProposal"
import { useApi } from "@/hooks/useApi"
import { Message, Conversation } from "@/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import "@/styles/chat.css"

interface ConversationPageProps {
  params: Promise<{ id: string }>
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [conversationId, setConversationId] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([])
  const [conversationInfo, setConversationInfo] = useState<Conversation | null>(null)
  const [showAppointmentProposal, setShowAppointmentProposal] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params
      setConversationId(id)
    }
    getParams()
  }, [params])

  // Vraie API pour récupérer les messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching messages:', error)
      return { success: false, error: 'Failed to fetch messages' }
    }
  }

  // Vraie API pour récupérer la conversation
  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch conversation')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching conversation:', error)
      return { success: false, error: 'Failed to fetch conversation' }
    }
  }

  // API hooks
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages
  } = useApi(fetchMessages, {
    immediate: !!conversationId
  })

  const {
    data: conversationData,
    isLoading: conversationLoading,
    error: conversationError,
    refetch: refetchConversation
  } = useApi(fetchConversation, {
    immediate: !!conversationId
  })

  // Get other participant
  const otherParticipant = conversationInfo?.members.find(
    (member: any) => member.userId !== session?.user?.id
  )

  // Update state when data changes
  useEffect(() => {
    if (messagesData && Array.isArray(messagesData)) {
      // Filtrer les messages pour s'assurer qu'ils appartiennent à la bonne conversation
      const validMessages = messagesData.filter((msg: Message) => 
        msg.conversationId === conversationId
      )
      setMessages(validMessages)
    } else {
      // Pas de messages par défaut
      setMessages([])
    }
  }, [messagesData, conversationId])

  useEffect(() => {
    if (conversationData && typeof conversationData === 'object' && 'id' in conversationData) {
      setConversationInfo(conversationData as Conversation)
      
      // Simuler le statut en ligne (à remplacer par une vraie logique WebSocket)
      const lastActivity = (conversationData as Conversation).updatedAt
      const isRecentlyActive = lastActivity && 
        (new Date().getTime() - new Date(lastActivity).getTime()) < 5 * 60 * 1000 // 5 minutes
      setIsOnline(!!isRecentlyActive)
    }
  }, [conversationData])

  // Gérer le statut DRAFT séparément
  useEffect(() => {
    if (conversationInfo) {
      const hasMessages = conversationInfo.lastMessage !== undefined
      setIsDraft(!hasMessages)
    }
  }, [conversationInfo])



  const displayName = otherParticipant?.user?.firstName && otherParticipant?.user?.lastName 
    ? `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`
    : otherParticipant?.user?.username || "Utilisateur"
  const initials = displayName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Check if current user is PRO
  const isCurrentUserPro = session?.user?.role === 'PRO'
  const isOtherUserPro = otherParticipant?.user?.role === 'PRO'

  // Handle send message avec activation automatique si DRAFT
  const handleSendMessage = async (messageData: { content: string; type: string }) => {
    try {
      let apiEndpoint = `/api/conversations/${conversationId}/messages`
      let requestBody: any = {
        content: messageData.content,
        type: messageData.type
      }

      // Si c'est le premier message (DRAFT), utiliser l'API d'activation
      if (isDraft) {
        apiEndpoint = `/api/conversations/activate`
        requestBody = {
          conversationId: conversationId,
          message: messageData.content
        }
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      if (data.success) {
        // Si c'était un DRAFT, activer la conversation
        if (isDraft && data.conversationActivated) {
          setIsDraft(false)
          toast.success("✅ Conversation activée !")
          // Recharger les données
          refetchMessages()
          refetchConversation()
        }

        // Ajouter le message localement
        const newMessage: Message = {
          id: data.messageId || Date.now().toString(),
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
        toast.success("Message envoyé !")
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error("Erreur lors de l'envoi du message")
    }
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
  if (conversationLoading || messagesLoading) {
    return <LoadingState />
  }

  // Error state
  if (conversationError || messagesError) {
    return <ErrorState 
      message="Erreur lors du chargement de la conversation"
      onRetry={() => {
        refetchConversation()
        refetchMessages()
      }}
    />
  }

  // Si pas de session, rediriger
  if (!session?.user?.id) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="conversation-page bg-background">
      {/* Header */}
      <div className="conversation-header flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Avatar className="w-12 h-12" src={otherParticipant?.user?.avatar} fallback={initials} />
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{displayName}</h2>
              {isOtherUserPro && (
                <Badge variant="secondary">PRO</Badge>
              )}
              {isDraft && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  DRAFT
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Wifi className={cn("w-3 h-3", isOnline ? "text-success" : "text-muted-foreground")} />
                <span>{isOnline ? "En ligne" : "Hors ligne"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCurrentUserPro && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAppointmentProposal(true)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Proposer RDV
            </Button>
          )}
          
          {/* Bouton d'appel téléphonique - seulement si le PRO a renseigné son numéro */}
          {isOtherUserPro && otherParticipant?.user?.phone && (
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
          )}
          
                     {/* Bouton d'appel vidéo - seulement si le PRO a renseigné son numéro */}
           {isOtherUserPro && otherParticipant?.user?.phone && (
             <Button variant="ghost" size="sm">
               <Video className="w-4 h-4" />
             </Button>
           )}
          
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="conversation-messages">
        {isDraft ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-800">Conversation en DRAFT</h3>
                <p className="text-muted-foreground">
                  Envoyez votre premier message pour activer cette conversation
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  L'autre personne ne verra pas encore cette conversation
                </p>
              </div>
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            onMessageRead={handleMessageRead}
            currentUserId={session.user.id}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="conversation-input p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder={isDraft ? "Tapez votre premier message pour activer la conversation..." : "Tapez votre message..."}
          disabled={false}
          conversationId={conversationId}
          senderId={session?.user?.id || ""}
        />
      </div>

      {/* Appointment Proposal Modal */}
      {showAppointmentProposal && (
        <AppointmentProposal
          conversationId={conversationId}
          proId={otherParticipant?.user?.id || ""}
          clientId={session?.user?.id || ""}
          onClose={() => setShowAppointmentProposal(false)}
          onProposalSent={(proposal) => {
            console.log('Proposal sent:', proposal)
            setShowAppointmentProposal(false)
          }}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
