"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, CheckCircle, XCircle, CreditCard, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppointmentResponseModal } from './AppointmentResponseModal'
import { AppointmentCancelModal } from './AppointmentCancelModal'
import { AppointmentPaymentModal } from './AppointmentPaymentModal'

interface AppointmentStatus {
  id: string
  title: string
  description?: string
  status: string
  price: number
  duration: number
  currency: string
  location?: string
  depositRequired: boolean
  depositAmount?: number
  depositPaid: boolean
  fullPayment: boolean
  isProposer: boolean
  startDate: string
  // Ajouter les informations de paiement pour calculer le delta
  payments?: Array<{
    id: string
    amount: number
    status: string
    description?: string
  }>
}

interface AppointmentStatusBadgeProps {
  hasAppointment: boolean
  appointment?: AppointmentStatus
  canPropose: boolean
  onPropose: () => void
  onViewDetails?: () => void
  onRefresh?: () => void
  className?: string
}

const getStatusConfig = (appointment: AppointmentStatus) => {
  const { status, depositRequired, depositPaid, fullPayment, isProposer, payments = [] } = appointment

  // Calculer le montant déjà payé
  const paidAmount = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)
  
  // Calculer le montant restant à payer
  const remainingAmount = appointment.price - paidAmount

  // Interface pour la configuration du statut
  interface StatusConfig {
    label: string
    icon: any
    variant: 'default' | 'secondary' | 'destructive'
    color: string
    showPaymentInfo: boolean
    paymentInfo?: {
      type: 'deposit' | 'balance'
      amount: number
      total: number
      paid?: number
      deposit?: number
    }
  }

  switch (status) {
    case 'PROPOSED':
      return {
        label: isProposer ? 'En attente de réponse' : 'Répondre à la proposition',
        icon: Clock,
        variant: 'secondary' as const,
        color: 'text-orange-600',
        showPaymentInfo: false
      } as StatusConfig
    
    case 'ACCEPTED':
      if (depositRequired && !depositPaid) {
        return {
          label: isProposer ? 'En attente du paiement' : `Payer la caution (${appointment.depositAmount || Math.round(appointment.price * 0.3)}€)`,
          icon: CreditCard,
          variant: 'secondary' as const,
          color: 'text-blue-600',
          showPaymentInfo: true,
          paymentInfo: {
            type: 'deposit',
            amount: appointment.depositAmount || Math.round(appointment.price * 0.3),
            total: appointment.price
          }
        } as StatusConfig
      }
      return {
        label: 'Accepté - En attente de confirmation',
        icon: CheckCircle,
        variant: 'secondary' as const,
        color: 'text-green-600',
        showPaymentInfo: false
      } as StatusConfig
    
    case 'CONFIRMED':
      if (!fullPayment) {
        const depositAmount = appointment.depositAmount || Math.round(appointment.price * 0.3)
        const hasDeposit = depositPaid || paidAmount >= depositAmount
        
        if (hasDeposit && remainingAmount > 0) {
          return {
            label: isProposer ? 'Confirmé - Paiement en attente' : `Payer le solde (${remainingAmount}€)`,
            icon: CreditCard,
            variant: 'secondary' as const,
            color: 'text-blue-600',
            showPaymentInfo: true,
            paymentInfo: {
              type: 'balance',
              amount: remainingAmount,
              total: appointment.price,
              paid: paidAmount,
              deposit: depositAmount
            }
          } as StatusConfig
        } else if (!hasDeposit) {
          return {
            label: isProposer ? 'Confirmé - Paiement en attente' : `Payer la caution (${depositAmount}€)`,
            icon: CreditCard,
            variant: 'secondary' as const,
            color: 'text-blue-600',
            showPaymentInfo: true,
            paymentInfo: {
              type: 'deposit',
              amount: depositAmount,
              total: appointment.price
            }
          } as StatusConfig
        }
      }
      return {
        label: 'Confirmé et payé',
        icon: CheckCircle,
        variant: 'default' as const,
        color: 'text-green-600',
        showPaymentInfo: false
      } as StatusConfig
    
    case 'PAID':
      return {
        label: '💰 Entièrement payé',
        icon: CheckCircle,
        variant: 'default' as const,
        color: 'text-emerald-600',
        showPaymentInfo: false
      } as StatusConfig
    
    case 'COMPLETED':
      return {
        label: 'Terminé',
        icon: CheckCircle,
        variant: 'secondary' as const,
        color: 'text-green-600',
        showPaymentInfo: false
      } as StatusConfig
    
    case 'CANCELLED':
      return {
        label: 'Annulé',
        icon: XCircle,
        variant: 'secondary' as const,
        color: 'text-red-600',
        showPaymentInfo: false
      } as StatusConfig
    
    default:
      return {
        label: 'Statut inconnu',
        icon: AlertCircle,
        variant: 'secondary' as const,
        color: 'text-gray-600',
        showPaymentInfo: false
      } as StatusConfig
  }
}

