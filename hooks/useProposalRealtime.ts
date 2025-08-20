"use client"

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

interface ProposalStatusChange {
  appointmentId: string
  status: string
  conversationId: string
  changedBy: string
  timestamp: string
}

interface ProposalCreated {
  appointmentId: string
  conversationId: string
  proposalData: any
  timestamp: string
}

interface UseProposalRealtimeProps {
  conversationId: string
  userId: string
  onProposalStatusChange?: (data: ProposalStatusChange) => void
  onNewProposal?: (data: ProposalCreated) => void
}

export function useProposalRealtime({
  conversationId,
  userId,
  onProposalStatusChange,
  onNewProposal
}: UseProposalRealtimeProps) {
  const [proposalUpdates, setProposalUpdates] = useState<ProposalStatusChange[]>([])
  const [newProposals, setNewProposals] = useState<ProposalCreated[]>([])
  
  // WebSocket désactivé - utiliser polling ou notifications push à la place
  const isConnected = false

  // Handle proposal status changes
  const handleProposalStatusChange = useCallback((data: ProposalStatusChange) => {
    console.log('[ProposalRealtime] Status change received:', data)
    
    // Only show notification if the change was made by someone else
    if (data.changedBy !== userId) {
      const statusMessages = {
        ACCEPTED: 'Proposition acceptée ✅',
        REJECTED: 'Proposition refusée ❌',
        CANCELLED: 'Proposition annulée ❌',
        CONFIRMED: 'Rendez-vous confirmé 🎉',
        COMPLETED: 'Rendez-vous terminé ✅',
        RESCHEDULED: 'Demande de report 📅'
      }
      
      const message = statusMessages[data.status as keyof typeof statusMessages] || `Statut mis à jour: ${data.status}`
      toast.info(message, {
        description: `Rendez-vous mis à jour en temps réel`,
        duration: 4000,
      })
    }
    
    setProposalUpdates(prev => [...prev, data])
    onProposalStatusChange?.(data)
  }, [userId, onProposalStatusChange])

  // Handle new proposals
  const handleNewProposal = useCallback((data: ProposalCreated) => {
    console.log('[ProposalRealtime] New proposal received:', data)
    
    // Don't show notification for own proposals
    if (data.proposalData.proId !== userId) {
      toast.info('Nouvelle proposition de rendez-vous 📅', {
        description: data.proposalData.title,
        duration: 5000,
      })
    }
    
    setNewProposals(prev => [...prev, data])
    onNewProposal?.(data)
  }, [userId, onNewProposal])

  // WebSocket désactivé - les événements seront gérés via polling ou notifications push
  useEffect(() => {
    // TODO: Implémenter un système de polling pour les propositions
    // ou utiliser les notifications push du navigateur
    console.log('[ProposalRealtime] WebSocket désactivé - utiliser polling ou notifications push')
  }, [conversationId])

  // Function to send proposal status update
  const emitProposalStatusUpdate = useCallback((data: Omit<ProposalStatusChange, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('proposal-status-update', {
        ...data,
        timestamp: new Date().toISOString()
      })
    }
  }, [socket, isConnected])

  // Function to send new proposal
  const emitNewProposal = useCallback((data: Omit<ProposalCreated, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('new-proposal', {
        ...data,
        timestamp: new Date().toISOString()
      })
    }
  }, [socket, isConnected])

  // Clear updates
  const clearProposalUpdates = useCallback(() => {
    setProposalUpdates([])
  }, [])

  const clearNewProposals = useCallback(() => {
    setNewProposals([])
  }, [])

  return {
    proposalUpdates,
    newProposals,
    isConnected,
    emitProposalStatusUpdate,
    emitNewProposal,
    clearProposalUpdates,
    clearNewProposals
  }
}
