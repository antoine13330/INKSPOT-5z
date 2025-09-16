"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, CreditCard, Clock, AlertCircle, Euro } from 'lucide-react'
import { toast } from 'sonner'
import { StripeCheckoutButton } from './StripePayment'

interface Payment {
  id: string
  amount: number
  currency: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  type: 'DEPOSIT' | 'FULL_PAYMENT' | 'REMAINING_BALANCE'
  description: string
  paidAt?: string
}

interface Appointment {
  id: string
  title: string
  price: number
  depositAmount?: number
  depositRequired: boolean
  status: string
  payments: Payment[]
}

interface PaymentManagerProps {
  appointment: Appointment
  currentUserId: string
  onPaymentUpdate: () => void
}

export function PaymentManager({ appointment, currentUserId, onPaymentUpdate }: PaymentManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)

  // Calculer les montants
  const totalPrice = appointment.price
  const depositAmount = appointment.depositAmount || 0
  const depositRequired = appointment.depositRequired

  // Calculer les paiements effectués
  const completedPayments = appointment.payments.filter(p => p.status === 'COMPLETED')
  const totalPaid = completedPayments.reduce((sum, payment) => sum + payment.amount, 0)
  
  
  // Calculer le solde restant
  const remainingBalance = totalPrice - totalPaid
  
  // Déterminer les types de paiements possibles basés sur le type
  const hasDepositPayment = completedPayments.some(p => p.type === 'DEPOSIT')
  const hasFullPayment = completedPayments.some(p => p.type === 'FULL_PAYMENT')
  const hasRemainingPayment = completedPayments.some(p => p.type === 'REMAINING_BALANCE')

  // Déterminer les actions disponibles
  const canPayDeposit = depositRequired && !hasDepositPayment && !hasFullPayment && remainingBalance > 0
  const canPayRemaining = hasDepositPayment && remainingBalance > 0 && !hasRemainingPayment && !hasFullPayment
  const canPayFull = !hasFullPayment && remainingBalance > 0

  // Créer un paiement
  const createPayment = async (amount: number, type: 'DEPOSIT' | 'FULL_PAYMENT' | 'REMAINING_BALANCE') => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          amount: amount * 100, // Convertir en centimes pour Stripe
          currency: 'eur',
          type: type
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création du paiement')
      }

      const data = await response.json()
      setCheckoutUrl(data.checkoutUrl)
      
      // Ouvrir la page de paiement Stripe
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank')
      }
      
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error)
      toast.error('Erreur lors de la création du paiement')
    } finally {
      setIsLoading(false)
    }
  }

  // Gérer le retour de paiement
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    const sessionId = urlParams.get('session_id')

    if (paymentStatus === 'success' && sessionId) {
      toast.success('Paiement effectué avec succès !')
      onPaymentUpdate()
      
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (paymentStatus === 'cancel') {
      toast.error('Paiement annulé')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [onPaymentUpdate])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Gestion des paiements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Résumé des montants */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Prix total</span>
            <span className="font-medium">{totalPrice}€</span>
          </div>
          
          {depositRequired && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Caution requise</span>
              <span className="font-medium">{depositAmount}€</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Montant payé</span>
            <span className="font-medium text-green-600">{totalPaid}€</span>
          </div>
          
        </div>

        {/* Statut des paiements */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Statut des paiements</h4>
          
          {completedPayments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">{payment.description}</span>
              </div>
              <Badge variant="secondary" className="text-green-600">
                {payment.amount}€
              </Badge>
            </div>
          ))}
          
          {appointment.payments.filter(p => p.status === 'PENDING').map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">{payment.description}</span>
              </div>
              <Badge variant="outline" className="text-yellow-600">
                {payment.amount}€
              </Badge>
            </div>
          ))}
        </div>

        {/* Actions de paiement */}
        {remainingBalance > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Actions disponibles</h4>
            
            {canPayDeposit && (
              <Button 
                onClick={() => createPayment(depositAmount, 'DEPOSIT')}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                <Euro className="w-4 h-4 mr-2" />
                Payer la caution
              </Button>
            )}
            
            {canPayRemaining && (
              <Button 
                onClick={() => createPayment(remainingBalance, 'REMAINING_BALANCE')}
                disabled={isLoading}
                className="w-full"
                variant="default"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payer le solde restant
              </Button>
            )}
            
            {canPayFull && (
              <Button 
                onClick={() => createPayment(totalPrice, 'FULL_PAYMENT')}
                disabled={isLoading}
                className="w-full"
                variant="default"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payer le montant complet
              </Button>
            )}
          </div>
        )}

        {/* Message de confirmation */}
        {remainingBalance === 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">
              Tous les paiements ont été effectués avec succès !
            </span>
          </div>
        )}

        {/* Informations importantes */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Les paiements sont sécurisés par Stripe</p>
          <p>• Vous recevrez une confirmation par email</p>
          <p>• Le professionnel sera notifié automatiquement</p>
        </div>
      </CardContent>
    </Card>
  )
}
