import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, AlertTriangle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface AppointmentCancelModalProps {
  appointment: {
    id: string
    title: string
    scheduledDate: string
    price: number
  }
  open?: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AppointmentCancelModal({
  appointment,
  open = false,
  onClose,
  onSuccess
}: AppointmentCancelModalProps) {
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')

  const handleCancel = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/appointments/${appointment.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason || 'Annulation demandée'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'annulation')
      }

      toast.success(
        `Rendez-vous annulé avec succès. ${
          data.refundAmount > 0 
            ? `Remboursement de ${data.refundAmount}€ en cours.` 
            : ''
        }`
      )

      onSuccess?.()
      onClose()

    } catch (error) {
      console.error('Erreur annulation:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'annulation')
    } finally {
      setLoading(false)
    }
  }

  // Calculate refund information
  const now = new Date()
  const appointmentDate = new Date(appointment.scheduledDate)
  const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  let refundPolicy = ''
  if (hoursUntilAppointment > 48) {
    refundPolicy = '✅ Remboursement intégral (annulation >48h avant)'
  } else if (hoursUntilAppointment > 24) {
    refundPolicy = '⚠️ Remboursement partiel - 50% (annulation >24h avant)'
  } else {
    refundPolicy = '❌ Aucun remboursement (annulation <24h avant)'
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="w-full max-w-md mx-auto bg-background border rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold">Annuler le rendez-vous</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations du rendez-vous */}
          <div className="space-y-2">
            <h3 className="font-semibold">{appointment.title}</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(appointment.scheduledDate).toLocaleString('fr-FR')}
            </p>
            <p className="text-sm font-medium">
              Montant : {appointment.price}€
            </p>
          </div>

          {/* Politique de remboursement */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-2">Politique de remboursement</h4>
            <p className="text-sm text-amber-800">{refundPolicy}</p>
          </div>

          {/* Raison d'annulation */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Raison de l'annulation (optionnel)
            </label>
            <Textarea
              id="reason"
              placeholder="Expliquez pourquoi vous annulez ce rendez-vous..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Garder le rendez-vous
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Annulation...
                </div>
              ) : (
                'Confirmer l\'annulation'
              )}
            </Button>
          </div>

          {/* Avertissement */}
          <div className="text-xs text-muted-foreground text-center">
            ⚠️ Cette action est irréversible. Le professionnel sera automatiquement notifié.
          </div>
        </div>
      </div>
    </div>
  )
}

