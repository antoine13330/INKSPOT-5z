"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ConversationParticipant, Message } from '@/types'
import { cn, getInitials } from '@/lib/utils'
import { MessageBubble } from './message-bubble'
import { Avatar, Button, Input, EmptyState } from '@/components/ui/base-components'
import { 
  Send, 
  Paperclip, 
  Mic, 
  MoreVertical, 
  Phone, 
  Video,
  MessageCircle
} from 'lucide-react'

interface ChatInterfaceProps {
  participant: ConversationParticipant
  messages?: Message[]
  onSendMessage?: (content: string) => void
  onSendFile?: (file: File) => void
  loading?: boolean
  error?: string | null
  className?: string
}

export function ChatInterface({ 
  participant, 
  messages = [], 
  onSendMessage,
  onSendFile,
  loading = false,
  error = null,
  className
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

  const displayName = participant.name || participant.username
  const initials = getInitials(displayName)

  return (
    <div className={cn("chat-container", className)}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="flex items-center gap-3 flex-1">
          <Avatar
            src={participant.avatar}
            alt={displayName}
            fallback={initials}
            size="lg"
            className="conversation-avatar"
          />
          <div className="flex-1">
            <h2 className="conversation-name">{displayName}</h2>
            <p className="text-sm text-secondary">
              {participant.isOnline ? 'En ligne' : 'Hors ligne'}
            </p>
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
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-secondary">Chargement...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-destructive mb-2">{error}</p>
              <Button variant="outline" size="sm">
                Réessayer
              </Button>
            </div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isFromUser={message.isFromUser}
            />
          ))
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="Aucun message"
            description={`Commencez la conversation avec ${displayName}`}
          />
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
          size="sm"
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
          size="sm"
        >
          <Mic className="w-5 h-5" />
        </Button>
        
        <Button 
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          size="sm"
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