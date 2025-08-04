"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Conversation, ConversationParticipant } from '@/types'
import { cn, debounce } from '@/lib/utils'
import { ConversationItem } from './conversation-item'
import { Container, Section, EmptyState, LoadingState, ErrorState } from '@/components/ui/base-components'
import { Input, Button } from '@/components/ui/base-components'
import { Search, Filter, Calendar } from 'lucide-react'

interface ConversationListProps {
  conversations?: Conversation[]
  showDateFilter?: boolean
  showSearch?: boolean
  title?: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
}

export function ConversationList({ 
  conversations = [], 
  showDateFilter = false,
  showSearch = false,
  title = "Conversations",
  loading = false,
  error = null,
  onRetry,
  className
}: ConversationListProps) {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations)

  // Debounced search
  const debouncedSearch = debounce((term: string) => {
    const filtered = conversations.filter(conv => {
      const participant = conv.participants[0] // Assuming first participant is the other user
      return (
        participant.name.toLowerCase().includes(term.toLowerCase()) ||
        participant.username.toLowerCase().includes(term.toLowerCase()) ||
        conv.lastMessage?.content.toLowerCase().includes(term.toLowerCase())
      )
    })
    setFilteredConversations(filtered)
  }, 300)

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, conversations])

  // Get the other participant (not the current user)
  const getOtherParticipant = (conversation: Conversation): ConversationParticipant => {
    return conversation.participants.find(p => p.id !== session?.user?.id) || conversation.participants[0]
  }

  if (loading) {
    return <LoadingState message="Chargement des conversations..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  return (
    <div className={cn("app-container", className)}>
      {/* Header */}
      <div className="app-header">
        <div className="header-content">
          <h1 className="text-xl font-bold text-primary">{title}</h1>
          {showDateFilter && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-secondary" />
              <span className="text-sm text-secondary">12 Dec 2024</span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {(showSearch || showDateFilter) && (
        <div className="bg-surface border-b border-border p-4">
          <div className="flex gap-2">
            {showSearch && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tertiary" />
                <Input
                  type="text"
                  placeholder="Rechercher des conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            {showDateFilter && (
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="content-area">
        {filteredConversations.length > 0 ? (
          <div className="conversation-list">
            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation)
              return (
                <ConversationItem
                  key={conversation.id}
                  id={conversation.id}
                  participant={otherParticipant}
                  lastMessage={conversation.lastMessage ? {
                    content: conversation.lastMessage.content,
                    createdAt: conversation.lastMessage.createdAt,
                    isFromUser: conversation.lastMessage.isFromUser
                  } : undefined}
                  unreadCount={conversation.unreadCount}
                  isActive={conversation.isActive}
                />
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="Aucune conversation"
            description={
              searchTerm 
                ? "Aucune conversation trouvée pour votre recherche."
                : "Commencez une conversation avec un artiste ou un client."
            }
            action={
              !searchTerm && (
                <Button>
                  Découvrir des artistes
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  )
} 