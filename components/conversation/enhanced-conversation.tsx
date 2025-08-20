"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { 
  MessageCircle, 
  Send, 
  ImageIcon, 
  Mic, 
  Phone, 
  Video, 
  MoreVertical,
  ArrowLeft,
  Wifi,
  Paperclip,
  Smile,
  X,
  Check,
  Clock,
  User,
  Star
} from "lucide-react"
import { toast } from "sonner"

interface EnhancedConversationProps {
  artist: {
    id: string
    username: string
    businessName?: string
    avatar?: string
    role?: string
    location?: string
    hourlyRate?: number
  }
  post: {
    id: string
    content: string
    images: string[]
    price?: number
  }
  onClose: () => void
  onSendMessage?: (message: string) => void
}

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: Date
  type: 'text' | 'image' | 'system'
  isFromUser: boolean
}

export function EnhancedConversation({ 
  artist, 
  post, 
  onClose, 
  onSendMessage 
}: EnhancedConversationProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [conversationCreated, setConversationCreated] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Désactiver les messages simulés par défaut
  const mockMessages: Message[] = []

  useEffect(() => {
    // Créer la conversation via l'API
    const createConversation = async () => {
      try {
        const response = await fetch('/api/conversations/create-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participantId: artist.id,
            postId: post.id,
            subject: `Demande pour: ${post.content.substring(0, 50)}...`,
            type: 'DIRECT'
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Conversation créée:', data)
          
          // Simuler un délai pour l'UX
          setTimeout(() => {
            setIsLoading(false)
            setConversationCreated(true)
            setMessages(mockMessages)
          }, 1500)
        } else {
          console.error('Erreur création conversation:', response.status)
          // Fallback avec simulation
          setTimeout(() => {
            setIsLoading(false)
            setConversationCreated(true)
            setMessages(mockMessages)
          }, 1500)
        }
      } catch (error) {
        console.error('Erreur création conversation:', error)
        // Fallback avec simulation
        setTimeout(() => {
          setIsLoading(false)
          setConversationCreated(true)
          setMessages(mockMessages)
        }, 1500)
      }
    }

    createConversation()
  }, [artist.id, post.id, post.content])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simuler la frappe de l'artiste
  useEffect(() => {
    if (conversationCreated && messages.length > 0) {
      const typingTimer = setTimeout(() => {
        setIsTyping(true)
        const responseTimer = setTimeout(() => {
          setIsTyping(false)
          // Ajouter une réponse automatique après la frappe
          const newMessage: Message = {
            id: Date.now().toString(),
            content: "C'est noté ! Je vous envoie un devis détaillé dans la journée.",
            senderId: artist.id,
            timestamp: new Date(),
            type: 'text',
            isFromUser: false
          }
          setMessages(prev => [...prev, newMessage])
        }, 2000)
        return () => clearTimeout(responseTimer)
      }, 5000)
      return () => clearTimeout(typingTimer)
    }
  }, [conversationCreated, messages.length, artist.id])

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message,
        senderId: "user",
        timestamp: new Date(),
        type: 'text',
        isFromUser: true
      }
      setMessages(prev => [...prev, newMessage])
      
      if (onSendMessage) {
        onSendMessage(message)
      }
      
      setMessage("")
      toast.success("Message envoyé !")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedImages(prev => [...prev, ...files])
      toast.success(`${files.length} image(s) sélectionnée(s)`)
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const displayName = artist.businessName || artist.username

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <div>
                <h3 className="text-lg font-semibold">Création de la conversation...</h3>
                <p className="text-muted-foreground">
                  Connexion avec {displayName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (conversationCreated) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Avatar className="w-12 h-12">
              <AvatarImage src={artist.avatar} />
              <AvatarFallback>
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{displayName}</h2>
                {artist.role === "PRO" && (
                  <Badge variant="secondary">PRO</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-success" />
                  <span>En ligne</span>
                </div>
                {artist.location && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{artist.location}</span>
                  </div>
                )}
                {artist.hourlyRate && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>€{artist.hourlyRate}/h</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Appeler">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Vidéo">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Plus d'options">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-muted/20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isFromUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs ${msg.isFromUser ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'} rounded-lg p-3`}>
                <p className="text-sm">{msg.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs ${msg.isFromUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {formatTime(msg.timestamp)}
                  </span>
                  {msg.isFromUser && (
                    <div className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-primary-foreground/70" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Indicateur de frappe */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground">{displayName} tape...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Images sélectionnées */}
        {selectedImages.length > 0 && (
          <div className="px-4 py-2 border-t border-border bg-card">
            <div className="flex items-center gap-2 overflow-x-auto">
              {selectedImages.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index}`}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowImageUpload(!showImageUpload)}
              title="Ajouter une image"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <Input
              placeholder="Tapez votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Ajouter un emoji"
            >
              <Smile className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              title="Message vocal"
            >
              <Mic className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() && selectedImages.length === 0}
              size="icon"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Upload d'images caché */}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          {showImageUpload && (
            <label htmlFor="image-upload" className="block mt-2">
              <Button variant="outline" size="sm" className="w-full">
                <ImageIcon className="w-4 h-4 mr-2" />
                Sélectionner des images
              </Button>
            </label>
          )}
        </div>
      </div>
    )
  }

  return null
}