export function AppointmentStatusBadge({
  hasAppointment,
  appointment,
  canPropose,
  onPropose,
  onViewDetails,
  onRefresh,
  className
}: AppointmentStatusBadgeProps) {
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [paymentType, setPaymentType] = useState<'deposit' | 'full'>('deposit')
  
  const handleBadgeClick = () => {
    if (!appointment) return
    
    const { status, depositRequired, depositPaid, fullPayment, isProposer } = appointment
    
    // Si c'est une proposition en attente et que l'utilisateur est le client
    if (status === 'PROPOSED' && !isProposer) {
      setShowResponseModal(true)
    } 
    // Si accepté et besoin de payer la caution (et pas le proposer)
    else if (status === 'ACCEPTED' && depositRequired && !depositPaid && !isProposer) {
      setPaymentType('deposit')
      setShowPaymentModal(true)
    }
    // Si confirmé et besoin de payer le solde (et pas le proposer)
    else if (status === 'CONFIRMED' && !fullPayment && !isProposer) {
      setPaymentType('full')
      setShowPaymentModal(true)
    }
    else {
      onViewDetails?.()
    }
  }

  const handleResponseSuccess = (success: boolean) => {
    if (success) {
      onRefresh?.()
    }
  }

  const handlePaymentSuccess = () => {
    onRefresh?.()
  }

  const handleCancelSuccess = () => {
    setShowCancelModal(false)
    onRefresh?.()
  }

  if (!hasAppointment) {
    if (!canPropose) return null
    
    return (
      <div className={cn("flex justify-center mb-2", className)}>
        <Button
          size="sm"
          className="rounded-full shadow-md"
          onClick={onPropose}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Proposer un RDV
        </Button>
      </div>
    )
  }

  if (!appointment) return null

  // Les appointments terminés ne devraient pas arriver ici grâce à l'API,
  // mais on garde cette sécurité par précaution
  if (['CANCELLED', 'COMPLETED'].includes(appointment.status)) {
    return null
  }

  const config = getStatusConfig(appointment)
  const Icon = config.icon

  return (
    <div className={cn("flex flex-col items-center gap-2 mb-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-2 rounded-full"
        onClick={handleBadgeClick}
      >
        <Badge 
          variant={config.variant}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs", config.color)}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="font-medium">{config.label}</span>
        </Badge>
      </Button>
      
      {/* Affichage des informations de paiement avec le delta */}
      {config.showPaymentInfo && config.paymentInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center max-w-xs">
          {config.paymentInfo.type === 'deposit' ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-blue-900">
                💰 Acompte requis
              </div>
              <div className="text-lg font-bold text-blue-700">
                {config.paymentInfo.amount}€
              </div>
              <div className="text-xs text-blue-600">
                Sur un total de {config.paymentInfo.total}€
              </div>
            </div>
          ) : config.paymentInfo.type === 'balance' ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-blue-900">
                💳 Solde restant à payer
              </div>
              <div className="text-lg font-bold text-blue-700">
                {config.paymentInfo.amount}€
              </div>
              <div className="text-xs text-blue-600 space-y-1">
                <div>✅ Déjà payé: {config.paymentInfo.paid}€</div>
                <div>📋 Total: {config.paymentInfo.total}€</div>
              </div>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Cancel button for active appointments */}
      {appointment && !['CANCELLED', 'COMPLETED'].includes(appointment.status) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCancelModal(true)}
          className="h-auto p-2 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Annuler le rendez-vous"
        >
          <XCircle className="w-4 h-4" />
        </Button>
      )}
      
      {/* Modal de réponse */}
      {showResponseModal && appointment && (
        <AppointmentResponseModal
          appointment={appointment}
          onClose={() => setShowResponseModal(false)}
          onResponse={handleResponseSuccess}
        />
      )}

      {/* Modal de paiement */}
      {showPaymentModal && appointment && (
        <AppointmentPaymentModal
          appointment={appointment}
          paymentType={paymentType}
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentSuccess}
        />
      )}
      
      {/* Modal d'annulation */}
      {showCancelModal && appointment && (
        <AppointmentCancelModal
          appointment={{
            id: appointment.id,
            title: appointment.title,
            scheduledDate: appointment.startDate || new Date().toISOString(),
            price: appointment.price
          }}
          open={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  )
}
