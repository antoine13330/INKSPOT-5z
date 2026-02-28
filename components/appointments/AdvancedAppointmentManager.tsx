"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Euro, 
  Users,
  Repeat,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Copy,
  Star,
  Pin,
  Zap,
  Settings,
  BarChart3,
  FileText,
  Send,
  RefreshCw,
  Plus,
  Minus
} from 'lucide-react'
import { toast } from 'sonner'
import { format, addDays, addWeeks, addMonths, isSameDay, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { useFormValidation } from '@/components/ui/form-validation'
import { AppointmentService } from '@/lib/services/appointment-service'

interface AppointmentTemplate {
  id: string
  name: string
  duration: number
  price: number
  description: string
  category: string
  isRecurring: boolean
  recurrencePattern?: {
    type: 'daily' | 'weekly' | 'monthly'
    interval: number
    endDate?: Date
    maxOccurrences?: number
  }
}

interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
  existingAppointments: string[]
}

interface Conflict {
  type: 'overlap' | 'insufficient_time' | 'unavailable_hours' | 'double_booking'
  message: string
  severity: 'warning' | 'error'
  suggestedSolutions: string[]
}

interface AdvancedAppointmentManagerProps {
  proId: string
  onAppointmentCreated: (appointment: any) => void
  onAppointmentUpdated: (appointment: any) => void
  onAppointmentDeleted: (appointmentId: string) => void
  className?: string
}

