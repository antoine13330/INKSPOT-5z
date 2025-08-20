"use client"

import React from 'react'
import { Calendar, Clock, Euro, MapPin, X } from 'lucide-react'
import { Badge } from './badge'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface ProposalNotificationProps {
  proposal: {
    appointmentId: string
    conversationId: string
    proposalData: {
      title: string
      type: string
      price: number
      currency: string
      duration: number
      location: string
      description: string
      proId: string
      clientId: string
      createdAt: string
    }
    timestamp: string
  }
  onAccept?: () => void
  onReject?: () => void
  onView?: () => void
  onDismiss?: () => void
  className?: string
}

export function ProposalNotification({
  proposal,
  onAccept,
  onReject,
  onView,
  onDismiss,
  className
}: ProposalNotificationProps) {
  const { proposalData } = proposal

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm",
      "animate-in slide-in-from-bottom-2 duration-300",
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <Badge variant="secondary" className="text-xs">
            Nouvelle proposition
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          {proposalData.title}
        </h4>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {proposalData.description}
        </p>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{proposalData.duration} min</span>
          </div>
          <div className="flex items-center space-x-1">
            <Euro className="h-3 w-3" />
            <span>{proposalData.price} {proposalData.currency}</span>
          </div>
          {proposalData.location && (
            <div className="flex items-center space-x-1 col-span-2">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{proposalData.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 mt-4">
        {onAccept && (
          <Button
            size="sm"
            onClick={onAccept}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Accepter
          </Button>
        )}
        {onReject && (
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            className="flex-1"
          >
            Refuser
          </Button>
        )}
        {onView && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onView}
            className="flex-1"
          >
            Voir détails
          </Button>
        )}
      </div>
    </div>
  )
}
