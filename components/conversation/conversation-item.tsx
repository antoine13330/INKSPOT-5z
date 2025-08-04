import React from 'react'
import Link from 'next/link'
import { cn, formatRelativeTime, getInitials, truncateText } from '@/lib/utils'
import { ConversationParticipant } from '@/types'
import { Avatar, Badge } from '@/components/ui/base-components'

interface ConversationItemProps {
  id: string
  participant: ConversationParticipant
  lastMessage?: {
    content: string
    createdAt: string
    isFromUser: boolean
  }
  unreadCount: number
  isActive?: boolean
  className?: string
}

export function ConversationItem({
  id,
  participant,
  lastMessage,
  unreadCount,
  isActive = false,
  className
}: ConversationItemProps) {
  const displayName = participant.name || participant.username
  const initials = getInitials(displayName)
  const messagePreview = lastMessage 
    ? truncateText(
        lastMessage.isFromUser ? `Vous: ${lastMessage.content}` : lastMessage.content,
        50
      )
    : 'Aucun message'

  return (
    <Link
      href={`/conversations/${id}`}
      className={cn(
        'conversation-item',
        isActive && 'bg-surface-elevated border-primary/20',
        className
      )}
    >
      <Avatar
        src={participant.avatar}
        alt={displayName}
        fallback={initials}
        size="lg"
        className="conversation-avatar"
      />
      
      <div className="conversation-content">
        <div className="conversation-name">
          {displayName}
          {participant.role === "PRO" && (
            <Badge variant="secondary" size="sm" className="ml-2">
              PRO
            </Badge>
          )}
        </div>
        <div className="conversation-preview">
          {messagePreview}
        </div>
      </div>
      
      <div className="conversation-meta">
        {lastMessage && (
          <div className="conversation-time">
            {formatRelativeTime(lastMessage.createdAt)}
          </div>
        )}
        {unreadCount > 0 && (
          <div className="conversation-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>
    </Link>
  )
} 