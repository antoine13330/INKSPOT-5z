"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, User, MessageCircle } from "lucide-react"
import { Button, Avatar, Badge, LoadingState } from "@/components/ui/base-components"
import { BottomNavigation } from "@/components/bottom-navigation"
import { toast } from "sonner"

export default function NewConversationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const participantId = searchParams?.get('to')
  
  const [participant, setParticipant] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  // Fetch participant info if we have a participantId
  useEffect(() => {
    const fetchParticipant = async () => {
      if (!participantId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/users/${participantId}`)
        if (response.ok) {
          const data = await response.json()
          setParticipant(data.user)
        }
      } catch (error) {
        console.error('Error fetching participant:', error)
        toast.error("Failed to load user information")
      } finally {
        setLoading(false)
      }
    }

    fetchParticipant()
  }, [participantId])

  const handleStartConversation = async () => {
    if (!participantId || !session?.user?.id) {
      toast.error("Missing required information")
      return
    }

    try {
      setCreating(true)
      
      // Create or check for existing conversation
      const response = await fetch('/api/conversations/check-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participantId,
          postId: `profile:${participantId}`,
          subject: 'Nouvelle conversation'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to the conversation (will be in DRAFT state)
        router.push(data.redirectUrl)
      } else {
        throw new Error('Failed to create conversation')
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error("Failed to start conversation")
    } finally {
      setCreating(false)
    }
  }

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login')
    }
  }, [status, router])

  // Loading state
  if (status === 'loading' || loading) {
    return <LoadingState />
  }

  // After auth resolved, if no session, render nothing
  if (!session?.user?.id) {
    return null
  }

  // If no participant ID, show error
  if (!participantId) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="mx-auto max-w-lg flex items-center gap-3 py-3 px-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-base font-semibold text-foreground">New Conversation</h1>
            </div>
          </div>
        </div>
        
        <div className="px-4 py-8 mx-auto max-w-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Invalid Request</h2>
            <p className="text-muted-foreground mb-4">
              No user specified to start a conversation with.
            </p>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
        
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-lg flex items-center gap-3 py-3 px-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">New Conversation</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 mx-auto max-w-lg">
        {participant ? (
          <div className="space-y-6">
            {/* Participant Info */}
            <div className="card p-6">
              <div className="flex items-center gap-4">
                <Avatar 
                  src={participant.avatar}
                  alt={participant.firstName || participant.username}
                  fallback={participant.firstName?.[0] || participant.username?.[0] || 'U'}
                  size="xl"
                  className="w-16 h-16"
                />
                
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    {participant.businessName || `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || participant.username}
                  </h2>
                  <p className="text-muted-foreground">@{participant.username}</p>
                  {participant.role === 'PRO' && (
                    <Badge variant="secondary" className="mt-1">PRO</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Start Conversation Button */}
            <div className="card p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Start a Conversation
                  </h3>
                  <p className="text-muted-foreground">
                    Send your first message to {participant.firstName || participant.username} to start chatting.
                  </p>
                </div>
                <Button 
                  onClick={handleStartConversation}
                  disabled={creating}
                  className="w-full"
                  size="lg"
                >
                  {creating ? "Creating..." : "Start Conversation"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The user you're trying to message could not be found.
            </p>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
