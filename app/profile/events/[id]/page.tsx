"use client"
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MapPin, Euro, User, FileText, CreditCard, Download, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { BottomNavigation } from '@/components/bottom-navigation'
import { Appointment, Payment, Invoice } from '@/types'
import { toast } from 'sonner'

export default function EventDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  
  const [event, setEvent] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'payments' | 'invoices'>('details')
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    if (session?.user?.id && eventId) {
      fetchEventDetails()
    }
  }, [session?.user?.id, eventId])

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/appointments/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data.event)
      } else {
        toast.error('Erreur lors du chargement de l\'événement')
        router.push('/profile/events')
      }
    } catch (error) {
      console.error('Error fetching event details:', error)
      toast.error('Erreur lors du chargement de l\'événement')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!event) return

    try {
      setProcessingPayment(true)
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: event.id,
          amount: event.price,
          currency: event.currency
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Rediriger vers Stripe Checkout ou ouvrir le modal de paiement
        toast.success('Redirection vers le paiement...')
        // Ici vous pouvez intégrer Stripe Elements ou rediriger vers Checkout
      } else {
        toast.error('Erreur lors de la création du paiement')
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      toast.error('Erreur lors de la création du paiement')
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleEdit = () => {
    router.push(`/profile/events/${eventId}/edit`)
  }

  const handleCancel = async () => {
    if (!event || !confirm('Êtes-vous sûr de vouloir annuler cet événement ?')) return

    try {
      const response = await fetch(`/api/appointments/events/${eventId}/cancel`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Événement annulé avec succès')
        fetchEventDetails()
      } else {
        toast.error('Erreur lors de l\'annulation')
      }
    } catch (error) {
      console.error('Error cancelling event:', error)
      toast.error('Erreur lors de l\'annulation')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'PAID': return 'bg-purple-100 text-purple-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmé'
      case 'IN_PROGRESS': return 'En cours'
      case 'COMPLETED': return 'Terminé'
      case 'CANCELLED': return 'Annulé'
      case 'PAID': return 'Payé'
      default: return 'En attente'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isPro = session?.user?.role === 'PRO'
  const isOwner = isPro ? event?.proId === session?.user?.id : event?.clientId === session?.user?.id
  const canEdit = isOwner && event?.status !== 'COMPLETED' && event?.status !== 'CANCELLED'
  const canCancel = isOwner && event?.status !== 'COMPLETED' && event?.status !== 'CANCELLED'
  const canPay = !isPro && event?.status === 'CONFIRMED' && event?.payments?.every(p => p.status !== 'COMPLETED')

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Connexion requise</h1>
          <p className="text-muted-foreground mb-4">Veuillez vous connecter pour voir les détails</p>
          <Button onClick={() => router.push('/auth/login')}>Se connecter</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des détails...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Événement non trouvé</h1>
          <p className="text-muted-foreground mb-4">L'événement que vous recherchez n'existe pas</p>
          <Button onClick={() => router.push('/profile/events')}>Retour aux événements</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/profile/events')}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{event.title}</h1>
            <p className="text-primary-foreground/80">
              {formatDate(event.startDate)} à {formatTime(event.startDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Status and Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Badge className={getStatusColor(event.status)}>
            {getStatusLabel(event.status)}
          </Badge>
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <Trash2 className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            )}
            {canPay && (
              <Button onClick={handlePayment} disabled={processingPayment}>
                <CreditCard className="w-4 h-4 mr-2" />
                {processingPayment ? 'Traitement...' : 'Payer'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'details' | 'payments' | 'invoices')} className="px-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
        </TabsList>

        {/* Détails */}
        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Date et heure</span>
                  </div>
                  <p className="font-medium">
                    {formatDate(event.startDate)} de {formatTime(event.startDate)} à {formatTime(event.endDate)}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Durée</span>
                  </div>
                  <p className="font-medium">{event.duration} minutes</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Lieu</span>
                  </div>
                  <p className="font-medium">{event.location || 'Non spécifié'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Euro className="w-4 h-4" />
                    <span>Prix</span>
                  </div>
                  <p className="font-medium text-lg text-primary">
                    {event.price} {event.currency}
                  </p>
                </div>
              </div>

              {event.description && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Description</h4>
                    <p className="text-muted-foreground">{event.description}</p>
                  </div>
                </>
              )}

              {event.requirements && event.requirements.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Prérequis</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {event.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {event.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Notes</h4>
                    <p className="text-muted-foreground">{event.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Client</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {event.client?.firstName} {event.client?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">@{event.client?.username}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Professionnel</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {event.pro?.businessName || `${event.pro?.firstName} ${event.pro?.lastName}`}
                      </p>
                      <p className="text-sm text-muted-foreground">@{event.pro?.username}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paiements */}
        <TabsContent value="payments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Historique des paiements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event.payments && event.payments.length > 0 ? (
                <div className="space-y-3">
                  {event.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          payment.status === 'COMPLETED' ? 'bg-green-100' : 
                          payment.status === 'FAILED' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          {payment.status === 'COMPLETED' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : payment.status === 'FAILED' ? (
                            <XCircle className="w-4 h-4 text-red-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{payment.amount} {payment.currency}</p>
                          <p className="text-sm text-muted-foreground">
                            {payment.status === 'COMPLETED' ? 'Payé' : 
                             payment.status === 'FAILED' ? 'Échoué' : 'En attente'}
                          </p>
                        </div>
                      </div>
                      {payment.paidAt && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.paidAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun paiement enregistré</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Factures */}
        <TabsContent value="invoices" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Factures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune facture disponible</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Les factures seront générées automatiquement après paiement
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  )
}
