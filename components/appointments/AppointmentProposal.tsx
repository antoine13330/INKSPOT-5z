"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Euro, 
  FileText,
  Send,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { AppointmentType } from '@/types'

interface AppointmentProposalProps {
  conversationId: string
  proId: string
  clientId: string
  postId?: string
  onClose: () => void
  onProposalSent: (proposal: any) => void
  inline?: boolean
}

const APPOINTMENT_TYPES: { value: AppointmentType; label: string; icon: string }[] = [
  { value: 'TATTOO', label: 'Tatouage', icon: '🎨' },
  { value: 'PIERCING', label: 'Piercing', icon: '💎' },
  { value: 'CONSULTATION', label: 'Consultation', icon: '💬' },
  { value: 'COVER_UP', label: 'Cover-up', icon: '🔄' },
  { value: 'TOUCH_UP', label: 'Retouche', icon: '✨' },
  { value: 'CUSTOM_DESIGN', label: 'Design personnalisé', icon: '✏️' },
  { value: 'OTHER', label: 'Autre', icon: '🔧' }
]

export function AppointmentProposal({ 
  conversationId, 
  proId, 
  clientId, 
  postId, 
  onClose, 
  onProposalSent,
  inline = false,
}: AppointmentProposalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    type: '' as AppointmentType,
    title: '',
    description: '',
    duration: 60,
    price: 0,
    currency: 'EUR',
    location: '',
    requirements: [] as string[],
    notes: '',
    proposedDates: [] as Date[],
    selectedTimes: {} as Record<string, string>,
    depositRequired: false,
    depositAmount: 0
  })
  const [loading, setLoading] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 4 }, (_, i) => currentYear + i)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    
    // Empêcher la sélection de dates/heures antérieures à l'heure + 1 minute
    const oneHourFromNow = new Date()
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1, oneHourFromNow.getMinutes() + 1, 0, 0)
    
    if (date < oneHourFromNow) {
      toast.error('Impossible de sélectionner une date/heure antérieure à l\'heure + 1 minute')
      return
    }
    
    setFormData(prev => {
      const dates = [...prev.proposedDates]
      const dateStr = date.toISOString().split('T')[0]
      
      if (dates.some(d => d.toISOString().split('T')[0] === dateStr)) {
        // Remove date if already selected
        return {
          ...prev,
          proposedDates: dates.filter(d => d.toISOString().split('T')[0] !== dateStr),
          selectedTimes: Object.fromEntries(
            Object.entries(prev.selectedTimes).filter(([k]) => k !== dateStr)
          ),
        }
      } else {
        // Add date
        return {
          ...prev,
          proposedDates: [...dates, date]
        }
      }
    })
  }

  const handleTimeChange = (dateKey: string, time: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTimes: {
        ...prev.selectedTimes,
        [dateKey]: time,
      }
    }))
  }

  const generateTimeSlots = (start: string, end: string, intervalMinutes: number) => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    const startTotal = startH * 60 + startM
    const endTotal = endH * 60 + endM
    const slots: string[] = []
    for (let m = startTotal; m <= endTotal; m += intervalMinutes) {
      const h = Math.floor(m / 60)
      const mm = m % 60
      const hStr = String(h).padStart(2, '0')
      const mStr = String(mm).padStart(2, '0')
      slots.push(`${hStr}:${mStr}`)
    }
    return slots
  }
  const TIME_SLOTS = generateTimeSlots('08:00', '20:00', 15)

  const handleRequirementChange = (requirement: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      requirements: checked 
        ? [...prev.requirements, requirement]
        : prev.requirements.filter(r => r !== requirement)
    }))
  }

  const validateForm = () => {
    if (!formData.type) {
      toast.error('Veuillez sélectionner un type de rendez-vous')
      return false
    }
    if (!formData.title.trim()) {
      toast.error('Veuillez saisir un titre')
      return false
    }
    if (!formData.description.trim()) {
      toast.error('Veuillez saisir une description')
      return false
    }
    if (formData.price <= 0) {
      toast.error('Veuillez saisir un prix valide')
      return false
    }
    if (formData.proposedDates.length === 0) {
      toast.error('Veuillez sélectionner au moins une date')
      return false
    }
    
    // Vérifier qu'aucune date/heure n'est antérieure à l'heure + 1 minute
    const oneHourFromNow = new Date()
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1, oneHourFromNow.getMinutes() + 1, 0, 0)
    
    const hasInvalidDate = formData.proposedDates.some(date => date < oneHourFromNow)
    if (hasInvalidDate) {
      toast.error('Impossible de sélectionner une date/heure antérieure à l\'heure + 1 minute')
      return false
    }
    
    const missingTimes = formData.proposedDates.some(d => {
      const key = d.toISOString().split('T')[0]
      return !formData.selectedTimes[key]
    })
    if (missingTimes) {
      toast.error('Veuillez sélectionner une heure pour chaque date')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/appointments/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          proId,
          clientId,
          postId,
          ...formData,
          proposedDates: formData.proposedDates.map(d => {
            const key = d.toISOString().split('T')[0]
            const time = formData.selectedTimes[key]
            const dateWithTime = new Date(d)
            if (time) {
              const [h, m] = time.split(':').map(Number)
              dateWithTime.setHours(h, m, 0, 0)
            } else {
              dateWithTime.setHours(12, 0, 0, 0)
            }
            return dateWithTime.toISOString()
          })
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Proposition de rendez-vous envoyée !')
        onProposalSent(data.proposal)
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erreur lors de l\'envoi')
      }
    } catch (error) {
      console.error('Error sending proposal:', error)
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && (!formData.type || !formData.title || !formData.description)) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (step === 2 && formData.price <= 0) {
      toast.error('Veuillez saisir un prix valide')
      return
    }
    setStep(prev => Math.min(prev + 1, 3))
  }

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  const content = (
    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Proposer un rendez-vous
        </CardTitle>
        {!inline && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center mb-6 w-full">
            {[1, 2, 3].map((stepNumber, idx) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber <= step 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNumber}
                </div>
                {idx < 2 && (
                  <div className={`h-0.5 mx-2 flex-1 ${
                    stepNumber < step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type de rendez-vous *</label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          {type.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Titre *</label>
                <Input
                  placeholder="Ex: Tatouage fleur de lotus"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description *</label>
                <Textarea
                  placeholder="Décrivez votre projet en détail..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Durée (minutes)</label>
                  <Input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium mb-2 block">Lieu</label>
                  <AddressAutocomplete
                    value={formData.location}
                    onChange={(val) => handleInputChange('location', val)}
                    placeholder="Adresse du studio (API Adresse)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pricing, Deposit & Requirements */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Prix *</label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        €
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Devise</label>
                    <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 mt-6 md:mt-0">
                    <input
                      type="checkbox"
                      id="deposit"
                      checked={formData.depositRequired}
                      onChange={(e) => handleInputChange('depositRequired', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="deposit" className="text-sm">Acompte requis</label>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Montant de l'acompte</label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        max={formData.price}
                        step="0.01"
                        value={formData.depositAmount}
                        onChange={(e) => handleInputChange('depositAmount', parseFloat(e.target.value))}
                        disabled={!formData.depositRequired}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        €
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Prérequis</label>
                <div className="space-y-2">
                  {[
                    'Être majeur',
                    'Pas de tatouage récent dans la zone',
                    'Préparation de la peau 24h avant',
                    'Éviter l\'alcool 24h avant',
                    'Apporter une pièce d\'identité'
                  ].map((req) => (
                    <label key={req} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.requirements.includes(req)}
                        onChange={(e) => handleRequirementChange(req, e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">{req}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Notes supplémentaires</label>
                <Textarea
                  placeholder="Informations complémentaires..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Date & Time Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sélectionnez les dates et heures disponibles *</label>
                
                <div className="rounded-md border bg-background p-3">
                  {/* Month and Year Selectors - Integrated in calendar */}
                  <div className="flex gap-2 mb-4 justify-center">
                    <Select 
                      value={calendarMonth.getMonth().toString()} 
                      onValueChange={(value) => {
                        const newMonth = new Date(calendarMonth)
                        newMonth.setMonth(parseInt(value))
                        setCalendarMonth(newMonth)
                      }}
                    >
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={calendarMonth.getFullYear().toString()} 
                      onValueChange={(value) => {
                        const newMonth = new Date(calendarMonth)
                        newMonth.setFullYear(parseInt(value))
                        setCalendarMonth(newMonth)
                      }}
                    >
                      <SelectTrigger className="w-20 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Calendar
                    mode="multiple"
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    selected={formData.proposedDates}
                    onSelect={(dates) => {
                      if (dates) {
                        // Filtrer les dates pour ne garder que celles à partir de l'heure + 1 minute
                        const oneHourFromNow = new Date()
                        oneHourFromNow.setHours(oneHourFromNow.getHours() + 1, oneHourFromNow.getMinutes() + 1, 0, 0)
                        
                        const validDates = dates.filter(date => date >= oneHourFromNow)
                        
                        if (validDates.length !== dates.length) {
                          toast.error('Certaines dates sélectionnées sont antérieures à l\'heure + 1 minute et ont été ignorées')
                        }
                        
                        setFormData(prev => ({ ...prev, proposedDates: validDates }))
                      }
                    }}
                    className="border-0 p-0"
                    showOutsideDays={false}
                    fromDate={(() => {
                      const oneHourFromNow = new Date()
                      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1, oneHourFromNow.getMinutes() + 1, 0, 0)
                      return oneHourFromNow
                    })()}
                    hideNavigation
                  />
                </div>
              </div>

              {formData.proposedDates.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Dates sélectionnées</label>
                  <div className="flex flex-wrap gap-2">
                    {formData.proposedDates.map((date, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {date.toLocaleDateString('fr-FR', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                        <button
                          onClick={() => handleDateSelect(date)}
                          className="ml-1 hover:text-destructive"
                          title="Retirer cette date"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.proposedDates.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Sélectionnez une heure pour chaque date *</label>
                  <div className="space-y-3">
                    {formData.proposedDates.map((date, index) => {
                      const dateKey = date.toISOString().split('T')[0]
                      return (
                        <div key={index} className="grid grid-cols-2 gap-3 items-center">
                          <div className="text-sm">
                            {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </div>
                          <div>
                            <Select value={formData.selectedTimes[dateKey] || ''} onValueChange={(val) => handleTimeChange(dateKey, val)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir une heure" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_SLOTS.map((t) => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            Précédent
          </Button>

          {step < 3 ? (
            <Button onClick={nextStep}>
              Suivant
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer la proposition'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  if (inline) {
    return content
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {content}
    </div>
  )
}
