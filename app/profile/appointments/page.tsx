"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomNavigation } from '@/components/bottom-navigation'
import { ProposalCard } from '@/components/appointments/ProposalCard'
import { AppointmentProposal } from '@/types'
import { toast } from 'sonner'

export default function AppointmentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [proposals, setProposals] = useState<AppointmentProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

  useEffect(() => {
    if (session?.user?.id) {
      fetchProposals()
    }
  }, [session?.user?.id])

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/appointments/proposals/received')
      if (response.ok) {
        const data = await response.json()
        setProposals(data.proposals || [])
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
      toast.error('Erreur lors du chargement des propositions')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/appointments/proposals/${proposalId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      })

      if (response.ok) {
        // Update local state
        setProposals(prev => 
          prev.map(p => 
            p.id === proposalId 
              ? { ...p, status: 'ACCEPTED' as const }
              : p
          )
        )
        return Promise.resolve()
      } else {
        throw new Error('Failed to accept proposal')
      }
    } catch (error) {
      console.error('Error accepting proposal:', error)
      return Promise.reject(error)
    }
  }

  const handleReject = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/appointments/proposals/${proposalId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (response.ok) {
        // Update local state
        setProposals(prev => 
          prev.map(p => 
            p.id === proposalId 
              ? { ...p, status: 'REJECTED' as const }
              : p
          )
        )
        return Promise.resolve()
      } else {
        throw new Error('Failed to reject proposal')
      }
    } catch (error) {
      console.error('Error rejecting proposal:', error)
      return Promise.reject(error)
    }
  }

  const handleExpire = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/appointments/proposals/${proposalId}/expire`, {
        method: 'POST',
      })

      if (response.ok) {
        // Update local state
        setProposals(prev => 
          prev.map(p => 
            p.id === proposalId 
              ? { ...p, status: 'EXPIRED' as const }
              : p
          )
        )
        toast.success('Proposition marquée comme expirée')
      } else {
        throw new Error('Failed to expire proposal')
      }
    } catch (error) {
      console.error('Error expiring proposal:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'all') return true
    return proposal.status === filter.toUpperCase()
  })

  const pendingCount = proposals.filter(p => p.status === 'PENDING').length
  const acceptedCount = proposals.filter(p => p.status === 'ACCEPTED').length
  const rejectedCount = proposals.filter(p => p.status === 'REJECTED').length

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
          <p className="text-muted-foreground">Connectez-vous pour voir vos propositions de RDV</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">
              Propositions de RDV
            </h1>
            <p className="text-sm text-muted-foreground">
              Gérez vos rendez-vous proposés
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-card rounded-lg border">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-xs text-muted-foreground">En attente</div>
          </div>
          <div className="text-center p-3 bg-card rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
            <div className="text-xs text-muted-foreground">Acceptés</div>
          </div>
          <div className="text-center p-3 bg-card rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <div className="text-xs text-muted-foreground">Refusés</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'Toutes', count: proposals.length },
            { key: 'pending', label: 'En attente', count: pendingCount },
            { key: 'accepted', label: 'Acceptées', count: acceptedCount },
            { key: 'rejected', label: 'Refusées', count: rejectedCount }
          ].map(({ key, label, count }) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(key as any)}
              className="whitespace-nowrap"
            >
              {label} ({count})
            </Button>
          ))}
        </div>
      </div>

      {/* Proposals List */}
      <div className="px-4 space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {filter === 'all' ? 'Aucune proposition' : `Aucune proposition ${filter === 'pending' ? 'en attente' : filter}`}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'Vous n\'avez pas encore reçu de propositions de rendez-vous.'
                : `Vous n'avez pas de propositions ${filter === 'pending' ? 'en attente' : filter}.`
              }
            </p>
          </div>
        ) : (
          filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              onAccept={handleAccept}
              onReject={handleReject}
              onExpire={handleExpire}
            />
          ))
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
