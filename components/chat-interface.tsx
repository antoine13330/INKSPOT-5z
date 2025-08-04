"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Send, 
  Paperclip, 
  Mic, 
  MoreVertical, 
  Phone, 
  Video,
  Image as ImageIcon,
  MessageCircle
} from "lucide-react"

interface Message {
  id: string
  content: string
  timestamp: string
  isFromUser: boolean
  type: 'text' | 'image' | 'file'
  mediaUrl?: string
}

interface ChatInterfaceProps {
  participant: {
    id: string
    name: string
    username: string
    avatar?: string
    role: string
    isOnline?: boolean
  }
  messages?: Message[]
  onSendMessage?: (content: string) => void
  onSendFile?: (file: File) => void
}

export function ChatInterface({ 
  participant, 
  messages = [], 
  onSendMessage,
  onSendFile 
}: ChatInterfaceProps) {
  const { data: session } = useSession()
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage.trim())
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onSendFile) {
      onSendFile(file)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="flex items-center gap-3 flex-1">
          <div className="conversation-avatar">
            {participant.avatar ? (
              <AvatarImage src={participant.avatar} />
            ) : (
              <AvatarFallback>
                {getInitials(participant.name)}
              </AvatarFallback>
            )}
          </div>
          <div className="flex-1">
            <h2 className="conversation-name">{participant.name}</h2>
            <p className="text-sm text-secondary">
              {participant.isOnline ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="btn-ghost">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="btn-ghost">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="btn-ghost">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div
              key={message.id}
              className={`message ${message.isFromUser ? 'user' : 'other'}`}
            >
              <div className="message-bubble">
                {message.type === 'image' && message.mediaUrl && (
                  <div className="mb-2">
                    <img 
                      src={message.mediaUrl} 
                      alt="Image" 
                      className="rounded-lg max-w-full max-h-64 object-cover"
                    />
                  </div>
                )}
                <div className="message-content">
                  {message.content}
                </div>
                <div className="text-xs text-tertiary mt-1 opacity-70">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="card">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-tertiary" />
                </div>
                <h3 className="text-lg font-medium text-primary mb-2">
                  Aucun message
                </h3>
                <p className="text-secondary">
                  Commencez la conversation avec {participant.name}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {isTyping && (
          <div className="message other">
            <div className="message-bubble">
              <div className="flex items-center gap-1">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="text-xs text-tertiary">écrit...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="chat-input">
        <Button 
          variant="ghost" 
          size="icon" 
          className="btn-ghost"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        
        <Input
          type="text"
          placeholder="Tapez votre message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="input-field"
        />
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="btn-ghost"
        >
          <Mic className="w-5 h-5" />
        </Button>
        
        <Button 
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="input-button"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

// Typing indicator styles
const typingIndicatorStyles = `
  .typing-indicator {
    display: flex;
    gap: 2px;
  }
  
  .typing-indicator span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--color-text-tertiary);
    animation: typing 1.4s infinite ease-in-out;
  }
  
  .typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
  }
  
  .typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
  }
  
  @keyframes typing {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`

// Add styles to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = typingIndicatorStyles
  document.head.appendChild(style)
} 