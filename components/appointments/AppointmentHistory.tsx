"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Euro, 
  FileText, 
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Appointment {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  status: 'PROPOSED' | 'ACCEPTED' | 'CONFIRMED' | 'PAID' | 'COMPLETED' | 'CANCELLED'
  price: number
  currency: string
  location?: string
  depositAmount?: number
  depositPaid: boolean
  fullPayment: boolean
  client: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    email?: string
    avatar?: string
  }
  payments: Array<{
    id: string
    amount: number
    type: 'DEPOSIT' | 'FULL_PAYMENT' | 'BALANCE'
    status: 'PENDING' | 'COMPLETED' | 'FAILED'
    createdAt: string
    description: string
  }>
  createdAt: string
  completedAt?: string
  cancelledAt?: string
}

interface AppointmentHistoryProps {
  clientId: string
  conversationId?: string
  className?: string
}

export function AppointmentHistory({ clientId, conversationId, className }: AppointmentHistoryProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null)

  useEffect(() => {
    if (clientId) {
      loadAppointmentHistory()
    }
  }, [clientId])

  const loadAppointmentHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/appointments/history?clientId=${clientId}`)
      if (!response.ok) throw new Error('Erreur lors du chargement')
      
      const data = await response.json()
      console.log('AppointmentHistory - Data from API:', data)
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement de l\'historique')
    } finally {
      setLoading(false)
    }
  }

  const generateInvoice = async (appointment: Appointment) => {
    setGeneratingInvoice(appointment.id)
    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: appointment.id,
          clientId: appointment.client.id,
          conversationId,
          type: 'SERVICE_COMPLETED'
        }),
      })

      if (!response.ok) throw new Error('Erreur lors de la génération')

      const data = await response.json()
      
      if (data.invoiceUrl) {
        // Télécharger la facture
        window.open(data.invoiceUrl, '_blank')
        toast.success('Facture générée et téléchargée avec succès !')
      } else {
        toast.success('Facture générée avec succès !')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la génération de la facture')
    } finally {
      setGeneratingInvoice(null)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      PROPOSED: { color: 'bg-orange-500', label: 'Proposé', icon: AlertCircle },
      ACCEPTED: { color: 'bg-blue-500', label: 'Accepté', icon: CheckCircle },
      CONFIRMED: { color: 'bg-purple-500', label: 'Confirmé', icon: CheckCircle },
      PAID: { color: 'bg-green-500', label: 'Payé', icon: CheckCircle },
      COMPLETED: { color: 'bg-emerald-500', label: 'Terminé', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-500', label: 'Annulé', icon: XCircle }
    }
    return configs[status as keyof typeof configs] || { color: 'bg-gray-500', label: 'Inconnu', icon: AlertCircle }
  }

  const canGenerateInvoice = (appointment: Appointment) => {
    return appointment.status === 'COMPLETED' && appointment.fullPayment
  }

  const getTotalPaid = (appointment: Appointment) => {
    return appointment.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune prestation
          </h3>
          <p className="text-gray-500">
            Aucun rendez-vous n'a encore été effectué avec ce client.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique des Prestations
            <Badge variant="secondary" className="ml-2">
              {appointments.length} prestation{appointments.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointments.map((appointment) => {
            const config = getStatusConfig(appointment.status)
            const Icon = config.icon
            const totalPaid = getTotalPaid(appointment)
            const canInvoice = canGenerateInvoice(appointment)
            
            return (
              <div
                key={appointment.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-lg">{appointment.title}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`${config.color} text-white`}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {format(parseISO(appointment.startDate), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(parseISO(appointment.startDate), 'HH:mm', { locale: fr })} - 
                            {format(parseISO(appointment.endDate), 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                        
                        {appointment.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{appointment.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            {appointment.client.firstName && appointment.client.lastName
                              ? `${appointment.client.firstName} ${appointment.client.lastName}`
                              : appointment.client.username
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Euro className="w-4 h-4" />
                          <span className="font-medium">
                            {appointment.price}€
                            {appointment.depositAmount && (
                              <span className="text-sm text-gray-500 ml-1">
                                (Caution: {appointment.depositAmount}€)
                              </span>
                            )}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <span className="font-medium">Payé: </span>
                          <span className={totalPaid >= appointment.price ? 'text-green-600' : 'text-orange-600'}>
                            {totalPaid}€ / {appointment.price}€
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {canInvoice && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateInvoice(appointment)}
                        disabled={generatingInvoice === appointment.id}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        {generatingInvoice === appointment.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <FileText className="w-4 h-4 mr-2" />
                        )}
                        Facture
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/api/appointments/${appointment.id}/details`, '_blank')}
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Historique des paiements */}
                {appointment.payments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Historique des paiements</h5>
                    <div className="space-y-2">
                      {appointment.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span className="capitalize">
                              {payment.type === 'DEPOSIT' ? 'Acompte' : 
                               payment.type === 'FULL_PAYMENT' ? 'Paiement complet' : 'Solde'}
                            </span>
                            <span className="text-gray-500">
                              {format(parseISO(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{payment.amount}€</span>
                            <Badge 
                              variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'}
                              className={payment.status === 'COMPLETED' ? 'bg-green-500' : ''}
                            >
                              {payment.status === 'COMPLETED' ? 'Payé' : 
                               payment.status === 'PENDING' ? 'En cours' : 'Échoué'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
