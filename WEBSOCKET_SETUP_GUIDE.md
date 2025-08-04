# 🚀 Real-Time Messaging System - Setup Guide

## 📋 Overview

This guide covers the complete setup and implementation of the real-time messaging system for INKSPOT-5z using Socket.IO and WebSockets.

## 🔧 Features Implemented

✅ **Real-time messaging** - Instant message delivery  
✅ **Typing indicators** - See when users are typing  
✅ **Message read status** - Track message read receipts  
✅ **Online/offline status** - User presence indicators  
✅ **File/image sharing** - Upload and share media  
✅ **Message search** - Search through conversation history  
✅ **Connection status** - Real-time connection monitoring  
✅ **Auto-reconnection** - Automatic reconnection on disconnect  

## 📦 Dependencies Installed

```bash
npm install socket.io socket.io-client @types/socket.io framer-motion
```

## 🏗️ Architecture

```
├── lib/websocket.ts              # WebSocket server setup & types
├── pages/api/socketio.ts         # Socket.IO API route
├── hooks/useWebSocket.ts         # Client-side WebSocket hook
├── components/chat/
│   ├── MessageList.tsx           # Message display component
│   ├── MessageInput.tsx          # Message input with file upload
│   └── TypingIndicator.tsx       # Typing animation component
├── app/api/messages/realtime/    # Real-time message API
└── app/conversations/[id]/       # Updated conversation page
```

## 🚀 Starting the WebSocket Server

### 1. Development Mode

```bash
# Start the Next.js development server
npm run dev

# The WebSocket server will automatically start on the same port
# WebSocket endpoint: http://localhost:3000/api/socketio
```

### 2. Production Mode

```bash
# Build the application
npm run build

# Start the production server
npm start

# WebSocket will be available at your production URL
```

### 3. Environment Variables

Add to your `.env.local`:

```bash
# Required for Socket.IO CORS
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database connection (already configured)
DATABASE_URL="your-database-url"

# NextAuth configuration (already configured)
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 📱 Using the Real-Time Features

### 1. Basic Message Sending

The WebSocket hook automatically handles message sending:

```typescript
import { useWebSocket } from "@/hooks/useWebSocket"

const { sendMessage, isConnected } = useWebSocket({
  conversationId: "your-conversation-id",
  autoConnect: true
})

// Send a text message
sendMessage({
  content: "Hello world!",
  messageType: "text",
  conversationId: "conv-id",
  senderId: "user-id"
})
```

### 2. Handling Real-Time Events

```typescript
const {
  onNewMessage,
  onTyping,
  onStopTyping,
  onMessageRead,
  onUserStatus
} = useWebSocket({ conversationId })

// Listen for new messages
onNewMessage((message) => {
  console.log("New message received:", message)
})

// Listen for typing indicators
onTyping((data) => {
  console.log(`${data.userName} is typing...`)
})
```

### 3. File Upload Integration

Files are automatically uploaded when selected in the MessageInput component:

```typescript
// The MessageInput component handles:
// - Image uploads (preview + send)
// - File uploads (with file names)
// - Drag & drop support
// - Multiple file selection
```

## 🔌 WebSocket Events Reference

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join-conversation` | `conversationId: string` | Join a conversation room |
| `leave-conversation` | `conversationId: string` | Leave a conversation room |
| `send-message` | `MessageData` | Send a new message |
| `typing-start` | `TypingData` | Start typing indicator |
| `typing-stop` | `TypingData` | Stop typing indicator |
| `mark-message-read` | `{ messageId, conversationId }` | Mark message as read |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `new-message` | `MessageData & { sender }` | New message received |
| `message-sent` | `MessageData` | Message successfully sent |
| `message-error` | `{ error: string }` | Message sending failed |
| `user-typing` | `TypingData` | User started typing |
| `user-stop-typing` | `TypingData` | User stopped typing |
| `message-read` | `MessageReadData` | Message read by user |
| `user-status` | `UserStatus` | User online/offline status |

## 📊 Database Schema Requirements

The system uses the existing Prisma schema with these models:

```prisma
model Conversation {
  id        String   @id @default(cuid())
  title     String?
  isGroup   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  members  ConversationMember[]
  messages Message[]
}

model ConversationMember {
  id             String   @id @default(cuid())
  conversationId String
  userId         String
  joinedAt       DateTime @default(now())
  lastReadAt     DateTime?
  
  conversation Conversation @relation(fields: [conversationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])
}

model Message {
  id             String   @id @default(cuid())
  content        String
  messageType    String   @default("text")
  attachments    String[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  conversationId String
  sender         User         @relation(fields: [senderId], references: [id])
  senderId       String
}
```

