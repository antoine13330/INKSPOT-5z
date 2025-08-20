import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface TypingIndicatorProps {
  typingUsers: { userId: string; userName: string }[]
  className?: string
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null

  const displayText = typingUsers.length === 1 
    ? `${typingUsers[0].userName} est en train d'écrire...`
    : `${typingUsers.length} personnes sont en train d'écrire...`

  return (
    <div className={cn(
      'flex items-center gap-2 p-3 text-sm text-muted-foreground',
      className
    )}>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="italic">{displayText}</span>
    </div>
  )
}
