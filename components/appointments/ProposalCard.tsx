"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Euro, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock as ClockIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { AppointmentProposal as ProposalType } from '@/types'

interface ProposalCardProps {
  proposal: ProposalType
  onAccept: (proposalId: string) => void
  onReject: (proposalId: string) => void
  onExpire: (proposalId: string) => void
}

const STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: 'bg-yellow-500', icon: ClockIcon },
  ACCEPTED: { label: 'Acceptée', color: 'bg-green-500', icon: CheckCircle },
  REJECTED: { label: 'Refusée', color: 'bg-red-500', icon: XCircle },
  EXPIRED: { label: 'Expirée', color: 'bg-gray-500', icon: AlertCircle }
}

export function ProposalCard({ proposal, onAccept, onReject, onExpire }: ProposalCardProps) {
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const statusConfig = STATUS_CONFIG[proposal.status as keyof typeof STATUS_CONFIG]
  const StatusIcon = statusConfig?.icon || ClockIcon

  const isExpired = new Date(proposal.expiresAt) < new Date()
  const isPending = proposal.status === 'PENDING' && !isExpired

  const handleAccept = async () => {
    setLoading(true)
    try {
      await onAccept(proposal.id)
      toast.success('Proposition acceptée !')
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await onReject(proposal.id)
      toast.success('Proposition refusée')
    } catch (error) {
      toast.error('Erreur lors du refus')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTimeLeft = () => {
    const now = new Date()
    const expiresAt = new Date(proposal.expiresAt)
    const diff = expiresAt.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expirée'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}`
    return 'Moins d\'une heure'
  }

  return (
    <Card className={`w-full ${isExpired ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {proposal.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="secondary" 
                className={`${statusConfig?.color} text-white`}
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig?.label}
              </Badge>
              {isPending && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  {formatTimeLeft()}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{proposal.duration} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Euro className="w-4 h-4 text-muted-foreground" />
            <span>{proposal.price} {proposal.currency}</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{proposal.location}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{proposal.description}</p>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Proposed Dates */}
            <div>
              <h4 className="font-medium mb-2">Dates proposées</h4>
              <div className="space-y-2">
                {proposal.proposedDates.map((date, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(new Date(date))}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            {proposal.requirements && proposal.requirements.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Prérequis</h4>
                <ul className="space-y-1">
                  {proposal.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {proposal.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{proposal.notes}</p>
              </div>
            )}

            {/* Expiration */}
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Expire le :</span> {formatDate(new Date(proposal.expiresAt))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isPending && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accepter
            </Button>
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={loading}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Refuser
            </Button>
          </div>
        )}

        {/* Expired Actions */}
        {isExpired && proposal.status === 'PENDING' && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onExpire(proposal.id)}
              className="w-full"
            >
              Marquer comme expirée
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
