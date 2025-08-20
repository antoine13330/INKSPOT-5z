import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Lock, X, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AppointmentPaymentModalProps {
  appointment: {
    id: string
    title: string
    price: number
    currency: string
    depositRequired?: boolean
    depositAmount?: number
    // Ajouter les informations de paiement existants
    payments?: Array<{
      id: string
      amount: number
      status: string
      description?: string
    }>
  }
  paymentType: 'deposit' | 'full'
  open?: boolean
  onClose: () => void
  inline?: boolean
  onPaymentComplete?: () => void
}

export function AppointmentPaymentModal({
  appointment,
  paymentType,
  open = false,
  onClose,
  inline = false,
  onPaymentComplete
}: AppointmentPaymentModalProps) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/appointments/${appointment.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentType
        }),
      })

      const data = await response.json()
      
      console.log('Response status:', response.status)
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du paiement')
      }

      if (data.checkoutUrl) {
        console.log('Redirecting to:', data.checkoutUrl)
        // Rediriger vers Stripe Checkout
        window.location.href = data.checkoutUrl
      } else {
        console.error('No checkoutUrl in response:', data)
        throw new Error('URL de paiement non disponible')
      }

    } catch (error) {
      console.error('Erreur paiement:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du paiement')
      setLoading(false)
    }
  }

  // Calculer le montant d'affichage et les informations de paiement
  const existingPayments = appointment.payments || []
  const paidAmount = existingPayments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)
  
  const depositAmount = appointment.depositAmount || Math.round(appointment.price * 0.3)
  const hasDeposit = existingPayments.some(p => 
    p.status === 'COMPLETED' && (p.description || '').toLowerCase().includes('acompte')
  )
  
  const displayAmount = paymentType === 'deposit' 
    ? depositAmount
    : appointment.price - paidAmount

  const description = paymentType === 'deposit' 
    ? `Acompte pour "${appointment.title}"` 
    : `Solde restant pour "${appointment.title}"`

  const content = (
    <div className="w-full max-w-lg mx-auto bg-background border rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Paiement RDV</h2>
        </div>
        {!inline && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-3">
          <h3 className="text-xl font-bold">{appointment.title}</h3>
          <Badge variant="outline" className="text-blue-600 border-blue-600 px-4 py-2">
            <CreditCard className="w-4 h-4 mr-2" />
            {paymentType === 'deposit' ? 'Paiement acompte' : 'Paiement solde'}
          </Badge>
        </div>

        {/* Résumé des paiements avec le delta */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-3">
          <div className="text-center">
            <h4 className="font-medium text-gray-900 mb-2">📋 Résumé des paiements</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-600">Prix total</div>
              <div className="font-semibold text-gray-900">{appointment.price}€</div>
            </div>
            
            {paymentType === 'deposit' ? (
              <div className="text-center">
                <div className="text-gray-600">Acompte requis</div>
                <div className="font-semibold text-blue-600">{depositAmount}€</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-gray-600">Déjà payé</div>
                <div className="font-semibold text-green-600">{paidAmount}€</div>
              </div>
            )}
          </div>
          
          {paymentType === 'full' && (
            <div className="text-center pt-2 border-t border-gray-200">
              <div className="text-gray-600">Solde restant</div>
              <div className="text-lg font-bold text-blue-700">{displayAmount}€</div>
            </div>
          )}
          
          {paymentType === 'deposit' && (
            <div className="text-center pt-2 border-t border-gray-200">
              <div className="text-gray-600">Solde à payer plus tard</div>
              <div className="text-sm font-medium text-gray-700">{appointment.price - depositAmount}€</div>
            </div>
          )}
        </div>

        {/* Zone sécurisée */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-900">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Paiement sécurisé</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            Vous allez être redirigé vers Stripe pour effectuer le paiement
          </p>
        </div>

        {/* Montant à payer maintenant */}
        <div className="text-center py-4">
          <div className="text-sm text-gray-600 mb-2">
            {paymentType === 'deposit' ? 'Montant de l\'acompte' : 'Montant du solde'}
          </div>
          <p className="text-3xl font-bold text-primary">{displayAmount}€</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        {/* Bouton de paiement */}
        <Button 
          onClick={handlePayment}
          disabled={loading} 
          className="w-full h-12 text-lg font-semibold"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirection en cours...
            </div>
          ) : (
            <span className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Payer {displayAmount}€ avec Stripe
            </span>
          )}
        </Button>

        {paymentType === 'deposit' && (
          <div className="text-sm text-center text-muted-foreground p-4 bg-blue-50 rounded-lg">
            <p>Après le paiement de l'acompte, vous pourrez confirmer votre créneau de rendez-vous.</p>
            <p className="mt-1 text-xs">Le solde de {(appointment.price - depositAmount).toFixed(2)}€ sera à régler plus tard.</p>
          </div>
        )}
        
        {paymentType === 'full' && paidAmount > 0 && (
          <div className="text-sm text-center text-muted-foreground p-4 bg-green-50 rounded-lg">
            <p>✅ Vous avez déjà payé {paidAmount}€ (acompte + autres paiements)</p>
            <p className="mt-1">Ce paiement finalise votre rendez-vous.</p>
          </div>
        )}
      </div>
    </div>
  )

  if (inline) {
    return content
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="w-full max-w-lg max-h-[95vh] overflow-y-auto">
        {content}
      </div>
    </div>
  )
}