export function AdvancedAppointmentManager({
  proId,
  onAppointmentCreated,
  onAppointmentUpdated,
  onAppointmentDeleted,
  className = ""
}: AdvancedAppointmentManagerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTemplate, setSelectedTemplate] = useState<AppointmentTemplate | null>(null)
  const [customAppointment, setCustomAppointment] = useState({
    title: '',
    description: '',
    duration: 60,
    price: 0,
    location: '',
    maxParticipants: 1,
    isRecurring: false,
    recurrencePattern: {
      type: 'weekly' as 'daily' | 'weekly' | 'monthly',
      interval: 1,
      endDate: addWeeks(new Date(), 4),
      maxOccurrences: 8
    }
  })
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('templates')
  const [templates, setTemplates] = useState<AppointmentTemplate[]>([])
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  
  // Form validation - fix the hook usage to match what it actually returns
  const { validateAllFields, getFieldError, hasErrors } = useFormValidation(
    {
      title: '',
      description: '',
      duration: 60,
      price: 0,
      location: ''
    },
    {
      rules: [
        { type: 'required', message: 'Title is required' },
        { type: 'minLength', value: 3, message: 'Title too short' },
        { type: 'maxLength', value: 100, message: 'Title too long' }
      ],
      validateOnSubmit: true
    }
  )

  // Initialize appointment service
  const appointmentService = new AppointmentService()

  useEffect(() => {
    loadTemplates()
    loadAvailableSlots()
  }, [selectedDate, proId])

  // Load appointment templates
  const loadTemplates = async () => {
    try {
      // This would fetch from your API
      const mockTemplates: AppointmentTemplate[] = [
        {
          id: '1',
          name: 'Consultation Standard',
          duration: 60,
          price: 80,
          description: 'Consultation de base pour évaluer vos besoins',
          category: 'consultation',
          isRecurring: false
        },
        {
          id: '2',
          name: 'Séance Récurrente',
          duration: 90,
          price: 120,
          description: 'Séance hebdomadaire pour suivi régulier',
          category: 'recurring',
          isRecurring: true,
          recurrencePattern: {
            type: 'weekly',
            interval: 1,
            endDate: addWeeks(new Date(), 8),
            maxOccurrences: 8
          }
        },
        {
          id: '3',
          name: 'Formation Groupe',
          duration: 120,
          price: 150,
          description: 'Formation en groupe de 3-5 personnes',
          category: 'group',
          isRecurring: false
        }
      ]
      setTemplates(mockTemplates)
    } catch (error) {
      toast.error('Erreur lors du chargement des modèles')
    }
  }

  // Load available time slots
  const loadAvailableSlots = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/pro/${proId}/availability/slots?date=${format(selectedDate, 'yyyy-MM-dd')}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.slots || [])
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des créneaux')
    } finally {
      setIsLoading(false)
    }
  }

  // Check for conflicts
  const checkConflicts = useCallback(async (appointment: any): Promise<Conflict[]> => {
    const conflicts: Conflict[] = []
    
    try {
      // Check for time overlaps - mock implementation for now
      const overlappingAppointments = []
      
      if (overlappingAppointments.length > 0) {
        conflicts.push({
          type: 'overlap',
          message: `Conflit avec ${overlappingAppointments.length} rendez-vous existant(s)`,
          severity: 'error',
          suggestedSolutions: [
            'Choisir un autre créneau horaire',
            'Déplacer le rendez-vous existant',
            'Réduire la durée du rendez-vous'
          ]
        })
      }
      
      // Check if slot is available
      const selectedSlot = availableSlots.find(slot => 
        slot.startTime === format(appointment.startDate, 'HH:mm') &&
        slot.endTime === format(appointment.endDate, 'HH:mm')
      )
      
      if (!selectedSlot || !selectedSlot.isAvailable) {
        conflicts.push({
          type: 'unavailable_hours',
          message: 'Ce créneau n\'est pas disponible',
          severity: 'error',
          suggestedSolutions: [
            'Choisir un autre créneau',
            'Vérifier la disponibilité',
            'Contacter le professionnel'
          ]
        })
      }
      
      // Check if duration fits in available time
      const slotDuration = Math.round((appointment.endDate.getTime() - appointment.startDate.getTime()) / (1000 * 60))
      
      if (slotDuration > customAppointment.duration) {
        conflicts.push({
          type: 'insufficient_time',
          message: 'Durée insuffisante pour ce créneau',
          severity: 'warning',
          suggestedSolutions: [
            'Réduire la durée du rendez-vous',
            'Choisir un créneau plus long',
            'Diviser en plusieurs rendez-vous'
          ]
        })
      }
      
    } catch (error) {
      console.error('Error checking conflicts:', error)
    }
    
    setConflicts(conflicts)
    return conflicts
  }, [proId, availableSlots, customAppointment.duration, appointmentService])

  // Create appointment
  const createAppointment = async () => {
    try {
      // Validate form
      const isValid = await validateAllFields()
      
      if (!isValid) {
        toast.error('Please fill in all required fields correctly')
        return
      }
      
      // Check conflicts
      const appointmentData = {
        title: customAppointment.title,
        description: customAppointment.description,
        duration: customAppointment.duration,
        price: customAppointment.price,
        location: customAppointment.location,
        maxParticipants: customAppointment.maxParticipants,
        startDate: selectedDate,
        endDate: addDays(selectedDate, customAppointment.duration / 60 / 24)
      }
      
      const conflicts = await checkConflicts(appointmentData)
      if (conflicts.some(c => c.severity === 'error')) {
        toast.error('Impossible de créer le rendez-vous - conflits détectés')
        return
      }
      
      setIsLoading(true)
      
      // Create appointment using service - mock implementation for now
      const appointment = {
        id: `appointment-${Date.now()}`,
        ...appointmentData,
        proId,
        clientId: 'mock-client-id',
        status: 'PROPOSED'
      }
      
      // Handle recurring appointments
      if (customAppointment.isRecurring) {
        await createRecurringAppointments(appointment)
      }
      
      onAppointmentCreated(appointment)
      toast.success('Rendez-vous créé avec succès')
      
      // Reset form
      setCustomAppointment({
        title: '',
        description: '',
        duration: 60,
        price: 0,
        location: '',
        maxParticipants: 1,
        isRecurring: false,
        recurrencePattern: {
          type: 'weekly',
          interval: 1,
          endDate: addWeeks(new Date(), 4),
          maxOccurrences: 8
        }
      })
      
    } catch (error) {
      toast.error('Erreur lors de la création du rendez-vous')
      console.error('Error creating appointment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Create recurring appointments
  const createRecurringAppointments = async (baseAppointment: any) => {
    if (!customAppointment.isRecurring || !customAppointment.recurrencePattern) return
    
    const { type, interval, endDate, maxOccurrences } = customAppointment.recurrencePattern
    let currentDate = addDays(selectedDate, interval)
    let count = 1
    
    while (
      currentDate <= endDate && 
      count < (maxOccurrences || 999) &&
      count < 50 // Safety limit
    ) {
      try {
        const recurringAppointment = {
          ...baseAppointment,
          id: `appointment-${Date.now()}-${count}`,
          startDate: currentDate,
          endDate: addDays(currentDate, customAppointment.duration / 60 / 24)
        }
        
        count++
        
        // Calculate next date based on pattern
        switch (type as string) {
          case 'daily':
            currentDate = addDays(currentDate, interval)
            break
          case 'weekly':
            currentDate = addWeeks(currentDate, interval)
            break
          case 'monthly':
            currentDate = addMonths(currentDate, interval)
            break
        }
        
      } catch (error) {
        console.error('Error creating recurring appointment:', error)
        break
      }
    }
    
    if (count > 1) {
      toast.success(`${count} rendez-vous récurrents créés`)
    }
  }

  // Apply template values to the custom appointment form
  const applyTemplate = (template: AppointmentTemplate) => {
    setSelectedTemplate(template)
    setCustomAppointment({
      title: template.name,
      description: template.description,
      duration: template.duration,
      price: template.price,
      location: customAppointment.location,
      maxParticipants: 1,
      isRecurring: template.isRecurring,
      recurrencePattern: template.recurrencePattern as any || {
        type: 'weekly' as const,
        interval: 1,
        endDate: addWeeks(new Date(), 4),
        maxOccurrences: 8
      }
    })
    setActiveTab('custom')
  }

  // Duplicate template
  const duplicateTemplate = (template: AppointmentTemplate) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copie)`
    }
    setTemplates(prev => [...prev, newTemplate])
    toast.success('Modèle dupliqué')
  }

  // Delete template
  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
    toast.success('Modèle supprimé')
  }

  // Generate time slots
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = []
    const startHour = 9 // 9 AM
    const endHour = 18 // 6 PM
    const slotDuration = 30 // 30 minutes
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const endMinute = minute + slotDuration
        const endHour = hour + Math.floor(endMinute / 60)
        const endTime = `${endHour.toString().padStart(2, '0')}:${(endMinute % 60).toString().padStart(2, '0')}`
        
        slots.push({
          startTime,
          endTime,
          isAvailable: Math.random() > 0.3, // Random availability for demo
          existingAppointments: []
        })
      }
    }
    
    setAvailableSlots(slots)
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Gestionnaire de Rendez-vous Avancé</span>
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateTimeSlots}
                  disabled={isLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Générer Créneaux
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Options Avancées
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Sélection de Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => {
                  const oneHourFromNow = new Date()
                  oneHourFromNow.setHours(oneHourFromNow.getHours() + 1, oneHourFromNow.getMinutes() + 1, 0, 0)
                  return date < oneHourFromNow
                }}
                className="rounded-md border"
              />
              
              {/* Date Info */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {availableSlots.filter(s => s.isAvailable).length} créneaux disponibles
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="templates">Modèles</TabsTrigger>
                <TabsTrigger value="custom">Personnalisé</TabsTrigger>
                <TabsTrigger value="conflicts">Conflits</TabsTrigger>
              </TabsList>

              {/* Templates Tab */}
              <TabsContent value="templates" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateTemplate(template)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTemplate(template.id)}
                              className="h-6 w-6 p-0 text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {template.duration} min
                            </span>
                            <span className="flex items-center">
                              <Euro className="w-3 h-3 mr-1" />
                              {template.price}€
                            </span>
                          </div>
                          {template.isRecurring && (
                            <Badge variant="secondary" className="text-xs">
                              <Repeat className="w-3 h-3 mr-1" />
                              Récurrent
                            </Badge>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => applyTemplate(template)}
                          className="w-full"
                          size="sm"
                        >
                          Utiliser ce Modèle
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Custom Tab */}
              <TabsContent value="custom" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                          id="title"
                          value={customAppointment.title}
                          onChange={(e) => setCustomAppointment(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Titre du rendez-vous"
                          className="mt-1"
                        />
                        {getFieldError('title') && (
                          <div className="text-sm text-destructive mt-1">{getFieldError('title')}</div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="duration">Durée (minutes) *</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={customAppointment.duration}
                          onChange={(e) => setCustomAppointment(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                          min="15"
                          max="480"
                          step="15"
                          className="mt-1"
                        />
                        {getFieldError('duration') && (
                          <div className="text-sm text-destructive mt-1">{getFieldError('duration')}</div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="price">Prix (€) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={customAppointment.price}
                          onChange={(e) => setCustomAppointment(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                          min="0"
                          step="0.01"
                          className="mt-1"
                        />
                        {getFieldError('price') && (
                          <div className="text-sm text-destructive mt-1">{getFieldError('price')}</div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="maxParticipants">Participants Max</Label>
                        <Input
                          id="maxParticipants"
                          type="number"
                          value={customAppointment.maxParticipants}
                          onChange={(e) => setCustomAppointment(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                          min="1"
                          max="10"
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={customAppointment.description}
                          onChange={(e) => setCustomAppointment(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Description détaillée du rendez-vous"
                          rows={3}
                          className="mt-1"
                        />
                        {getFieldError('description') && (
                          <div className="text-sm text-destructive mt-1">{getFieldError('description')}</div>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="location">Lieu *</Label>
                        <Input
                          id="location"
                          value={customAppointment.location}
                          onChange={(e) => setCustomAppointment(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Adresse ou lieu du rendez-vous"
                          className="mt-1"
                        />
                        {getFieldError('location') && (
                          <div className="text-sm text-destructive mt-1">{getFieldError('location')}</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Recurring Options */}
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="recurring"
                          checked={customAppointment.isRecurring}
                          onCheckedChange={(checked) => setCustomAppointment(prev => ({ ...prev, isRecurring: checked }))}
                        />
                        <Label htmlFor="recurring">Rendez-vous récurrent</Label>
                      </div>
                      
                      {customAppointment.isRecurring && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                          <div>
                            <Label>Type de récurrence</Label>
                            <Select
                              value={customAppointment.recurrencePattern.type}
                              onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                                setCustomAppointment(prev => ({
                                  ...prev,
                                  recurrencePattern: { ...prev.recurrencePattern, type: value }
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Quotidien</SelectItem>
                                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                                <SelectItem value="monthly">Mensuel</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Intervalle</Label>
                            <Input
                              type="number"
                              value={customAppointment.recurrencePattern.interval}
                              onChange={(e) => setCustomAppointment(prev => ({
                                ...prev,
                                recurrencePattern: { ...prev.recurrencePattern, interval: parseInt(e.target.value) }
                              }))}
                              min="1"
                              max="12"
                            />
                          </div>
                          
                          <div>
                            <Label>Fin</Label>
                            <Input
                              type="date"
                              value={format(customAppointment.recurrencePattern.endDate, 'yyyy-MM-dd')}
                              onChange={(e) => setCustomAppointment(prev => ({
                                ...prev,
                                recurrencePattern: { ...prev.recurrencePattern, endDate: new Date(e.target.value) }
                              }))}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Create Button */}
                    <div className="mt-6">
                      <Button
                        onClick={createAppointment}
                        disabled={isLoading}
                        className="w-full"
                        size="lg"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Créer le Rendez-vous
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Conflicts Tab */}
              <TabsContent value="conflicts" className="space-y-4">
                {conflicts.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aucun conflit détecté</h3>
                      <p className="text-muted-foreground">
                        Votre rendez-vous peut être créé sans problème
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {conflicts.map((conflict, index) => (
                      <Card key={index} className={`border-l-4 ${
                        conflict.severity === 'error' ? 'border-red-500' : 'border-yellow-500'
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                              conflict.severity === 'error' ? 'text-red-500' : 'text-yellow-500'
                            }`} />
                            <div className="flex-1">
                              <h4 className="font-medium mb-2">{conflict.message}</h4>
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  Solutions suggérées :
                                </p>
                                <ul className="text-sm space-y-1">
                                  {conflict.suggestedSolutions.map((solution, idx) => (
                                    <li key={idx} className="flex items-center space-x-2">
                                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                                      <span>{solution}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Available Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Créneaux Disponibles - {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Chargement des créneaux...
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {availableSlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant={slot.isAvailable ? "outline" : "secondary"}
                    size="sm"
                    disabled={!slot.isAvailable}
                    className={`h-12 text-xs ${
                      slot.isAvailable 
                        ? 'hover:bg-primary hover:text-primary-foreground' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">{slot.startTime}</div>
                      <div className="text-xs opacity-70">{slot.endTime}</div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  )
}
