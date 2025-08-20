"use client"

import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Calendar, Clock, MapPin, Euro, Check, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface AppointmentResponseModalProps {
  appointment: {
    id: string
    title: string
    description?: string
    status: string
    price: number
    duration: number
    currency: string
    location?: string
    startDate: string
    depositRequired: boolean
    depositAmount?: number
  }
  onClose: () => void
  onResponse: (success: boolean) => void
  inline?: boolean
}

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  'TATTOO': 'Tatouage',
  'PIERCING': 'Piercing', 
  'CONSULTATION': 'Consultation',
  'COVER_UP': 'Cover-up',
  'TOUCH_UP': 'Retouche',
  'CUSTOM_DESIGN': 'Design personnalisé',
  'OTHER': 'Autre'
}

export function AppointmentResponseModal({
  appointment,
  onClose,
  onResponse,
  inline = false
}: AppointmentResponseModalProps) {
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<'accept' | 'reject' | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const proposedDates: string[] = useMemo(() => {
    // Try to extract ProposedDatesJSON from appointment.description or from a dedicated field later
    const match = (appointment as any).notes?.match?.(/ProposedDatesJSON: (\[.*\])/)
    if (match) {
      try { return JSON.parse(match[1]) } catch { /* ignore */ }
    }
    return []
  }, [appointment])

  const handleResponse = async (responseAction: 'accept' | 'reject') => {
    setLoading(true)
    setAction(responseAction)
    
    try {
      const response = await fetch(`/api/appointments/${appointment.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: responseAction,
          selectedDateIndex: responseAction === 'accept' ? (selectedIndex ?? 0) : undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (responseAction === 'accept' && appointment.depositRequired) {
          // Immediately initiate deposit payment
          try {
            const payRes = await fetch(`/api/appointments/${appointment.id}/payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentType: 'deposit' })
            })
            const pay = await payRes.json()
            if (!payRes.ok || !pay.checkoutUrl) {
              throw new Error(pay.error || 'Création du paiement impossible')
            }
            toast.success('Redirection vers le paiement de la caution...')
            window.location.href = pay.checkoutUrl
            return
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Paiement non disponible')
          }
        }
        toast.success(
          responseAction === 'accept' 
            ? 'Proposition acceptée !'
            : 'Proposition refusée'
        )
        onResponse(true)
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erreur lors de la réponse')
        onResponse(false)
      }
    } catch (error) {
      console.error('Error responding to appointment:', error)
      toast.error('Erreur lors de la réponse')
      onResponse(false)
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const content = (
    <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Proposition de RDV
        </CardTitle>
        {!inline && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Titre et statut */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">{appointment.title}</h3>
          <Badge variant="secondary" className="text-orange-600">
            <Clock className="w-3 h-3 mr-1" />
            En attente de votre réponse
          </Badge>
        </div>

        {/* Description */}
        {appointment.description && (
          <div className="bg-muted/20 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {appointment.description}
            </p>
          </div>
        )}

        {/* Détails */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{formatDate(appointment.startDate)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{formatTime(appointment.startDate)} ({appointment.duration} min)</span>
          </div>

          {appointment.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{appointment.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Euro className="w-4 h-4 text-muted-foreground" />
            <span>{appointment.price}€</span>
          </div>
        </div>

        {/* Information caution */}
        {appointment.depositRequired && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Caution requise</p>
                <p className="text-blue-700">
                  Un acompte de {appointment.depositAmount}€ sera demandé pour confirmer le créneau.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Proposed date choices if any */}
        {proposedDates.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Choisissez un des créneaux proposés</p>
            <div className="grid grid-cols-1 gap-2">
              {proposedDates.map((d, idx) => (
                <Button
                  key={idx}
                  variant={selectedIndex === idx ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setSelectedIndex(idx)}
                >
                  {new Date(d).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Boutons de réponse */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleResponse('reject')}
            disabled={loading}
          >
            {loading && action === 'reject' ? 'Refus...' : 'Refuser'}
          </Button>
          
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={() => handleResponse('accept')}
            disabled={loading || (proposedDates.length > 0 && selectedIndex === null)}
          >
            {loading && action === 'accept' ? (
              'Acceptation...'
            ) : (
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" />
                {appointment.depositRequired ? 'Choisir et payer la caution' : 'Accepter'}
              </span>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Vous pourrez modifier ou annuler jusqu'à 24h avant le RDV
        </p>
      </CardContent>
    </Card>
  )

  if (inline) {
    return content
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {content}
    </div>
  )
}

