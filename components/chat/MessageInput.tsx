"use client"

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button, Input } from '@/components/ui/base-components'
import { Send, Paperclip, Mic, Image as ImageIcon } from 'lucide-react'
import { ImageUpload } from './ImageUpload'

interface MessageInputProps {
  onSendMessage: (messageData: { content: string; type: string; images?: string[] }) => void
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
  disabled = false,
  placeholder = "Tapez votre message...",
  className
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
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
    if ((!message.trim() && uploadedImages.length === 0) || disabled) return

    onSendMessage({
      content: message.trim(),
      type: uploadedImages.length > 0 ? 'IMAGE' : 'TEXT',
      images: uploadedImages.length > 0 ? uploadedImages : undefined
    })
    setMessage("")
    setUploadedImages([])
    setIsTyping(false)
    onStopTyping?.()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImages(prev => [...prev, imageUrl])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // TODO: Implement file upload
      if (process.env.NODE_ENV === 'development') {
        console.log('File selected:', file)
      }
    }
  }

  const handleVoiceMessage = () => {
    // TODO: Implement voice message recording
    if (process.env.NODE_ENV === 'development') {
      console.log('Voice message recording...')
    }
  }

  return (
    <div className={cn(
      "chat-input",
      className
    )}>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setShowImageUpload(!showImageUpload)}
        disabled={disabled}
      >
        <ImageIcon className="w-5 h-5" />
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
        disabled={(!message.trim() && uploadedImages.length === 0) || disabled}
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

      {/* Image Upload Component */}
      {showImageUpload && (
        <div className="mt-3">
          <ImageUpload
            onImageUpload={handleImageUpload}
            onCancel={() => setShowImageUpload(false)}
          />
        </div>
      )}

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {uploadedImages.map((imageUrl, index) => (
            <div key={index} className="relative">
              <img
                src={imageUrl}
                alt={`Uploaded ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}