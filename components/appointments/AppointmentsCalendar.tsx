"use client"

import React, { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock, MapPin, User, Eye, XCircle, AlertTriangle } from 'lucide-react'
import { format, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns'
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
  client: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
}

interface AppointmentsCalendarProps {
  appointments: Appointment[]
  onAppointmentClick?: (appointment: Appointment) => void
  onAppointmentCancelled?: (appointment: Appointment) => void
  className?: string
}

const getStatusConfig = (status: string) => {
  const configs = {
    PROPOSED: { color: 'bg-orange-500', label: 'Proposé' },
    ACCEPTED: { color: 'bg-blue-500', label: 'Accepté' },
    CONFIRMED: { color: 'bg-purple-500', label: 'Confirmé' },
    PAID: { color: 'bg-green-500', label: 'Payé' },
    COMPLETED: { color: 'bg-emerald-500', label: 'Terminé' },
    CANCELLED: { color: 'bg-red-500', label: 'Annulé' }
  }
  return configs[status as keyof typeof configs] || { color: 'bg-gray-500', label: 'Inconnu' }
}

export function AppointmentsCalendar({ 
  appointments, 
  onAppointmentClick,
  onAppointmentCancelled,
  className 
}: AppointmentsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month')
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  // Grouper les rendez-vous par date
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    const date = startOfDay(parseISO(appointment.startDate))
    const dateKey = format(date, 'yyyy-MM-dd')
    
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(appointment)
    return acc
  }, {} as Record<string, Appointment[]>)

  // Obtenir les rendez-vous pour une date donnée
  const getAppointmentsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return appointmentsByDate[dateKey] || []
  }

  // Vérifier si un rendez-vous peut être annulé
  const canCancelAppointment = (appointment: Appointment) => {
    return ['ACCEPTED', 'CONFIRMED', 'PAID'].includes(appointment.status) &&
           new Date(appointment.startDate) > new Date()
  }

  // Annuler un rendez-vous
  const handleCancelAppointment = async () => {
    if (!cancellingAppointment) return

    setIsCancelling(true)
    try {
      const response = await fetch(`/api/appointments/${cancellingAppointment.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancellationReason || 'Annulation par le professionnel',
          refundDeposit: true
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'annulation')
      }

      const result = await response.json()
      
      toast.success(
        `Rendez-vous annulé avec succès. ${result.refundedAmount ? `Remboursement de ${result.refundedAmount}€ effectué.` : ''}`
      )

      // Appeler le callback de mise à jour
      onAppointmentCancelled?.(cancellingAppointment)
      
      // Fermer la modal
      setShowCancelModal(false)
      setCancellingAppointment(null)
      setCancellationReason('')
      
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error)
      toast.error('Erreur lors de l\'annulation du rendez-vous')
    } finally {
      setIsCancelling(false)
    }
  }

  // Ouvrir la modal d'annulation
  const openCancelModal = (appointment: Appointment) => {
    setCancellingAppointment(appointment)
    setShowCancelModal(true)
  }

  // Rendu personnalisé des jours du calendrier
  const renderDay = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date)
    const isToday = isSameDay(date, new Date())
    
    return (
      <div className="relative min-h-[80px] p-1">
        <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
          {format(date, 'd')}
        </div>
        
        {dayAppointments.length > 0 && (
          <div className="mt-1 space-y-1">
            {dayAppointments.slice(0, 2).map((appointment) => {
              const config = getStatusConfig(appointment.status)
              return (
                <div
                  key={appointment.id}
                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity ${config.color} text-white`}
                  onClick={() => onAppointmentClick?.(appointment)}
                  title={`${appointment.title} - ${appointment.client.firstName || appointment.client.username}`}
                >
                  <div className="truncate font-medium">
                    {appointment.title}
                  </div>
                  <div className="truncate opacity-90">
                    {appointment.client.firstName || appointment.client.username}
                  </div>
                </div>
              )
            })}
            
            {dayAppointments.length > 2 && (
              <div className="text-xs text-center text-gray-500 bg-gray-100 rounded px-1 py-0.5">
                +{dayAppointments.length - 2} autres
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Obtenir les rendez-vous du jour sélectionné
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  return (
    <div className={className}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">
            📅 Calendrier des rendez-vous
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={calendarView === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCalendarView('month')}
            >
              Mois
            </Button>
            <Button
              variant={calendarView === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCalendarView('week')}
            >
              Semaine
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Calendrier */}
          <div className="border rounded-lg p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full"
              classNames={{
                day: "h-20 w-full p-0",
                day_selected: "bg-blue-100 text-blue-900 hover:bg-blue-200",
                today: "bg-blue-50 text-blue-900 font-bold"
              }}
              components={{
                Day: ({ day, ...props }) => (
                  <div {...props} className="h-full">
                    {renderDay(day.date)}
                  </div>
                )
              }}
            />
          </div>

          {/* Détails du jour sélectionné */}
          {selectedDate && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Rendez-vous du {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              
              {selectedDateAppointments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucun rendez-vous prévu pour cette date
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateAppointments.map((appointment) => {
                    const config = getStatusConfig(appointment.status)
                    const startTime = format(parseISO(appointment.startDate), 'HH:mm')
                    const endTime = format(parseISO(appointment.endDate), 'HH:mm')
                    const canCancel = canCancelAppointment(appointment)
                    
                    return (
                      <div
                        key={appointment.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{appointment.title}</h4>
                              <Badge 
                                variant="secondary" 
                                className={`${config.color} text-white text-xs`}
                              >
                                {config.label}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>{startTime} - {endTime}</span>
                              </div>
                              
                              {appointment.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3" />
                                  <span>{appointment.location}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3" />
                                <span>
                                  {appointment.client.firstName && appointment.client.lastName
                                    ? `${appointment.client.firstName} ${appointment.client.lastName}`
                                    : appointment.client.username
                                  }
                                </span>
                              </div>
                              
                              <div className="font-medium text-green-600">
                                {appointment.price} {appointment.currency}
                                {appointment.depositAmount && (
                                  <span className="text-sm text-gray-500 ml-2">
                                    (Caution: {appointment.depositAmount}€)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAppointmentClick?.(appointment)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {canCancel && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openCancelModal(appointment)}
                                title="Annuler le rendez-vous"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal d'annulation */}
      {showCancelModal && cancellingAppointment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Annuler le rendez-vous</h3>
                  <p className="text-sm text-gray-600">
                    Êtes-vous sûr de vouloir annuler ce rendez-vous ?
                  </p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">{cancellingAppointment.title}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Client: {cancellingAppointment.client.firstName || cancellingAppointment.client.username}</div>
                  <div>Date: {format(parseISO(cancellingAppointment.startDate), 'dd/MM/yyyy à HH:mm')}</div>
                  <div>Prix: {cancellingAppointment.price}€</div>
                  {cancellingAppointment.depositAmount && (
                    <div className="text-green-600 font-medium">
                      ⚠️ La caution de {cancellingAppointment.depositAmount}€ sera automatiquement remboursée
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison de l'annulation (optionnel)
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Ex: Créneau indisponible, urgence personnelle..."
                  className="w-full p-2 border border-gray-300 rounded-md resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelModal(false)
                    setCancellingAppointment(null)
                    setCancellationReason('')
                  }}
                  disabled={isCancelling}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelAppointment}
                  disabled={isCancelling}
                  className="flex-1"
                >
                  {isCancelling ? 'Annulation...' : 'Confirmer l\'annulation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
