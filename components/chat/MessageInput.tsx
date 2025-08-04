"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Send, Paperclip, Image, Smile, X } from "lucide-react"
import { MessageData } from "@/lib/websocket"

interface MessageInputProps {
  onSendMessage: (message: Omit<MessageData, 'id' | 'createdAt'>) => void
  onStartTyping: () => void
  onStopTyping: () => void
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
  placeholder = "Type a message...",
  className = ""
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [messageType, setMessageType] = useState<'text' | 'image' | 'file'>('text')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleSendMessage = useCallback(() => {
    if (!message.trim() && attachments.length === 0) return
    if (disabled) return

    const messageData: Omit<MessageData, 'id' | 'createdAt'> = {
      content: message.trim(),
      messageType,
      attachments,
      conversationId,
      senderId,
    }

    onSendMessage(messageData)
    setMessage("")
    setAttachments([])
    setMessageType('text')
    onStopTyping()
  }, [message, attachments, messageType, conversationId, senderId, onSendMessage, onStopTyping, disabled])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleInputChange = useCallback((value: string) => {
    setMessage(value)
    
    if (value.trim()) {
      onStartTyping()
    } else {
      onStopTyping()
    }
  }, [onStartTyping, onStopTyping])

  const uploadFile = async (file: File, type: 'image' | 'file') => {
    try {
      setIsUploading(true)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Upload failed",
        description: "Could not upload file. Please try again.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const uploadPromises = files.map(file => uploadFile(file, type))
    const uploadedUrls = await Promise.all(uploadPromises)
    const validUrls = uploadedUrls.filter(url => url !== null) as string[]

    if (validUrls.length > 0) {
      setAttachments(prev => [...prev, ...validUrls])
      setMessageType(type)
    }

    // Reset file input
    e.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
    if (attachments.length === 1) {
      setMessageType('text')
    }
  }

  const isMultiline = message.includes('\n') || message.length > 100

  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative group">
                {messageType === 'image' ? (
                  <div className="relative">
                    <img
                      src={attachment}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 pr-8 relative">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm truncate max-w-32">
                      {attachment.split('/').pop()?.split('_').pop() || 'File'}
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4">
        <div className="flex items-end space-x-2">
          {/* Attachment Buttons */}
          <div className="flex space-x-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="p-2"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <Image className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="p-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>

          {/* Message Input Field */}
          <div className="flex-1">
            {isMultiline ? (
              <Textarea
                value={message}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={placeholder}
                disabled={disabled}
                className="min-h-[40px] max-h-32 resize-none"
                rows={Math.min(Math.max(message.split('\n').length, 1), 4)}
              />
            ) : (
              <Input
                value={message}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={placeholder}
                disabled={disabled}
                className="rounded-full"
              />
            )}
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={disabled || (!message.trim() && attachments.length === 0) || isUploading}
            size="sm"
            className="rounded-full p-2 min-w-[40px] h-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'file')}
      />
    </div>
  )
}