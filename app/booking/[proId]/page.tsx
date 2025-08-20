"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock, MapPin, Star, Euro } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface Pro {
  id: string
  username: string
  businessName?: string
  avatar?: string
  bio?: string
  location?: string
  hourlyRate?: number
  specialties: string[]
  verified: boolean
  rating: number
  reviewsCount: number
}

interface TimeSlot {
  time: string
  available: boolean
}

export default function BookingPage({ params }: { params: Promise<{ proId: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [pro, setPro] = useState<Pro | null>(null)

  // Check if user is PRO - only PRO users can create appointment proposals
  if (!session?.user || session.user.role !== "PRO") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md modern-card">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Only PRO users can create appointment proposals. Clients receive proposals from professionals.
            </p>
            <Button onClick={() => router.push("/")} className="modern-button bg-primary hover:bg-primary/90 text-primary-foreground">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [bookingData, setBookingData] = useState({
    title: "",
    description: "",
    location: "",
    duration: "1", // hours
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [proId, setProId] = useState<string>("")

  useEffect(() => {
    const getParams = async () => {
      const { proId: id } = await params
      setProId(id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (proId) {
      fetchProData()
    }
  }, [proId])

  useEffect(() => {
    if (selectedDate && proId) {
      fetchAvailableSlots()
    }
  }, [selectedDate, proId])

  const fetchProData = async () => {
    try {
      const response = await fetch(`/api/users/${proId}`)
      const data = await response.json()
      setPro(data.user)
    } catch (error) {
      // Log error for debugging (in production, send to monitoring service)
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching pro data:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return

    try {
      const response = await fetch(`/api/bookings/availability/${proId}?date=${selectedDate.toISOString()}`)
      const data = await response.json()
      setAvailableSlots(data.slots || [])
    } catch (error) {
      // Log error for debugging (in production, send to monitoring service)
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching availability:", error)
      }
    }
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !selectedDate || !selectedTime) return

    setSubmitting(true)

    try {
      const startTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(":")
      startTime.setHours(Number.parseInt(hours), Number.parseInt(minutes))

      const endTime = new Date(startTime)
      endTime.setHours(startTime.getHours() + Number.parseInt(bookingData.duration))

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proId: proId,
          title: bookingData.title,
          description: bookingData.description,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          location: bookingData.location,
          price: pro?.hourlyRate ? pro.hourlyRate * Number.parseInt(bookingData.duration) : 0,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/bookings/${data.booking.id}`)
      } else {
        alert("Booking failed. Please try again.")
      }
    } catch (error) {
      // Log error for debugging (in production, send to monitoring service)
      if (process.env.NODE_ENV === 'development') {
        console.error("Error creating booking:", error)
      }
      alert("Booking failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!pro) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Professional not found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const totalPrice = pro.hourlyRate ? pro.hourlyRate * Number.parseInt(bookingData.duration) : 0

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 hover:text-white mb-4">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold">Book a Service</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pro Info */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-800 sticky top-6">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={pro.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{pro.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-white">{pro.businessName || pro.username}</h3>
                      {pro.verified && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-400">
                          {pro.rating} ({pro.reviewsCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {pro.bio && <p className="text-gray-400 text-sm mb-4">{pro.bio}</p>}

                {pro.location && (
                  <div className="flex items-center space-x-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{pro.location}</span>
                  </div>
                )}

                {pro.hourlyRate && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Euro className="w-4 h-4 text-green-400" />
                    <span className="text-lg font-semibold text-green-400">{pro.hourlyRate}€/hour</span>
                  </div>
                )}

                {pro.specialties.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {pro.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-800 text-gray-300">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Book an Appointment</CardTitle>
                <CardDescription className="text-gray-400">
                  Fill in the details for your booking request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBooking} className="space-y-6">
                  {/* Service Details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-white">
                        Service Title
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="e.g., Custom Tattoo Design"
                        value={bookingData.title}
                        onChange={handleChange}
                        className="bg-gray-800 border-gray-700 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe what you need..."
                        value={bookingData.description}
                        onChange={handleChange}
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-white">
                        Location
                      </Label>
                      <Input
                        id="location"
                        name="location"
                        placeholder="Where should the service take place?"
                        value={bookingData.location}
                        onChange={handleChange}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>

                  {/* Date & Time Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Select Date & Time</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              disabled={(date) => {
                                // Empêcher la sélection de dates/heures antérieures à l'heure + 1 minute
                                const oneHourFromNow = new Date()
                                oneHourFromNow.setHours(oneHourFromNow.getHours() + 1, oneHourFromNow.getMinutes() + 1, 0, 0)
                                return date < oneHourFromNow
                              }}
                              initialFocus
                              className="bg-gray-800 text-white"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Duration</Label>
                        <Select
                          value={bookingData.duration}
                          onValueChange={(value) => setBookingData({ ...bookingData, duration: value })}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="1">1 hour</SelectItem>
                            <SelectItem value="2">2 hours</SelectItem>
                            <SelectItem value="3">3 hours</SelectItem>
                            <SelectItem value="4">4 hours</SelectItem>
                            <SelectItem value="6">6 hours</SelectItem>
                            <SelectItem value="8">8 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Time Slots */}
                    {selectedDate && availableSlots.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-white">Available Times</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.map((slot) => (
                            <Button
                              key={slot.time}
                              type="button"
                              variant={selectedTime === slot.time ? "default" : "outline"}
                              className={`${
                                selectedTime === slot.time
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                              } ${!slot.available ? "opacity-50 cursor-not-allowed" : ""}`}
                              onClick={() => slot.available && setSelectedTime(slot.time)}
                              disabled={!slot.available}
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              {slot.time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price Summary */}
                  {totalPrice > 0 && (
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-white">Total Price:</span>
                        <span className="text-2xl font-bold text-green-400">€{totalPrice}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {bookingData.duration} hour(s) × €{pro.hourlyRate}/hour
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={submitting || !selectedDate || !selectedTime || !bookingData.title}
                  >
                    {submitting ? "Creating Booking..." : "Request Booking"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
