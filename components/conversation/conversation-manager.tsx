"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ConversationManagerProps {
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

interface ConversationState {
  status: 'creating' | 'error'
  error?: string
}

export function ConversationManager({ artist, post, onClose }: ConversationManagerProps) {
  const [conversationState, setConversationState] = useState<ConversationState>({
    status: 'creating'
  })
  const router = useRouter()

  useEffect(() => {
    checkOrCreateConversation()
  }, [])

  const checkOrCreateConversation = async () => {
    try {
      setConversationState({ status: 'creating' })
      
      console.log("🔍 Vérification/création conversation...")
      
      const response = await fetch('/api/conversations/check-or-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: artist.id,
          postId: post.id,
          subject: `Demande pour: ${post.content.substring(0, 50)}...`
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Conversation prête:', data)
        
        if (data.success && data.redirectUrl) {
          // Rediriger vers la page de conversation
          toast.success("Redirection vers la conversation...")
          router.push(data.redirectUrl)
        } else {
          throw new Error("Réponse invalide de l'API")
        }

      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Erreur création conversation:', response.status, errorData)
        
        setConversationState({
          status: 'error',
          error: errorData.error || `Erreur ${response.status}: ${response.statusText}`
        })

        toast.error(`Erreur création conversation: ${errorData.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error('❌ Erreur réseau création conversation:', error)
      
      setConversationState({
        status: 'error',
        error: 'Erreur de connexion réseau'
      })

      toast.error('Erreur de connexion réseau')
    }
  }

  const retryCreation = () => {
    setConversationState({ status: 'creating' })
    checkOrCreateConversation()
  }

  // État de création
  if (conversationState.status === 'creating') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="w-full max-w-md mx-4 p-6 bg-card rounded-lg border border-border shadow-lg">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div>
              <h3 className="text-lg font-semibold">Connexion en cours...</h3>
              <p className="text-muted-foreground">
                Connexion avec {artist.businessName || artist.username}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Vérification de la conversation...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // État d'erreur
  if (conversationState.status === 'error') {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="w-full max-w-md mx-4 p-6 bg-card rounded-lg border border-border shadow-lg">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-destructive">Erreur de connexion</h3>
              <p className="text-muted-foreground">
                Impossible de se connecter
              </p>
              <p className="text-sm text-destructive mt-2">
                {conversationState.error}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={retryCreation}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Réessayer
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
