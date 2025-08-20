"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Search, 
  MoreVertical, 
  Reply, 
  Edit, 
  Trash2, 
  Pin, 
  Star,
  FileText,
  Image,
  Paperclip,
  Smile,
  SendHorizontal,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useSocketIO } from '@/hooks/useSocketIO'
import { useConversationNotifications } from '@/hooks/useConversationNotifications'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { NetworkError } from '@/components/ui/error-boundary'
import { useFormValidation } from '@/components/ui/form-validation'

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  senderAvatar?: string
  timestamp: Date
  isRead: boolean
  replyTo?: {
    id: string
    content: string
    senderName: string
  }
  attachments?: Array<{
    id: string
    name: string
    type: 'image' | 'document' | 'other'
    url: string
    size: number
  }>
  editedAt?: Date
  isEdited: boolean
}

interface ConversationInterfaceProps {
  conversationId: string
  messages: Message[]
  participants: Array<{
    id: string
    name: string
    avatar?: string
    isOnline: boolean
    lastSeen?: Date
  }>
  currentUserId: string
  onSendMessage: (content: string, replyTo?: string, attachments?: File[]) => Promise<void>
  onDeleteMessage?: (messageId: string) => Promise<void>
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>
  onPinMessage?: (messageId: string) => Promise<void>
  onStarMessage?: (messageId: string) => Promise<void>
  className?: string
}

