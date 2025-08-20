"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CreditCard, 
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface DirectBookingProps {
  proId: string
  proUsername: string
  proBusinessName?: string
  onBookingCreated: (booking: any) => void
  onClose: () => void
}

interface TimeSlot {
  time: string
  available: boolean
  price?: number
}

interface ServiceType {
  id: string
  name: string
  duration: number
  price: number
  description?: string
}

export function DirectBooking({ 
  proId, 
  proUsername, 
  proBusinessName, 
  onBookingCreated, 
  onClose 
}: DirectBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedService, setSelectedService] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"date" | "time" | "service" | "details" | "payment" | "confirmation">("date")
  
  const [availableDates, setAvailableDates] = useState<Date[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [services, setServices] = useState<ServiceType[]>([])
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<ServiceType | null>(null)

  useEffect(() => {
    fetchAvailableDates()
    fetchServices()
  }, [proId])

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate)
    }
  }, [selectedDate])

  useEffect(() => {
    if (selectedService) {
      const service = services.find(s => s.id === selectedService)
      setSelectedServiceDetails(service || null)
    }
  }, [selectedService, services])

  const fetchAvailableDates = async () => {
    try {
      const response = await fetch(`/api/pro/${proId}/availability/dates`)
      if (response.ok) {
        const data = await response.json()
        setAvailableDates(data.dates.map((date: string) => new Date(date)))
      }
    } catch (error) {
      console.error('Error fetching available dates:', error)
    }
  }

  const fetchTimeSlots = async (date: Date) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd')
      const response = await fetch(`/api/pro/${proId}/availability/times?date=${formattedDate}`)
      if (response.ok) {
        const data = await response.json()
        setTimeSlots(data.timeSlots)
      }
    } catch (error) {
      console.error('Error fetching time slots:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/pro/${proId}/services`)
      if (response.ok) {
        const data = await response.json()
        setServices(data.services)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setSelectedTime("")
      setStep("time")
    }
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep("service")
  }

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
    setStep("details")
  }

  const handleNext = () => {
    if (step === "details") {
      if (!selectedDate || !selectedTime || !selectedService) {
        toast.error("Veuillez sélectionner une date, heure et service")
        return
      }
      setStep("payment")
    }
  }

  const handleBack = () => {
    switch (step) {
      case "time":
        setStep("date")
        break
      case "service":
        setStep("time")
        break
      case "details":
        setStep("service")
        break
      case "payment":
        setStep("details")
        break
    }
  }

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedService || !selectedServiceDetails) {
      toast.error("Informations manquantes")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/bookings/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proId,
          serviceId: selectedService,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          notes: notes.trim() || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Réservation créée avec succès !")
        onBookingCreated(data.booking)
        setStep("confirmation")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors de la création de la réservation")
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error("Erreur lors de la création de la réservation")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    return time
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const isDateAvailable = (date: Date) => {
    return availableDates.some(availableDate => 
      format(availableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
  }

  const isDateDisabled = (date: Date) => {
    // Empêcher la sélection de dates/heures antérieures à l'heure + 1 minute
    const oneHourFromNow = new Date()
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1, oneHourFromNow.getMinutes() + 1, 0, 0)
    
    return date < oneHourFromNow || !isDateAvailable(date)
  }

  if (step === "confirmation") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Réservation confirmée !</h3>
          <p className="text-muted-foreground mb-4">
            Votre rendez-vous a été créé avec succès.
          </p>
          <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="font-medium">Date:</span>
              <span>{selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Heure:</span>
              <span>{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Service:</span>
              <span>{selectedServiceDetails?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Prix:</span>
              <span>{selectedServiceDetails && formatPrice(selectedServiceDetails.price)}</span>
            </div>
          </div>
          <Button onClick={onClose} className="mt-4">
            Fermer
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">
          Réservation directe - @{proUsername}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center space-x-2 ${step === "date" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === "date" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
              1
            </div>
            <span>Date</span>
          </div>
          <div className={`flex items-center space-x-2 ${step === "time" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === "time" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
              2
            </div>
            <span>Heure</span>
          </div>
          <div className={`flex items-center space-x-2 ${step === "service" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === "service" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
              3
            </div>
            <span>Service</span>
          </div>
          <div className={`flex items-center space-x-2 ${step === "details" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === "details" ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
              4
            </div>
            <span>Détails</span>
          </div>
        </div>

        {/* Step Content */}
        {step === "date" && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Sélectionnez une date</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choisissez une date disponible pour votre rendez-vous
              </p>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              className="rounded-md border"
            />
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Dates disponibles</span>
            </div>
          </div>
        )}

        {step === "time" && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Sélectionnez une heure</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choisissez un créneau disponible le {selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: fr })}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? "default" : "outline"}
                  disabled={!slot.available}
                  onClick={() => handleTimeSelect(slot.time)}
                  className="h-12"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {formatTime(slot.time)}
                </Button>
              ))}
            </div>
            {timeSlots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                <p>Aucun créneau disponible pour cette date</p>
              </div>
            )}
          </div>
        )}

        {step === "service" && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Sélectionnez un service</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choisissez le service que vous souhaitez réserver
              </p>
            </div>
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedService === service.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleServiceSelect(service.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {formatPrice(service.price)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === "details" && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Détails de la réservation</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Vérifiez les informations et ajoutez des notes si nécessaire
              </p>
            </div>
            
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Heure:</span>
                <span>{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Service:</span>
                <span>{selectedServiceDetails?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Durée:</span>
                <span>{selectedServiceDetails?.duration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Prix:</span>
                <span className="text-lg font-bold text-primary">
                  {selectedServiceDetails && formatPrice(selectedServiceDetails.price)}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajoutez des informations supplémentaires..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Paiement</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Confirmez votre réservation
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800">
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Paiement sécurisé</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Le paiement sera effectué lors de la confirmation par le professionnel
              </p>
            </div>

            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span>Service</span>
                <span>{selectedServiceDetails?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Date et heure</span>
                <span>{selectedDate && format(selectedDate, 'dd/MM/yyyy')} à {selectedTime}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">
                  {selectedServiceDetails && formatPrice(selectedServiceDetails.price)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          {step !== "date" && (
            <Button variant="outline" onClick={handleBack}>
              Retour
            </Button>
          )}
          
          <div className="ml-auto">
            {step === "details" && (
              <Button onClick={handleNext}>
                Continuer
              </Button>
            )}
            {step === "payment" && (
              <Button onClick={handleBooking} disabled={loading}>
                {loading ? "Création..." : "Confirmer la réservation"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
