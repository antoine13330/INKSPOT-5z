"use client"

import React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { UserIcon } from "lucide-react"

interface MentionHighlighterProps {
  text: string
  className?: string
}

export function MentionHighlighter({ text, className = "" }: MentionHighlighterProps) {
  // Regex pour détecter les mentions @username
  const mentionRegex = /@(\w+)/g
  
  // Fonction pour traiter le texte et remplacer les mentions
  const processText = (text: string) => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match
    
    // Réinitialiser le regex pour une nouvelle recherche
    mentionRegex.lastIndex = 0
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1]
      const startIndex = match.index
      
      // Ajouter le texte avant la mention
      if (startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, startIndex))
      }
      
      // Ajouter la mention stylisée
      parts.push(
        <Link
          key={`mention-${startIndex}`}
          href={`/profile/${username}`}
          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <UserIcon className="w-3 h-3" />
          @{username}
        </Link>
      )
      
      lastIndex = startIndex + match[0].length
    }
    
    // Ajouter le texte restant après la dernière mention
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }
    
    return parts.length > 0 ? parts : text
  }

  return (
    <span className={className}>
      {processText(text)}
    </span>
  )
}

// Version alternative avec Badge pour un style plus prononcé
export function MentionHighlighterBadge({ text, className = "" }: MentionHighlighterProps) {
  const mentionRegex = /@(\w+)/g
  
  const processText = (text: string) => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match
    
    mentionRegex.lastIndex = 0
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1]
      const startIndex = match.index
      
      if (startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, startIndex))
      }
      
      parts.push(
        <Link
          key={`mention-${startIndex}`}
          href={`/profile/${username}`}
        >
          <Badge 
            variant="outline" 
            className="inline-flex items-center gap-1 text-primary border-primary hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <UserIcon className="w-3 h-3" />
            @{username}
          </Badge>
        </Link>
      )
      
      lastIndex = startIndex + match[0].length
    }
    
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }
    
    return parts.length > 0 ? parts : text
  }

  return (
    <span className={className}>
      {processText(text)}
    </span>
  )
}
