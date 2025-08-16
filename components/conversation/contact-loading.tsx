"use client"

import { useState, useEffect } from "react"
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
  Wifi
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ContactLoadingProps {
  artist: {
    id: string
    username: string
    businessName?: string
    avatar?: string
  }
  post: {
    id: string
    content: string
    images: string[]
  }
  onClose: () => void
}

export function ContactLoading({ artist, post, onClose }: ContactLoadingProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [conversationCreated, setConversationCreated] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Simuler le chargement de la création de conversation
    const timer = setTimeout(() => {
      setIsLoading(false)
      setConversationCreated(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleSendMessage = () => {
    if (message.trim()) {
      // Simuler l'envoi du message
      toast.success("Message envoyé !")
      setMessage("")
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
                <Badge variant="secondary">PRO</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-success" />
                  <span className="text-secondary">En ligne</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Message de bienvenue */}
          <div className="flex justify-start">
            <div className="max-w-xs bg-muted rounded-lg p-3">
              <p className="text-sm">
                Bonjour ! Je suis intéressé(e) par votre post. Pouvez-vous me donner plus de détails ?
              </p>
              <span className="text-xs text-muted-foreground mt-2 block">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Message de l'artiste (simulé) */}
          <div className="flex justify-end">
            <div className="max-w-xs bg-primary text-primary-foreground rounded-lg p-3">
              <p className="text-sm">
                Bonjour ! Merci pour votre intérêt. Que souhaitez-vous savoir exactement ?
              </p>
              <span className="text-xs text-primary-foreground/70 mt-2 block">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Indicateur de frappe */}
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ImageIcon className="w-4 h-4" />
            </Button>
            
            <Input
              placeholder="Tapez votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            
            <Button variant="ghost" size="icon">
              <Mic className="w-4 h-4" />
            </Button>
            
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
