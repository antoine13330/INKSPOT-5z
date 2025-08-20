import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface ProposalData {
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

interface UseProposalNotificationsOptions {
  conversationId?: string
  onProposalReceived?: (proposal: ProposalData) => void
  onProposalStatusChanged?: (data: any) => void
  showToastNotifications?: boolean
}

export function useProposalNotifications({
  conversationId,
  onProposalReceived,
  onProposalStatusChanged,
  showToastNotifications = true
}: UseProposalNotificationsOptions = {}) {
    const [recentProposals, setRecentProposals] = useState<ProposalData[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // WebSocket désactivé - utiliser polling ou notifications push à la place
  const socketConnected = false
  const joinConversation = () => console.log('WebSocket désactivé')
  const leaveConversation = () => console.log('WebSocket désactivé')

  // Mettre à jour le statut de connexion
  useEffect(() => {
    setIsConnected(socketConnected)
  }, [socketConnected])

  // Rejoindre/quitter la conversation quand elle change
  useEffect(() => {
    if (conversationId && isConnected) {
      joinConversation(conversationId)
      
      return () => {
        leaveConversation(conversationId)
      }
    }
  }, [conversationId, isConnected, joinConversation, leaveConversation])

  // Nettoyer les anciennes propositions (après 1 heure)
  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      setRecentProposals(prev => 
        prev.filter(proposal => 
          new Date(proposal.timestamp).getTime() > oneHourAgo
        )
      )
    }, 5 * 60 * 1000) // Vérifier toutes les 5 minutes

    return () => clearInterval(interval)
  }, [])

  const clearProposal = useCallback((appointmentId: string) => {
    setRecentProposals(prev => prev.filter(p => p.appointmentId !== appointmentId))
  }, [])

  const clearAllProposals = useCallback(() => {
    setRecentProposals([])
  }, [])

  return {
    recentProposals,
    isConnected,
    clearProposal,
    clearAllProposals,
    totalProposals: recentProposals.length
  }
}
