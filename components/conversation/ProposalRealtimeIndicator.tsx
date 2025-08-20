"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProposalRealtimeIndicatorProps {
  conversationId: string
  onProposalReceived?: (proposal: any) => void
}

export function ProposalRealtimeIndicator({ 
  conversationId, 
  onProposalReceived 
}: ProposalRealtimeIndicatorProps) {
  const [recentProposals, setRecentProposals] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Simuler la connexion WebSocket
    setIsConnected(true)
    
    // Nettoyer à la fermeture
    return () => {
      setIsConnected(false)
    }
  }, [])

  const addProposal = (proposal: any) => {
    setRecentProposals(prev => [proposal, ...prev.slice(0, 2)]) // Garder seulement les 3 plus récents
    onProposalReceived?.(proposal)
  }

  if (recentProposals.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 space-y-2">
      {recentProposals.map((proposal, index) => (
        <div
          key={`${proposal.appointmentId}-${index}`}
          className={cn(
            "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-w-xs",
            "animate-in slide-in-from-bottom-2 duration-300",
            "flex items-start space-x-3"
          )}
        >
          <div className="flex-shrink-0">
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                Nouvelle proposition
              </Badge>
              {isConnected && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {proposal.proposalData?.title || 'Proposition de rendez-vous'}
            </h4>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <Clock className="h-3 w-3" />
              <span>
                {proposal.proposalData?.duration || 0} min • {proposal.proposalData?.price || 0}€
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setRecentProposals(prev => prev.filter((_, i) => i !== index))}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
