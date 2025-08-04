"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Phone, Video, MoreHorizontal, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

import { useWebSocket } from "@/hooks/useWebSocket"
import { MessageList } from "@/components/chat/MessageList"
import { MessageInput } from "@/components/chat/MessageInput"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { MessageData, TypingData, MessageReadData, UserStatus } from "@/lib/websocket"

interface MessageWithSender extends MessageData {
  sender: {
    id: string
    username: string | null
    name: string | null
    avatar: string | null
  }
  payment?: {
    id: string
    amount: number
    status: string
    description: string | null
  }
  booking?: {
    id: string
    title: string
    status: string
    scheduledDate: Date
  }
}

interface ConversationMember {
  id: string
  username?: string
  name?: string
  avatar?: string
}

export default function ConversationPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([])
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({})
  const [readStatus, setReadStatus] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [conversationInfo, setConversationInfo] = useState<{
    title?: string
    members: ConversationMember[]
  }>({ members: [] })

  const conversationId = params.id
  
  // Initialize WebSocket connection
  const {
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageAsRead,
    onNewMessage,
    onTyping,
    onStopTyping,
    onMessageRead,
    onUserStatus,
    onMessageSent,
    onMessageError,
  } = useWebSocket({ 
    conversationId,
    autoConnect: !!session?.user?.id 
  })

  // Load initial messages and conversation info
  useEffect(() => {
    const loadConversationData = async () => {
      if (!session?.user?.id || !conversationId) return

      try {
        setIsLoading(true)
        
        // Load messages
        const messagesResponse = await fetch(`/api/messages/realtime?conversationId=${conversationId}`)
        if (!messagesResponse.ok) {
          throw new Error('Failed to load messages')
        }
        const messagesData = await messagesResponse.json()
        setMessages(messagesData.messages || [])

        // Load conversation info
        const conversationResponse = await fetch(`/api/conversations/${conversationId}`)
        if (conversationResponse.ok) {
          const conversationData = await conversationResponse.json()
          setConversationInfo({
            title: conversationData.title,
            members: conversationData.members || []
          })
        }
      } catch (error) {
        console.error('Error loading conversation data:', error)
        toast({
          title: "Error",
          description: "Failed to load conversation",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadConversationData()
  }, [conversationId, session?.user?.id, toast])

  // Set up WebSocket event handlers
  useEffect(() => {
    if (!session?.user?.id) return

    onNewMessage((messageWithSender) => {
      setMessages(prev => [...prev, messageWithSender])
      
      // Auto-scroll to bottom for new messages
      setTimeout(() => {
        const messagesContainer = document.querySelector('[data-messages-container]')
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      }, 100)
    })

    onTyping((data: TypingData) => {
      if (data.userId !== session.user.id) {
        setTypingUsers(prev => {
          const existing = prev.find(user => user.userId === data.userId)
          if (!existing) {
            return [...prev, { userId: data.userId, userName: data.userName }]
          }
          return prev
        })
      }
    })

    onStopTyping((data: TypingData) => {
      setTypingUsers(prev => prev.filter(user => user.userId !== data.userId))
    })

    onMessageRead((data: MessageReadData) => {
      setReadStatus(prev => ({
        ...prev,
        [data.messageId]: [...(prev[data.messageId] || []), data.userId]
      }))
    })

    onUserStatus((status: UserStatus) => {
      setUserStatuses(prev => ({
        ...prev,
        [status.userId]: status
      }))
    })

    onMessageError((error) => {
      toast({
        title: "Message failed",
        description: error.error,
        variant: "destructive",
      })
    })
  }, [session?.user?.id, onNewMessage, onTyping, onStopTyping, onMessageRead, onUserStatus, onMessageError, toast])

  const handleSendMessage = (messageData: Omit<MessageData, 'id' | 'createdAt'>) => {
    if (!isConnected) {
      toast({
        title: "Connection lost",
        description: "Please wait for reconnection to send messages",
        variant: "destructive",
      })
      return
    }
    sendMessage(messageData)
  }

  const handleStartTyping = () => {
    if (conversationId && isConnected) {
      startTyping(conversationId)
    }
  }

  const handleStopTyping = () => {
    if (conversationId && isConnected) {
      stopTyping(conversationId)
    }
  }

  const handleMessageRead = (messageId: string) => {
    if (isConnected) {
      markMessageAsRead(messageId, conversationId)
    }
  }

  // Get other participants for display
  const otherMembers = conversationInfo.members.filter(member => member.id !== session?.user?.id)
  const displayMember = otherMembers[0] // For 1-on-1 conversations
  const displayName = displayMember?.username || displayMember?.name || "Unknown User"
  const isOnline = displayMember ? userStatuses[displayMember.id]?.status === 'online' : false

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-400">Please log in to access conversations.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-400">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="max-w-md mx-auto bg-black min-h-screen flex flex-col w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <Link href="/conversations">
              <Button variant="ghost" size="icon" className="text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Avatar className="w-10 h-10">
              <AvatarImage src={displayMember?.avatar || undefined} />
              <AvatarFallback>
                {displayName[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold">{displayName}</h2>
                {isOnline && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="flex items-center space-x-1">
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-green-500" />
                      <span className="text-gray-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-red-500" />
                      <span className="text-gray-400">Reconnecting...</span>
                    </>
                  )}
                </div>
                {isOnline && (
                  <Badge variant="secondary" className="text-xs py-0 px-2">
                    Online
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageList
            messages={messages}
            currentUserId={session.user.id}
            readStatus={readStatus}
            onMessageRead={handleMessageRead}
            className="bg-black"
            data-messages-container
          />
          
          {/* Typing Indicator */}
          <TypingIndicator 
            typingUsers={typingUsers}
            className="bg-black border-t border-gray-800"
          />
        </div>

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onStartTyping={handleStartTyping}
          onStopTyping={handleStopTyping}
          conversationId={conversationId}
          senderId={session.user.id}
          disabled={!isConnected}
          placeholder={isConnected ? "Type a message..." : "Reconnecting..."}
          className="border-t border-gray-800"
        />
      </div>
    </div>
  )
}
