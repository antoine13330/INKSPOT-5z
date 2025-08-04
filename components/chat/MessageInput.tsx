"use client"

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button, Input } from '@/components/ui/base-components'
import { Send, Paperclip, Mic } from 'lucide-react'

interface MessageInputProps {
  onSendMessage: (messageData: { content: string; type: string }) => void
  onStartTyping?: () => void
  onStopTyping?: () => void
  conversationId: string
  senderId: string
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function MessageInput({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  conversationId,
  senderId,
  disabled = false,
  placeholder = "Tapez votre message...",
  className
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Handle typing indicators
  useEffect(() => {
    if (message.length > 0 && !isTyping) {
      setIsTyping(true)
      onStartTyping?.()
    } else if (message.length === 0 && isTyping) {
      setIsTyping(false)
      onStopTyping?.()
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new typing timeout
    if (message.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        onStopTyping?.()
      }, 2000)
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [message, isTyping, onStartTyping, onStopTyping])

  const handleSendMessage = () => {
    if (!message.trim() || disabled) return

    onSendMessage({
      content: message.trim(),
      type: 'TEXT'
    })
    setMessage("")
    setIsTyping(false)
    onStopTyping?.()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // TODO: Implement file upload
      console.log('File selected:', file)
    }
  }

  const handleVoiceMessage = () => {
    // TODO: Implement voice message recording
    console.log('Voice message recording...')
  }

  return (
    <div className={cn(
      "chat-input",
      className
    )}>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
      >
        <Paperclip className="w-5 h-5" />
      </Button>
      
      <Input
        type="text"
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        className="input-field"
      />
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleVoiceMessage}
        disabled={disabled}
      >
        <Mic className="w-5 h-5" />
      </Button>
      
      <Button 
        onClick={handleSendMessage}
        disabled={!message.trim() || disabled}
        size="sm"
        className="input-button"
      >
        <Send className="w-5 h-5" />
      </Button>

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