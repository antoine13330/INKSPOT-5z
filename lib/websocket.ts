import { Server as NetServer } from "http"
import { NextApiRequest, NextApiResponse } from "next"
import { Server as ServerIO } from "socket.io"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO
    }
  }
}

// Message types for real-time communication
export interface MessageData {
  id: string
  content: string
  messageType: 'text' | 'image' | 'file' | 'payment' | 'booking'
  attachments?: string[]
  conversationId: string
  senderId: string
  createdAt: string
}

export interface TypingData {
  conversationId: string
  userId: string
  isTyping: boolean
  userName: string
}

export interface MessageReadData {
  messageId: string
  conversationId: string
  userId: string
  readAt: string
}

export interface UserStatus {
  userId: string
  status: 'online' | 'offline' | 'away'
  lastSeen?: string
}

// Initialize Socket.IO server
export const initSocketIO = (server: NetServer): ServerIO => {
  const io = new ServerIO(server, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error("Authentication error"))
      }

      // Verify token and get user (you can implement your own auth logic)
      const userId = socket.handshake.auth.userId
      if (!userId) {
        return next(new Error("User ID required"))
      }

      socket.data.userId = userId
      next()
    } catch (err) {
      next(new Error("Authentication error"))
    }
  })

  io.on("connection", (socket) => {
    console.log(`User ${socket.data.userId} connected`)

    // Join user to their conversations
    socket.on("join-conversations", async (conversationIds: string[]) => {
      for (const conversationId of conversationIds) {
        socket.join(conversationId)
      }
      
      // Emit user online status
      socket.broadcast.emit("user-status", {
        userId: socket.data.userId,
        status: "online"
      } as UserStatus)
    })

    // Handle joining specific conversation
    socket.on("join-conversation", (conversationId: string) => {
      socket.join(conversationId)
    })

    // Handle leaving conversation
    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(conversationId)
    })

    // Handle new message
    socket.on("send-message", async (data: Omit<MessageData, 'id' | 'createdAt'>) => {
      try {
        // Save message to database
        const message = await prisma.message.create({
          data: {
            content: data.content,
            messageType: data.messageType,
            attachments: data.attachments || [],
            conversationId: data.conversationId,
            senderId: data.senderId,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
              }
            }
          }
        })

        // Broadcast message to conversation members
        const messageData: MessageData = {
          id: message.id,
          content: message.content,
          messageType: message.messageType as any,
          attachments: message.attachments,
          conversationId: message.conversationId,
          senderId: message.senderId,
          createdAt: message.createdAt.toISOString(),
        }

        socket.to(data.conversationId).emit("new-message", {
          ...messageData,
          sender: message.sender
        })

        // Acknowledge message sent
        socket.emit("message-sent", messageData)

        // Update conversation's updatedAt
        await prisma.conversation.update({
          where: { id: data.conversationId },
          data: { updatedAt: new Date() }
        })

      } catch (error) {
        console.error("Error sending message:", error)
        socket.emit("message-error", { error: "Failed to send message" })
      }
    })

    // Handle typing indicators
    socket.on("typing-start", (data: TypingData) => {
      socket.to(data.conversationId).emit("user-typing", data)
    })

    socket.on("typing-stop", (data: TypingData) => {
      socket.to(data.conversationId).emit("user-stop-typing", data)
    })

    // Handle message read status
    socket.on("mark-message-read", async (data: { messageId: string, conversationId: string }) => {
      try {
        // Update last read timestamp for user in conversation
        await prisma.conversationMember.updateMany({
          where: {
            conversationId: data.conversationId,
            userId: socket.data.userId
          },
          data: {
            lastReadAt: new Date()
          }
        })

        // Broadcast read status
        const readData: MessageReadData = {
          messageId: data.messageId,
          conversationId: data.conversationId,
          userId: socket.data.userId,
          readAt: new Date().toISOString()
        }

        socket.to(data.conversationId).emit("message-read", readData)
      } catch (error) {
        console.error("Error marking message as read:", error)
      }
    })

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.data.userId} disconnected`)
      
      // Emit user offline status
      socket.broadcast.emit("user-status", {
        userId: socket.data.userId,
        status: "offline",
        lastSeen: new Date().toISOString()
      } as UserStatus)
    })
  })

  return io
}

// Helper function to get Socket.IO instance
export const getSocketIO = (res: NextApiResponseServerIO): ServerIO => {
  if (!res.socket.server.io) {
    console.log("*First use, starting Socket.IO")
    res.socket.server.io = initSocketIO(res.socket.server)
  }
  return res.socket.server.io
}