export function ConversationInterface({
  conversationId,
  messages,
  participants,
  currentUserId,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onPinMessage,
  onStarMessage,
  className = ""
}: ConversationInterfaceProps) {
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editContent, setEditContent] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([])
  const [starredMessages, setStarredMessages] = useState<Message[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Socket connection
  const { socket, isConnected } = useSocketIO()
  
  // Notifications
  const { markAsRead, unreadCount } = useConversationNotifications(conversationId)
  
  // Form validation
  const { validateField, errors, clearErrors } = useFormValidation({
    message: {
      required: true,
      minLength: 1,
      maxLength: 2000
    }
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing indicators
  useEffect(() => {
    if (!socket) return

    const handleTypingStart = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId && data.userId !== currentUserId) {
        setTypingUsers(prev => [...new Set([...prev, data.userId])])
      }
    }

    const handleTypingStop = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => prev.filter(id => id !== data.userId))
      }
    }

    socket.on('typing:start', handleTypingStart)
    socket.on('typing:stop', handleTypingStop)

    return () => {
      socket.off('typing:start', handleTypingStart)
      socket.off('typing:stop', handleTypingStop)
    }
  }, [socket, conversationId, currentUserId])

  // Handle message status updates
  useEffect(() => {
    if (!socket) return

    const handleMessageRead = (data: { messageId: string; userId: string }) => {
      // Update message read status
    }

    const handleMessageDelivered = (data: { messageId: string; userId: string }) => {
      // Update message delivery status
    }

    socket.on('message:read', handleMessageRead)
    socket.on('message:delivered', handleMessageDelivered)

    return () => {
      socket.off('message:read', handleMessageRead)
      socket.off('message:delivered', handleMessageDelivered)
    }
  }, [socket])

  // Typing indicator with debounce
  const handleTyping = useCallback(
    debounce(() => {
      if (socket && isConnected) {
        socket.emit('typing:start', { conversationId })
        setTimeout(() => {
          socket.emit('typing:stop', { conversationId })
        }, 3000)
      }
    }, 500),
    [socket, isConnected, conversationId]
  )

  // Send message
  const handleSendMessage = async () => {
    try {
      setError(null)
      clearErrors()
      
      // Validate message
      const messageValidation = validateField('message', newMessage)
      if (!messageValidation.isValid) {
        setError(messageValidation.errors[0])
        return
      }

      setIsLoading(true)
      
      await onSendMessage(newMessage, replyTo?.id, attachments)
      
      setNewMessage("")
      setReplyTo(null)
      setAttachments([])
      
      // Mark conversation as read
      markAsRead()
      
      toast.success("Message envoyé")
    } catch (error) {
      setError("Erreur lors de l'envoi du message")
      toast.error("Erreur lors de l'envoi du message")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast.error(`Fichier trop volumineux: ${file.name}`)
        return false
      }
      return true
    })
    
    setAttachments(prev => [...prev, ...validFiles])
  }

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Start editing message
  const startEditing = (message: Message) => {
    setEditingMessage(message)
    setEditContent(message.content)
  }

  // Save edited message
  const saveEdit = async () => {
    if (!editingMessage || !onEditMessage) return
    
    try {
      await onEditMessage(editingMessage.id, editContent)
      setEditingMessage(null)
      setEditContent("")
      toast.success("Message modifié")
    } catch (error) {
      toast.error("Erreur lors de la modification")
    }
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingMessage(null)
    setEditContent("")
  }

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!onDeleteMessage) return
    
    try {
      await onDeleteMessage(messageId)
      toast.success("Message supprimé")
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    }
  }

  // Filter messages based on search
  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (type.startsWith('text/')) return <FileText className="w-4 h-4" />
    return <Paperclip className="w-4 h-4" />
  }

  if (error) {
    return <NetworkError message={error} onRetry={() => setError(null)} />
  }

  return (
    <ErrorBoundary>
      <div className={`flex flex-col h-full ${className}`}>
        {/* Header */}
        <CardHeader className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((participant) => (
                  <Avatar key={participant.id} className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback>{participant.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {participants.map(p => p.name).join(', ')}
                </CardTitle>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {participants.some(p => p.isOnline) && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                  <span>
                    {participants.some(p => p.isOnline) 
                      ? 'En ligne' 
                      : `${participants.length} participant(s)`
                    }
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                </Badge>
              )}
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans la conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Pin className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Messages épinglés</span>
                </div>
                {pinnedMessages.map(message => (
                  <div key={message.id} className="text-sm text-yellow-700 bg-white rounded p-2 mb-2">
                    <div className="font-medium">{message.senderName}</div>
                    <div>{message.content}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Messages */}
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${message.senderId === currentUserId ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-end space-x-2 ${message.senderId === currentUserId ? 'flex-row-reverse' : 'flex-row'}`}>
                    {message.senderId !== currentUserId && (
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={message.senderAvatar} />
                        <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`rounded-lg px-3 py-2 ${
                      message.senderId === currentUserId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {/* Reply to message */}
                      {message.replyTo && (
                        <div className={`text-xs mb-1 ${
                          message.senderId === currentUserId ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          <div className="font-medium">Réponse à {message.replyTo.senderName}</div>
                          <div className="truncate">{message.replyTo.content}</div>
                        </div>
                      )}
                      
                      {/* Message content */}
                      {editingMessage?.id === message.id ? (
                        <div className="space-y-2">
                          <Textarea
                            ref={textareaRef}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px] resize-none"
                            autoFocus
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={saveEdit}>Sauvegarder</Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>Annuler</Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-background/50 rounded">
                                  {getFileIcon(attachment.type)}
                                  <span className="text-sm">{attachment.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({formatFileSize(attachment.size)})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Message metadata */}
                      <div className={`flex items-center space-x-1 mt-1 text-xs ${
                        message.senderId === currentUserId ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        <span>{format(message.timestamp, 'HH:mm', { locale: fr })}</span>
                        {message.isEdited && <span>(modifié)</span>}
                        {message.senderId === currentUserId && (
                          <>
                            {message.isRead ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Message actions */}
                  {message.senderId === currentUserId && (
                    <div className="flex justify-end mt-1 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(message)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMessage(message.id)}
                        className="h-6 w-6 p-0 text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicators */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-sm text-muted-foreground ml-2">
                      {typingUsers.length === 1 ? 'tape...' : 'tapent...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Reply to message */}
        {replyTo && (
          <div className="border-t bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Reply className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Réponse à {replyTo.senderName}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground truncate mt-1">
              {replyTo.content}
            </div>
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="border-t bg-muted/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Pièces jointes ({attachments.length})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAttachments([])}
                className="h-6 px-2 text-destructive"
              >
                Tout supprimer
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 bg-background rounded-lg px-3 py-2">
                  {getFileIcon(file.type)}
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({formatFileSize(file.size)})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    className="h-4 w-4 p-0 text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-end space-x-2">
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Tapez votre message..."
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value)
                  handleTyping()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              
              {/* Error message */}
              {errors.message && (
                <div className="text-sm text-destructive flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.message}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* File upload */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-10 w-10"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              {/* Emoji picker (placeholder) */}
              <Button
                variant="ghost"
                size="icon"
                disabled={isLoading}
                className="h-10 w-10"
              >
                <Smile className="w-4 h-4" />
              </Button>
              
              {/* Send button */}
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !newMessage.trim()}
                className="h-10 px-4"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>
      </div>
    </ErrorBoundary>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
