"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { ArrowLeft, Phone, Video, MoreHorizontal, Wifi, Calendar, AlertCircle, WifiOff, Check, CheckCheck, Clock, Images, Info, Link as LinkIcon } from "lucide-react"
import { Button, Avatar, Badge, LoadingState, ErrorState } from "@/components/ui/base-components"

import { MessageList } from "@/components/chat/MessageList"
import { MessageInput } from "@/components/chat/MessageInput"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { BottomNavigation } from "@/components/bottom-navigation"
import { AppointmentProposal } from "@/components/appointments/AppointmentProposal"
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge"
import { AppointmentHistory } from "@/components/appointments/AppointmentHistory"
import { OnlineStatusIndicatorWithIcon } from "@/components/ui/online-status-indicator"
import { ProposalRealtimeIndicator } from "@/components/conversation/ProposalRealtimeIndicator"
import { PaymentDebug } from "@/components/debug/PaymentDebug"

import { useApi } from "@/hooks/useApi"
import { Message, Conversation } from "@/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUserOnlineStatus } from "@/lib/providers/online-status-provider"
import { useProposalNotifications } from "@/hooks/useProposalNotifications"

interface ConversationPageProps {
  params: Promise<{ id: string }>
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeParams = useParams() as { id?: string }
  const fallbackParticipantId = searchParams?.get('to') || undefined
  
  // Gestion des paramètres de retour de paiement
  const paymentStatus = searchParams?.get('payment')
  const sessionId = searchParams?.get('session_id')
  
  const [conversationId, setConversationId] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([])
  const [conversationInfo, setConversationInfo] = useState<Conversation | null>(null)
  const [showAppointmentProposal, setShowAppointmentProposal] = useState(false)
  const [isDraft, setIsDraft] = useState(false)
  const [creatingDraft, setCreatingDraft] = useState(false)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState('media')

  // Utiliser le hook de notifications de propositions
  const {
    recentProposals,
    isConnected: proposalsConnected,
    clearProposal,
    clearAllProposals
  } = useProposalNotifications({
    conversationId,
    onProposalReceived: (proposal) => {
      // Rafraîchir les données de conversation pour inclure la nouvelle proposition
      refetchConversation()
      // Optionnel: rafraîchir aussi les messages si nécessaire
      refetchMessages()
    },
    onProposalStatusChanged: (data) => {
      // Rafraîchir les données pour refléter le nouveau statut
      refetchConversation()
    },
    showToastNotifications: true
  })

  // Utiliser un polling simple pour les messages en temps réel (plus fiable que WebSocket)
  const [isConnected, setIsConnected] = useState(true)
  
  // Polling pour nouveaux messages toutes les 3 secondes
  const [pollingEnabled, setPollingEnabled] = useState(true)
  
