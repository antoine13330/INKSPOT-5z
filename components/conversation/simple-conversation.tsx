"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Send, 
  ArrowLeft,
  Wifi,
  User,
  Star
} from "lucide-react"
import { toast } from "sonner"

interface SimpleConversationProps {
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
}

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: Date
  isFromUser: boolean
}

export function SimpleConversation({ artist, post, onClose }: SimpleConversationProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Message initial simulé
  useEffect(() => {
    const initialMessage: Message = {
      id: "1",
      content: "Bonjour ! Je suis intéressé(e) par votre post. Pouvez-vous me donner plus de détails ?",
      senderId: "user",
      timestamp: new Date(),
      isFromUser: true
    }
    setMessages([initialMessage])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message,
        senderId: "user",
        timestamp: new Date(),
        isFromUser: true
      }
      setMessages(prev => [...prev, newMessage])
      setMessage("")
      toast.success("Message envoyé !")
      
      // Simuler une réponse de l'artiste
      setTimeout(() => {
        const artistResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: "Merci pour votre message ! Je vais vous répondre rapidement.",
          senderId: artist.id,
          timestamp: new Date(),
          isFromUser: false
        }
        setMessages(prev => [...prev, artistResponse])
      }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
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
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tapez votre message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim()}
            size="icon"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
