import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { useSession } from "next-auth/react"
import { MessageData, TypingData, MessageReadData, UserStatus } from "@/lib/websocket"

// Type for message with sender information
interface MessageWithSender extends MessageData {
  sender: {
    id: string;
    username: string;
    avatar?: string;
    verified: boolean;
  };
}

interface UseWebSocketOptions {
  conversationId?: string
  autoConnect?: boolean
}

interface UseWebSocketReturn {
  socket: Socket | null
  isConnected: boolean
  sendMessage: (message: Omit<MessageData, 'id' | 'createdAt'>) => void
  startTyping: (conversationId: string) => void
  stopTyping: (conversationId: string) => void
  markMessageAsRead: (messageId: string, conversationId: string) => void
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  onNewMessage: (callback: (message: MessageWithSender) => void) => void
  onTyping: (callback: (data: TypingData) => void) => void
  onStopTyping: (callback: (data: TypingData) => void) => void
  onMessageRead: (callback: (data: MessageReadData) => void) => void
  onUserStatus: (callback: (status: UserStatus) => void) => void
  onMessageSent: (callback: (message: MessageData) => void) => void
  onMessageError: (callback: (error: { error: string }) => void) => void
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const { conversationId, autoConnect = true } = options
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Store callbacks using refs to avoid stale closures
  const callbacksRef = useRef<{
    onNewMessage?: (message: MessageWithSender) => void
    onTyping?: (data: TypingData) => void
    onStopTyping?: (data: TypingData) => void
    onMessageRead?: (data: MessageReadData) => void
    onUserStatus?: (status: UserStatus) => void
    onMessageSent?: (message: MessageData) => void
    onMessageError?: (error: { error: string }) => void
  }>({})

  // Typing timeout ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user?.id || !autoConnect) return

    const socketIO = io({
      path: "/api/socketio",
      auth: {
        token: session.accessToken || "dummy-token", // Replace with actual token
        userId: session.user.id,
      },
    })

    // Connection event handlers
    socketIO.on("connect", () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("Connected to WebSocket server")
      }
      setIsConnected(true)
      
      // Join specific conversation if provided
      if (conversationId) {
        socketIO.emit("join-conversation", conversationId)
      }
    })

    socketIO.on("disconnect", () => {
      if (process.env.NODE_ENV === 'development') {
        console.log("Disconnected from WebSocket server")
      }
      setIsConnected(false)
    })

    // Message event handlers
    socketIO.on("new-message", (message: MessageWithSender) => {
      callbacksRef.current.onNewMessage?.(message)
    })

    socketIO.on("message-sent", (message: MessageData) => {
      callbacksRef.current.onMessageSent?.(message)
    })

    socketIO.on("message-error", (error: { error: string }) => {
      callbacksRef.current.onMessageError?.(error)
    })

    // Typing event handlers
    socketIO.on("user-typing", (data: TypingData) => {
      callbacksRef.current.onTyping?.(data)
    })

    socketIO.on("user-stop-typing", (data: TypingData) => {
      callbacksRef.current.onStopTyping?.(data)
    })

    // Read status handlers
    socketIO.on("message-read", (data: MessageReadData) => {
      callbacksRef.current.onMessageRead?.(data)
    })

    // User status handlers
    socketIO.on("user-status", (status: UserStatus) => {
      callbacksRef.current.onUserStatus?.(status)
    })

    setSocket(socketIO)

    return () => {
      socketIO.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [session?.user?.id, autoConnect, conversationId])

  // Send message function
  const sendMessage = useCallback((message: Omit<MessageData, 'id' | 'createdAt'>) => {
    if (!socket || !isConnected) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Socket not connected")
      }
      return
    }

    socket.emit("send-message", message)
  }, [socket, isConnected])

  // Typing functions
  const startTyping = useCallback((conversationId: string) => {
    if (!socket || !isConnected || !session?.user) return

    const typingData: TypingData = {
      conversationId,
      userId: session.user.id,
      isTyping: true,
      userName: session.user.username || session.user.name || "Unknown",
    }

    socket.emit("typing-start", typingData)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId)
    }, 3000)
  }, [socket, isConnected, session?.user])

  const stopTyping = useCallback((conversationId: string) => {
    if (!socket || !isConnected || !session?.user) return

    const typingData: TypingData = {
      conversationId,
      userId: session.user.id,
      isTyping: false,
      userName: session.user.username || session.user.name || "Unknown",
    }

    socket.emit("typing-stop", typingData)

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [socket, isConnected, session?.user])

  // Mark message as read
  const markMessageAsRead = useCallback((messageId: string, conversationId: string) => {
    if (!socket || !isConnected) return

    socket.emit("mark-message-read", { messageId, conversationId })
  }, [socket, isConnected])

  // Join/leave conversation
  const joinConversation = useCallback((conversationId: string) => {
    if (!socket || !isConnected) return

    socket.emit("join-conversation", conversationId)
  }, [socket, isConnected])

  const leaveConversation = useCallback((conversationId: string) => {
    if (!socket || !isConnected) return

    socket.emit("leave-conversation", conversationId)
  }, [socket, isConnected])

  // Event listener registration functions
  const onNewMessage = useCallback((callback: (message: MessageWithSender) => void) => {
    callbacksRef.current.onNewMessage = callback
  }, [])

  const onTyping = useCallback((callback: (data: TypingData) => void) => {
    callbacksRef.current.onTyping = callback
  }, [])

  const onStopTyping = useCallback((callback: (data: TypingData) => void) => {
    callbacksRef.current.onStopTyping = callback
  }, [])

  const onMessageRead = useCallback((callback: (data: MessageReadData) => void) => {
    callbacksRef.current.onMessageRead = callback
  }, [])

  const onUserStatus = useCallback((callback: (status: UserStatus) => void) => {
    callbacksRef.current.onUserStatus = callback
  }, [])

  const onMessageSent = useCallback((callback: (message: MessageData) => void) => {
    callbacksRef.current.onMessageSent = callback
  }, [])

  const onMessageError = useCallback((callback: (error: { error: string }) => void) => {
    callbacksRef.current.onMessageError = callback
  }, [])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return {
    socket,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageAsRead,
    joinConversation,
    leaveConversation,
    onNewMessage,
    onTyping,
    onStopTyping,
    onMessageRead,
    onUserStatus,
    onMessageSent,
    onMessageError,
  }
}