  useEffect(() => {
    if (!conversationId || !pollingEnabled) return
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`)
        if (response.ok) {
          const newMessages = await response.json()
          
          // Comparer avec les messages actuels pour détecter les nouveaux
          setMessages(prev => {
            const newMessageIds = new Set(newMessages.map((m: any) => m.id))
            const existingIds = new Set(prev.map(m => m.id))
            
            // Trouver les nouveaux messages (exclure ceux envoyés par l'utilisateur actuel)
            const actualNewMessages = newMessages.filter((m: any) => 
              !existingIds.has(m.id) && m.senderId !== session?.user?.id
            )
            
            if (actualNewMessages.length > 0) {
              console.log('📨 Nouveaux messages détectés:', actualNewMessages.length)
              return [...prev, ...actualNewMessages]
            }
            
            return prev
          })
        }
      } catch (error) {
        console.error('Erreur lors du polling des messages:', error)
      }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [conversationId, pollingEnabled])
  
  // Désactiver le polling temporairement après envoi d'un message
  const disablePollingTemporarily = () => {
    setPollingEnabled(false)
    setTimeout(() => setPollingEnabled(true), 5000) // Réactiver après 5 secondes
  }
  
  // Fonction pour envoyer un message via API REST
  const sendMessage = async (messageData: any) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Message envoyé:', result)
        return true
      } else {
        console.error('❌ Erreur lors de l\'envoi du message')
        return false
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error)
      return false
    }
  }

  // Récupérer l'ID de conversation
  useEffect(() => {
    const idFromRoute = routeParams?.id as string | undefined
    if (idFromRoute) {
      setConversationId(idFromRoute)
      return
    }
    
    // Attendre les params dynamiques
    params.then(({ id }) => {
      if (id) setConversationId(id)
    })
  }, [routeParams?.id, params])

  // API hooks
  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages
  } = useApi(async () => {
    if (!conversationId) return { success: true, data: [] }
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.ok ? await response.json() : []
      return { success: true, data }
    } catch (error) {
      return { success: true, data: [] }
    }
  }, { immediate: false })

  const {
    data: conversationData,
    isLoading: conversationLoading,
    error: conversationError,
    refetch: refetchConversation
  } = useApi(async () => {
    if (!conversationId) return { success: false, error: 'No conversation id' }
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'NOT_FOUND' }
        }
        throw new Error('Failed to fetch conversation')
      }
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch conversation' }
    }
  }, { immediate: false })

  // Récupérer l'autre participant (utiliser members au lieu de participants)
  const otherParticipant = conversationInfo?.members?.find(
    (member: any) => member.userId !== session?.user?.id
  )?.user

  // Utiliser le nouveau système de statut en ligne
  const { isOnline: participantOnline } = useUserOnlineStatus(otherParticipant?.id || '')

  // Statut en ligne géré via polling ou notifications push

  const displayName = otherParticipant?.firstName && otherParticipant?.lastName
    ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
    : otherParticipant?.businessName || otherParticipant?.username || "Utilisateur"
  
  const initials = displayName
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isCurrentUserPro = session?.user?.role === 'PRO'

  // API pour récupérer le statut de l'appointment
  const {
    data: appointmentStatusData,
    isLoading: appointmentStatusLoading,
    refetch: refetchAppointmentStatus
  } = useApi(async () => {
    if (!otherParticipant?.id) return { success: false }
    
    try {
      const response = await fetch(`/api/appointments/status?otherUserId=${otherParticipant.id}`)
      if (!response.ok) throw new Error('Failed to fetch appointment status')
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch appointment status' }
    }
  }, { immediate: false })

  // Lancer l'API du statut appointment quand on a l'autre participant
  useEffect(() => {
    if (otherParticipant?.id) {
      refetchAppointmentStatus()
    }
  }, [otherParticipant?.id, refetchAppointmentStatus])

  // Afficher le message de succès/échec du paiement et récupérer le statut côté serveur
  useEffect(() => {
    if (paymentStatus === 'success') {
      toast.success('Paiement effectué avec succès ! Le professionnel a été notifié.')
      // Confirmer côté serveur et rafraîchir messages/statut
      const confirm = async () => {
        try {
          if (!sessionId) return
          await fetch('/api/payments/confirm-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          })
        } catch (e) {}
        refetchMessages()
        if (otherParticipant?.id) {
          refetchAppointmentStatus()
        }
      }
      confirm()
      // Nettoyer l'URL
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.toString())
      
      // Recharger les données d'appointment
      if (otherParticipant?.id) {
        refetchAppointmentStatus()
      }
    } else if (paymentStatus === 'cancelled') {
      toast.error('Paiement annulé. Vous pouvez réessayer à tout moment.')
      // Nettoyer l'URL
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      window.history.replaceState({}, '', url.toString())
    }
  }, [paymentStatus, sessionId, otherParticipant?.id, refetchAppointmentStatus, refetchMessages])

  // Lancer les API quand l'ID est disponible
  useEffect(() => {
    if (conversationId) {
      refetchMessages()
      refetchConversation()
    }
  }, [conversationId, refetchMessages, refetchConversation])

  // Mettre à jour les messages
  useEffect(() => {
    if (messagesData && Array.isArray(messagesData)) {
      const validMessages = messagesData.filter((msg: Message) => 
        msg.conversationId === conversationId
      )
      setMessages(validMessages)
    } else {
      setMessages([])
    }
  }, [messagesData, conversationId])

  // Mettre à jour les informations de conversation
  useEffect(() => {
    if (conversationData && typeof conversationData === 'object') {
      const conversation = 'data' in conversationData ? conversationData.data : conversationData
      if (conversation && 'id' in conversation) {
        setConversationInfo(conversation as Conversation)
        
        // Le statut en ligne est maintenant géré automatiquement par le provider global
      }
    }
  }, [conversationData, otherParticipant?.id])

  // Déterminer si c'est un draft (basé sur isActive ou le nombre de messages)
  useEffect(() => {
    if (conversationInfo) {
      const isActive = (conversationInfo as any).isActive ?? (
        Array.isArray((conversationInfo as any).messages) && (conversationInfo as any).messages.length > 0
      )
      setIsDraft(!isActive)
    }
  }, [conversationInfo])

  // Création automatique de draft si nécessaire
  useEffect(() => {
    if (status !== 'authenticated' || creatingDraft || !fallbackParticipantId) return
    
    const createDraft = async () => {
      try {
        setCreatingDraft(true)
        const res = await fetch('/api/conversations/check-or-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participantId: fallbackParticipantId,
            postId: `profile:${fallbackParticipantId}`,
            subject: 'Nouvelle conversation'
          })
        })
        
        if (res.ok) {
          const data = await res.json()
          router.replace(data.redirectUrl)
        }
      } catch (error) {
        console.error('Error creating draft:', error)
      } finally {
        setCreatingDraft(false)
      }
    }
    
    if (conversationError === 'NOT_FOUND') {
      createDraft()
    }
  }, [conversationError, fallbackParticipantId, status, creatingDraft, router])

  // Redirection si non authentifié
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login')
    }
  }, [status, router])

  // Si pas de conversation et pas en création, créer un draft
  useEffect(() => {
    if (conversationError === 'NOT_FOUND' && !creatingDraft && conversationId && !fallbackParticipantId) {
      const createDraft = async () => {
        try {
          setCreatingDraft(true)
          const response = await fetch('/api/conversations/check-or-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participantId: conversationId,
              postId: `draft:${conversationId}`,
              subject: 'Nouvelle conversation'
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            refetchConversation()
            refetchMessages()
          }
        } catch (error) {
          console.error('Error creating draft:', error)
        } finally {
          setCreatingDraft(false)
        }
      }
      
      createDraft()
    }
  }, [conversationError, conversationId, creatingDraft, fallbackParticipantId])

  // Vérifier si on a une session valide
  if (status === 'loading') return <LoadingState />
  if (!session?.user?.id) return null

  // États de chargement et d'erreur
  if (conversationLoading || messagesLoading) return <LoadingState />
  
  if (conversationError && conversationError !== 'NOT_FOUND') {
    return <ErrorState 
      message="Erreur lors du chargement de la conversation"
      onRetry={() => {
        refetchConversation()
        refetchMessages()
      }}
    />
  }

  // Si pas d'information de conversation et pas en création
  if (!conversationInfo && !conversationLoading && !conversationError) {
    return <LoadingState />
  }


  // Envoyer un message
  const handleSendMessage = async (messageData: { content: string; type: string; images?: string[] }) => {
    try {
      const images = messageData.images || []
      
      // Optimistic UI pour l'expéditeur
      const newMessage: Message = {
        id: `tmp_${Date.now()}`,
        content: messageData.content,
        type: (images.length > 0 ? 'IMAGE' : messageData.type) as any,
        isFromUser: true,
        conversationId,
        senderId: session?.user?.id || 'current-user',
        readBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mediaUrl: images[0]
      }
      setMessages(prev => [...prev, newMessage])
      disablePollingTemporarily() // Désactiver le polling temporairement

      let apiEndpoint = `/api/conversations/${conversationId}/messages`
      let requestBody: any = {
        content: messageData.content,
        type: messageData.type
      }

      if (isDraft) {
        apiEndpoint = `/api/conversations/activate`
        requestBody = {
          conversationId: conversationId,
          message: messageData.content,
          attachments: messageData.images && messageData.images.length > 0 ? messageData.images : undefined
        }
      }

      const sendOnce = async (body: any) => {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (!response.ok) throw new Error('Failed to send message')
        return response.json()
      }

      // Send one message with all images attached (fallback REST)
      let responses: any[] = []
      if (images.length > 0) {
        if (isDraft) {
          const firstData = await sendOnce({
            conversationId,
            message: messageData.content || '',
            attachments: images,
          })
          responses.push(firstData)
        } else {
          // Send a single message with all images
          responses.push(
            await sendOnce({
              content: messageData.content || '',
              type: 'IMAGE',
              attachments: images
            })
          )
        }
      } else {
        responses.push(await sendOnce(requestBody))
      }

      // Handle responses
      for (const data of responses) {
        if (isDraft && data.conversationActivated) {
          setIsDraft(false)
          // Marquer localement la conversation comme active pour éviter un clignotement du mode DRAFT
          setConversationInfo(prev => prev ? { ...prev, isActive: true } : prev)
          refetchMessages()
          refetchConversation()
        }

        // Utiliser le message renvoyé par l'API si disponible (cas non-DRAFT)
        if (data.data && typeof data.data === 'object') {
          setMessages(prev => [...prev, data.data as Message])
        } else {
          // Fallback: construire le message localement (cas ACTIVATE)
          const newMessage: Message = {
            id: data.messageId || Date.now().toString(),
            content: messageData.content,
            type: (images.length > 0 ? 'IMAGE' : messageData.type) as any,
            isFromUser: true,
            conversationId,
            senderId: session?.user?.id || "current-user",
            readBy: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          setMessages(prev => [...prev, newMessage])
        }
      }
      toast.success("Message envoyé !")
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error("Erreur lors de l'envoi du message")
    }
  }

  // Marquer un message comme lu
  const handleMessageRead = (messageId: string) => {
    const currentUserId = session?.user?.id || ""
    setMessages(prev => {
      let changed = false
      const next = prev.map(msg => {
        if (msg.id !== messageId) return msg
        if (msg.readBy && msg.readBy.includes(currentUserId)) return msg
        changed = true
        return { ...msg, readBy: [...(msg.readBy || []), currentUserId] }
      })
      return changed ? next : prev
    })
  }

  // Fonction pour déterminer le statut d'un message
  const getMessageStatus = (message: Message) => {
    const isFromCurrentUser = message.senderId === session?.user?.id
    const isRead = message.readBy.includes(session?.user?.id || '')
    
    if (isFromCurrentUser) {
      return isRead ? 'read' : 'sent'
    } else {
      return 'received'
    }
  }

  // Fonction pour obtenir l'icône de statut
  const getStatusIcon = (status: string) => {
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

  // Trier les messages par date (plus récents en bas)
  const sortedMessages = messages.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateA - dateB // Tri ascendant : plus anciens en haut, plus récents en bas
  })

  return (
    <div className="conversation-page bg-background min-h-screen flex flex-col">
      <div className="w-full max-w-lg mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <div className="conversation-header p-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Avatar className="w-12 h-12" src={otherParticipant?.avatar} fallback={initials} />
            
            
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="font-medium text-sm leading-tight break-words text-white truncate max-w-[150px]">
                  {displayName}
                </h2>
                {otherParticipant?.role === 'PRO' && (
                  <Badge variant="secondary">PRO</Badge>
                )}
                {isDraft && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    DRAFT
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <OnlineStatusIndicatorWithIcon 
                  isOnline={participantOnline} 
                  showText={true}
                  size="sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {otherParticipant?.role === 'PRO' && (
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
              )}
              {otherParticipant?.role === 'PRO' && (
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
              )}
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Infos de la conversation</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <Tabs value={drawerTab} onValueChange={setDrawerTab}>
                      <TabsList className="w-full">
                        <TabsTrigger value="media" className="flex-1"><Images className="w-4 h-4 mr-2" />Médias</TabsTrigger>
                        <TabsTrigger value="infos" className="flex-1"><Info className="w-4 h-4 mr-2" />Infos</TabsTrigger>
                        <TabsTrigger value="liens" className="flex-1"><LinkIcon className="w-4 h-4 mr-2" />Liens</TabsTrigger>
                        {isCurrentUserPro && (
                          <TabsTrigger value="rdv" className="flex-1"><Calendar className="w-4 h-4 mr-2" />RDV</TabsTrigger>
                        )}
                      </TabsList>
                      <TabsContent value="media" className="mt-4">
                        <div className="grid grid-cols-3 gap-2">
                          {sortedMessages
                            .map((m, idx) => ({ m, idx }))
                            .filter(({ m }) => m.type === 'IMAGE' && (m as any).mediaUrl)
                            .map(({ m, idx }) => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  const el = document.querySelector(`[data-message-id="${m.id}"]`)
                                  const container = document.querySelector('[data-messages-container]') as HTMLElement | null
                                  if (el && container) {
                                    container.scrollTo({ top: (el as HTMLElement).offsetTop - 100, behavior: 'smooth' })
                                    setDrawerOpen(false)
                                  }
                                }}
                                className="relative aspect-square overflow-hidden rounded-md border"
                                title={new Date(m.createdAt).toLocaleString()}
                              >
                                <img src={(m as any).mediaUrl as string} alt="media" className="w-full h-full object-cover" />
                              </button>
                            ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="infos" className="mt-4">
                        <div className="text-sm text-muted-foreground space-y-2">
                          <div>Participants: {displayName}</div>
                          <div>Messages: {messages.length}</div>
                          <div>Statut: {isDraft ? 'DRAFT' : 'ACTIVE'}</div>
                        </div>
                      </TabsContent>
                      <TabsContent value="liens" className="mt-4">
                        <div className="text-sm text-muted-foreground">Aucun lien partagé pour l'instant.</div>
                      </TabsContent>
                      {isCurrentUserPro && (
                        <TabsContent value="rdv" className="mt-4">
                          <div className="space-y-6">
                            {/* Proposition de nouveau RDV */}
                            <div>
                              <h4 className="font-medium mb-3">Nouvelle proposition</h4>
                              <AppointmentProposal
                                conversationId={conversationId}
                                proId={session?.user?.id || ''}
                                clientId={otherParticipant?.id || ''}
                                inline
                                onClose={() => setDrawerOpen(false)}
                                onProposalSent={() => {
                                  setDrawerOpen(false)
                                  // Refresh appointment status after sending proposal
                                  refetchAppointmentStatus()
                                }}
                              />
                            </div>
                            
                            {/* Historique des prestations */}
                            <div>
                              <h4 className="font-medium mb-3">Historique des prestations</h4>
                              <AppointmentHistory
                                clientId={otherParticipant?.id || ''}
                                conversationId={conversationId}
                                className="max-h-96 overflow-y-auto"
                              />
                            </div>
                            
                            {/* Debug des paiements (temporaire) */}
                            <div>
                              <h4 className="font-medium mb-3">Debug des Paiements</h4>
                              <PaymentDebug />
                            </div>
                          </div>
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="conversation-messages flex-1 overflow-y-auto px-4 min-h-0">
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
                      <>
            <MessageList
              messages={sortedMessages}
              onMessageRead={handleMessageRead}
              currentUserId={session.user.id}
              data-messages-container
            />
            <TypingIndicator typingUsers={typingUsers} />
          </>
        )}
        </div>

        {/* Real-time Proposal Indicators */}
        {!isDraft && (
          <div className="px-4 py-2">
            <ProposalRealtimeIndicator
              conversationId={conversationId}
              onProposalReceived={(proposal) => {
                // Optionnel: gérer la réception de proposition
                console.log('Proposition reçue:', proposal)
              }}
            />
          </div>
        )}

        {/* Input Area - Fixed at bottom */}
        <div className="conversation-input p-4 flex-shrink-0">
          {!isDraft && (
            <AppointmentStatusBadge
              hasAppointment={appointmentStatusData?.hasAppointment || false}
              appointment={appointmentStatusData?.appointment}
              canPropose={appointmentStatusData?.canPropose || false}
              onPropose={() => {
                setDrawerTab('rdv')
                setDrawerOpen(true)
              }}
              onViewDetails={() => {
                // TODO: Ouvrir modal détails appointment
                toast.info("Détails de la proposition à venir")
              }}
              onRefresh={refetchAppointmentStatus}
            />
          )}
          <MessageInput
            onSendMessage={handleSendMessage}
            onStartTyping={() => { /* hook up to realtime later */ }}
            onStopTyping={() => { /* hook up to realtime later */ }}
            placeholder={isDraft ? "Tapez votre premier message pour activer la conversation..." : "Tapez votre message..."}
            disabled={false}
            conversationId={conversationId}
            senderId={session?.user?.id || ""}
          />
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>

      {/* Appointment Proposal Modal */}
      {showAppointmentProposal && (
        <AppointmentProposal
          conversationId={conversationId}
          proId={otherParticipant?.id || ""}
          clientId={session?.user?.id || ""}
          onClose={() => setShowAppointmentProposal(false)}
                  onProposalSent={() => {
          setShowAppointmentProposal(false)
          // Refresh appointment status after sending proposal
          refetchAppointmentStatus()
        }}
        />
      )}
    </div>
  )
}