## 🔒 Security Features

### 1. Authentication
- All WebSocket connections require valid authentication
- User sessions verified on connect
- User ID attached to socket for authorization

### 2. Authorization
- Users can only join conversations they're members of
- Message sending restricted to conversation members
- Read status updates validated per user

### 3. Rate Limiting
```typescript
// Built-in protections:
// - Typing indicator auto-stops after 3 seconds
// - Message validation on server
// - Connection throttling
```

## 🧪 Testing the Implementation

### 1. Manual Testing

1. **Open two browser windows/tabs**
2. **Log in as different users**
3. **Start a conversation**
4. **Test real-time features:**
   - Send messages between users
   - Watch typing indicators
   - Check online/offline status
   - Test file uploads
   - Verify message read status

### 2. Connection Testing

```javascript
// Check WebSocket connection in browser console
const socket = io({ path: "/api/socketio" })

socket.on("connect", () => {
  console.log("Connected to WebSocket server")
})

socket.on("disconnect", () => {
  console.log("Disconnected from WebSocket server")
})
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. WebSocket Connection Failed
```bash
Error: WebSocket connection failed
```
**Solution:**
- Ensure the development server is running
- Check that port 3000 is not blocked
- Verify CORS settings in `lib/websocket.ts`

#### 2. Authentication Errors
```bash
Error: Authentication error
```
**Solution:**
- Ensure user is logged in
- Check NextAuth session configuration
- Verify JWT token validity

#### 3. Messages Not Sending
```bash
Error: Failed to send message
```
**Solution:**
- Check database connection
- Verify user permissions
- Ensure conversation exists

#### 4. Typing Indicators Not Working
**Solution:**
- Check if users are in the same conversation
- Verify WebSocket connection status
- Clear browser cache and reconnect

### Debug Mode

Enable WebSocket debugging in development:

```typescript
// Add to lib/websocket.ts
const io = new ServerIO(server, {
  path: "/api/socketio",
  cors: { /* ... */ },
  transports: ['websocket', 'polling'], // Enable fallback
})

// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  io.engine.generateId = (req) => {
    return "custom-id-" + Math.random()
  }
}
```

## 📈 Performance Optimization

### 1. Message Pagination
- Messages loaded in chunks of 50
- Infinite scroll implementation ready
- Old messages cached locally

### 2. Connection Management
- Automatic reconnection on disconnect
- Connection pooling for multiple tabs
- Graceful degradation when offline

### 3. Memory Management
- Event listeners properly cleaned up
- Socket connections closed on unmount
- Message history limited per conversation

## 🔄 Next Steps

### Potential Enhancements

1. **Message Reactions** - Add emoji reactions
2. **Voice Messages** - Audio recording/playback
3. **Video Calls** - WebRTC integration
4. **Screen Sharing** - Share screen in conversations
5. **Message Threading** - Reply to specific messages
6. **Push Notifications** - Browser/mobile notifications
7. **Message Encryption** - End-to-end encryption
8. **Chat Bots** - Automated responses
9. **Message Scheduling** - Send messages later
10. **Multi-language** - Real-time translation

### Scaling Considerations

For production scaling:

1. **Redis Adapter** - Multiple server instances
2. **Load Balancing** - Distribute WebSocket connections
3. **Message Queues** - Reliable message delivery
4. **CDN Integration** - File upload optimization
5. **Database Optimization** - Message indexing
6. **Monitoring** - WebSocket metrics and alerts

## 📚 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Prisma Real-time](https://www.prisma.io/docs/guides/database/advanced-database-tasks/cascading-deletes)
- [Framer Motion](https://www.framer.com/motion/)

---

## ✅ Implementation Checklist

- [x] Install required dependencies
- [x] Create WebSocket server setup
- [x] Implement client-side hooks
- [x] Build message components
- [x] Add typing indicators
- [x] Implement read status
- [x] Add file upload support
- [x] Create message search
- [x] Update conversation page
- [x] Add connection monitoring
- [x] Test real-time features

**🎉 Your real-time messaging system is now ready to use!**

Start your development server with `npm run dev` and navigate to `/conversations/[id]` to experience the real-time messaging features.