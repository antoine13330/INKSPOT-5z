"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, Clock, CheckCircle, XCircle, CreditCard, AlertCircle,
  MapPin, DollarSign, FileText, User, Banknote, History
} from 'lucide-react'
import { toast } from 'sonner'

interface AppointmentHistory {
  id: string
  oldStatus: string
  newStatus: string
  reason?: string
  createdAt: string
  changedBy: {
    id: string
    username: string
    avatar?: string
    role: string
  }
}

interface AppointmentDetails {
  id: string
  title: string
  description?: string
  status: string
  price: number
  currency: string
  startDate: string
  location?: string
  depositRequired: boolean
  depositAmount?: number
  totalPaid: number
  client: {
    id: string
    username: string
    avatar?: string
  }
  pro: {
    id: string
    username: string
    businessName?: string
  }
  createdAt: string
}

interface AppointmentStatusModalProps {
  appointment: AppointmentDetails
  isOpen: boolean
  onClose: () => void
  onStatusChange: (appointmentId: string, newStatus: string, reason?: string) => void
  onRefresh: () => void
}

interface StatusTransition {
  to: string
  label: string
  description: string
  requiredRole: string[]
  color: string
  icon: string
}

export function AppointmentStatusModal({ 
  appointment, 
  isOpen, 
  onClose, 
  onStatusChange,
  onRefresh 
}: AppointmentStatusModalProps) {
  const [availableTransitions, setAvailableTransitions] = useState<StatusTransition[]>([])
  const [history, setHistory] = useState<AppointmentHistory[]>([])
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (isOpen && appointment) {
      fetchTransitions()
      fetchHistory()
    }
  }, [isOpen, appointment])

  const fetchTransitions = async () => {
    try {
      const response = await fetch(`/api/appointments/transitions?status=${appointment.status}&role=pro`)
      if (response.ok) {
        const data = await response.json()
        setAvailableTransitions(data.availableTransitions || [])
      }
    } catch (error) {
      console.error("Error fetching transitions:", error)
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/appointments/${appointment.id}/history?limit=10`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error("Error fetching history:", error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return
    
    setLoading(true)
    try {
      await onStatusChange(appointment.id, newStatus, reason)
      setReason("")
      onRefresh()
      onClose()
    } catch (error) {
      console.error("Error changing status:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      PROPOSED: { label: "Proposé", color: "bg-orange-500", icon: Clock },
      ACCEPTED: { label: "Accepté", color: "bg-blue-500", icon: CheckCircle },
      CONFIRMED: { label: "Confirmé", color: "bg-green-500", icon: CheckCircle },
      COMPLETED: { label: "Terminé", color: "bg-green-700", icon: CheckCircle },
      CANCELLED: { label: "Annulé", color: "bg-red-500", icon: XCircle },
      RESCHEDULED: { label: "À reporter", color: "bg-yellow-500", icon: Calendar }
    }
    return configs[status as keyof typeof configs] || configs.PROPOSED
  }

  const getActionColor = (action: string) => {
    const colors = {
      CONFIRMED: "bg-blue-600 hover:bg-blue-700",
      CANCELLED: "bg-red-600 hover:bg-red-700", 
      COMPLETED: "bg-blue-600 hover:bg-blue-700",
      RESCHEDULED: "bg-yellow-600 hover:bg-yellow-700"
    }
    return colors[action as keyof typeof colors] || "bg-blue-600 hover:bg-blue-700"
  }

  if (!appointment) return null

  const currentConfig = getStatusConfig(appointment.status)
  const CurrentIcon = currentConfig.icon
  const needsDeposit = appointment.depositRequired && appointment.totalPaid < (appointment.depositAmount || 0)
  const depositPaid = appointment.depositRequired && appointment.totalPaid >= (appointment.depositAmount || 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Détails du rendez-vous
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Gérez le statut et les détails de ce rendez-vous
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={appointment.client.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{appointment.client.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-white text-lg">{appointment.title}</CardTitle>
                      <p className="text-gray-400">avec {appointment.client.username}</p>
                    </div>
                  </div>
                  <Badge className={`${currentConfig.color} text-white`}>
                    <CurrentIcon className="w-3 h-3 mr-1" />
                    {currentConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointment.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Description</h4>
                    <p className="text-white">{appointment.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Date & Heure
                    </h4>
                    <p className="text-white">
                      {new Date(appointment.startDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-white">
                      {new Date(appointment.startDate).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Prix
                    </h4>
                    <p className="text-white text-lg font-semibold">€{appointment.price}</p>
                    <p className="text-gray-400 text-sm">en {appointment.currency}</p>
                  </div>
                </div>

                {appointment.location && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Lieu
                    </h4>
                    <p className="text-white">{appointment.location}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Informations de paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total payé:</span>
                  <span className="text-green-400 font-medium">€{appointment.totalPaid}</span>
                </div>
                
                {appointment.depositRequired && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Acompte requis:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white">€{appointment.depositAmount}</span>
                        {depositPaid ? (
                          <Badge className="bg-green-500 text-white">✓ Payé</Badge>
                        ) : (
                          <Badge className="bg-orange-500 text-white">⏳ En attente</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Solde restant:</span>
                      <span className="text-blue-400">€{appointment.price - appointment.totalPaid}</span>
                    </div>
                  </>
                )}
                
                {needsDeposit && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-orange-400 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      En attente du paiement de l'acompte pour confirmer le rendez-vous
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Historique des modifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={entry.changedBy.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{entry.changedBy.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm">
                            <span className="font-medium">{entry.changedBy.username}</span> a changé le statut de 
                            <span className="text-orange-400 mx-1">{getStatusConfig(entry.oldStatus).label}</span>
                            vers
                            <span className="text-green-400 mx-1">{getStatusConfig(entry.newStatus).label}</span>
                          </p>
                          {entry.reason && (
                            <p className="text-gray-400 text-sm mt-1">Raison: {entry.reason}</p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(entry.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">Aucun historique disponible</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            {/* Status Actions */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Actions disponibles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableTransitions.length > 0 ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-400 mb-2 block">
                        Raison (optionnelle)
                      </label>
                      <Textarea
                        placeholder="Expliquez la raison du changement..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                    
                    <Separator className="bg-gray-700" />
                    
                    <div className="space-y-2">
                      {availableTransitions.map((transition) => (
                        <Button
                          key={transition.to}
                          onClick={() => handleStatusChange(transition.to)}
                          disabled={loading}
                          className={`w-full justify-start ${getActionColor(transition.to)}`}
                        >
                          {transition.label}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    Aucune action disponible pour ce statut
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Créé le:</span>
                  <span className="text-white">
                    {new Date(appointment.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Client:</span>
                  <span className="text-white">{appointment.client.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Statut actuel:</span>
                  <Badge className={`${currentConfig.color} text-white`}>
                    {currentConfig.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-white bg-transparent">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

