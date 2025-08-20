"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Calendar, Clock, CheckCircle, XCircle, CreditCard, AlertCircle,
  Eye, MoreHorizontal, Search, Filter, TrendingUp, DollarSign,
  Users, FileText, Banknote, MapPin
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AppointmentStatusModal } from "@/components/appointments/AppointmentStatusModal"

interface AppointmentStats {
  totalAppointments: number
  statusCounts: {
    PROPOSED: number
    ACCEPTED: number
    CONFIRMED: number
    COMPLETED: number
    CANCELLED: number
    RESCHEDULED: number
  }
  revenue: {
    totalReceived: number
    confirmed: number
    pending: number
  }
  conversion: {
    proposalToAccepted: number
    acceptedToConfirmed: number
    overallConversion: number
  }
}

interface Appointment {
  id: string
  title: string
  description?: string
  status: string
  price: number
  currency: string
  startDate: string
  endDate: string
  location?: string
  depositRequired: boolean
  depositAmount?: number
  totalPaid: number
  depositPaid: boolean
  fullPayment: boolean
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
  lastPayment?: string
  createdAt: string
  updatedAt: string
}

export default function AppointmentsDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [stats, setStats] = useState<AppointmentStats | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "PRO") {
      router.push("/")
      return
    }

    fetchAppointmentData()
  }, [session, status, router])

  useEffect(() => {
    if (session && session.user.role === "PRO") {
      fetchAppointmentData()
    }
  }, [selectedStatus])

  const fetchAppointmentData = async () => {
    try {
      const [statsRes, appointmentsRes] = await Promise.all([
        fetch("/api/appointments/stats?period=30"),
        fetch(`/api/appointments/list?limit=50&status=${selectedStatus !== 'all' ? selectedStatus : ''}`)
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.summary)
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        setAppointments(appointmentsData.appointments || [])
      }
    } catch (error) {
      console.error("Error fetching appointment data:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (appointmentId: string, newStatus: string, reason?: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, reason }),
      })

      if (response.ok) {
        toast.success("Statut mis à jour avec succès")
        fetchAppointmentData() // Refresh data
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors de la mise à jour")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Erreur de connexion")
    }
  }

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/confirm`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success("Rendez-vous confirmé avec succès")
        fetchAppointmentData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors de la confirmation")
      }
    } catch (error) {
      console.error("Error confirming appointment:", error)
      toast.error("Erreur de connexion")
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      PROPOSED: { 
        label: "Proposé", 
        color: "bg-orange-500", 
        icon: Clock,
        textColor: "text-orange-400"
      },
      ACCEPTED: { 
        label: "Accepté", 
        color: "bg-blue-500", 
        icon: CheckCircle,
        textColor: "text-blue-400"
      },
      CONFIRMED: { 
        label: "Confirmé", 
        color: "bg-green-500", 
        icon: CheckCircle,
        textColor: "text-green-400"
      },
      COMPLETED: { 
        label: "Terminé", 
        color: "bg-green-700", 
        icon: CheckCircle,
        textColor: "text-green-500"
      },
      CANCELLED: { 
        label: "Annulé", 
        color: "bg-red-500", 
        icon: XCircle,
        textColor: "text-red-400"
      },
      RESCHEDULED: { 
        label: "À reporter", 
        color: "bg-yellow-500", 
        icon: Calendar,
        textColor: "text-yellow-400"
      }
    }
    return configs[status as keyof typeof configs] || configs.PROPOSED
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = selectedStatus === "all" || appointment.status === selectedStatus
    const matchesSearch = appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.client.username.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const needsAction = appointments.filter(apt => 
    apt.status === 'ACCEPTED' && apt.depositRequired && apt.depositPaid
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Rendez-vous</h1>
            <p className="text-gray-400">Gérez vos propositions et confirmez vos créneaux</p>
          </div>
          {needsAction.length > 0 && (
            <Badge className="bg-orange-500 text-white">
              {needsAction.length} action(s) requise(s)
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total RDV</CardTitle>
                <Calendar className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalAppointments}</div>
                <p className="text-xs text-gray-400">
                  {stats.statusCounts.PROPOSED} en attente
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Revenus reçus</CardTitle>
                <Banknote className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">€{stats.revenue.totalReceived}</div>
                <p className="text-xs text-gray-400">
                  €{stats.revenue.pending} en attente
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Taux conversion</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.conversion.overallConversion.toFixed(0)}%
                </div>
                <p className="text-xs text-gray-400">Proposé → Confirmé</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Confirmés</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.statusCounts.CONFIRMED + stats.statusCounts.COMPLETED}
                </div>
                <p className="text-xs text-gray-400">Ce mois</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par titre ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PROPOSED">Proposé</SelectItem>
              <SelectItem value="ACCEPTED">Accepté</SelectItem>
              <SelectItem value="CONFIRMED">Confirmé</SelectItem>
              <SelectItem value="COMPLETED">Terminé</SelectItem>
              <SelectItem value="CANCELLED">Annulé</SelectItem>
              <SelectItem value="RESCHEDULED">À reporter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Appointments List */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">
              Rendez-vous ({filteredAppointments.length})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Gérez vos propositions et confirmez vos créneaux après paiement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => {
                const config = getStatusConfig(appointment.status)
                const Icon = config.icon
                const needsConfirmation = appointment.status === 'ACCEPTED' && 
                                        appointment.depositRequired && 
                                        appointment.depositPaid
                
                return (
                  <div key={appointment.id} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={appointment.client.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{appointment.client.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-white truncate">{appointment.title}</h4>
                            <Badge className={`${config.color} text-white`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {config.label}
                            </Badge>
                            {needsConfirmation && (
                              <Badge className="bg-orange-500 text-white">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Action requise
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-400 mb-2">
                            Client: {appointment.client.username} • 
                            {new Date(appointment.startDate).toLocaleDateString('fr-FR')} à {new Date(appointment.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          
                          {appointment.location && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                              <MapPin className="w-3 h-3" />
                              {appointment.location}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-400 font-medium">€{appointment.price}</span>
                            {appointment.depositRequired && (
                              <span className="text-blue-400">
                                Acompte: €{appointment.depositAmount} 
                                {appointment.depositPaid ? " ✓" : " ⏳"}
                              </span>
                            )}
                            <span className="text-gray-400">
                              Payé: €{appointment.totalPaid}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {needsConfirmation && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmAppointment(appointment.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirmer
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setStatusModalOpen(true)
                          }}
                          className="border-gray-600 text-white bg-transparent"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {filteredAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun rendez-vous trouvé</p>
                  <p className="text-sm">Ajustez vos filtres ou créez une nouvelle proposition</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Modal */}
        {selectedAppointment && (
          <AppointmentStatusModal
            appointment={selectedAppointment}
            isOpen={statusModalOpen}
            onClose={() => {
              setStatusModalOpen(false)
              setSelectedAppointment(null)
            }}
            onStatusChange={handleStatusChange}
            onRefresh={fetchAppointmentData}
          />
        )}
      </div>
    </div>
  )
}
