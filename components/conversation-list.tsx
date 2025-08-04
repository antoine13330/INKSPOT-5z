"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Search, Filter } from "lucide-react"

interface Conversation {
  id: string
  participant: {
    id: string
    name: string
    username: string
    avatar?: string
    role: string
  }
  lastMessage: {
    content: string
    timestamp: string
    isFromUser: boolean
  }
  unreadCount: number
  isActive: boolean
}

interface ConversationListProps {
  conversations?: Conversation[]
  showDateFilter?: boolean
  showSearch?: boolean
  title?: string
}

export function ConversationList({ 
  conversations = [], 
  showDateFilter = false,
  showSearch = false,
  title = "Conversations"
}: ConversationListProps) {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>(conversations)

  // Filter conversations based on search term
  useEffect(() => {
    const filtered = conversations.filter(conv => 
      conv.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.participant.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredConversations(filtered)
  }, [conversations, searchTerm])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 48) {
      return 'Hier'
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="app-container">
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
                  className="pl-10 form-input"
                />
              </div>
            )}
            {showDateFilter && (
              <Button variant="outline" className="btn-secondary">
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
            {filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                className="conversation-item"
              >
                <div className="conversation-avatar">
                  {conversation.participant.avatar ? (
                    <AvatarImage src={conversation.participant.avatar} />
                  ) : (
                    <AvatarFallback>
                      {getInitials(conversation.participant.name)}
                    </AvatarFallback>
                  )}
                </div>
                
                <div className="conversation-content">
                  <div className="conversation-name">
                    {conversation.participant.name}
                    {conversation.participant.role === "PRO" && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        PRO
                      </Badge>
                    )}
                  </div>
                  <div className="conversation-preview">
                    {conversation.lastMessage.isFromUser && "Vous: "}
                    {conversation.lastMessage.content}
                  </div>
                </div>
                
                <div className="conversation-meta">
                  <div className="conversation-time">
                    {formatTime(conversation.lastMessage.timestamp)}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="conversation-badge">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-tertiary" />
              </div>
              <h3 className="text-lg font-medium text-primary mb-2">
                Aucune conversation
              </h3>
              <p className="text-secondary mb-4">
                {searchTerm 
                  ? "Aucune conversation trouvée pour votre recherche."
                  : "Commencez une conversation avec un artiste ou un client."
                }
              </p>
              {!searchTerm && (
                <Button className="btn-primary">
                  Découvrir des artistes
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 