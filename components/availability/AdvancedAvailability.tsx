"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  X,
  AlertCircle,
  CheckCircle,
  Settings,
  Copy,
  RotateCcw,
  Zap,
  CalendarDays,
  Timer,
  DollarSign,
  Users,
  Star,
  TrendingUp,
  BarChart3,
  MoreHorizontal
} from "lucide-react"
import { toast } from "sonner"
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  isAvailable: boolean
  maxBookings: number
  price: number
  notes?: string
  color?: string
}

interface AvailabilitySchedule {
  id?: string
  date: Date
  isAvailable: boolean
  notes?: string
  timeSlots: TimeSlot[]
  totalBookings?: number
  revenue?: number
}

interface WeeklyTemplate {
  id: string
  name: string
  days: {
    [key: string]: {
      isAvailable: boolean
      timeSlots: TimeSlot[]
    }
  }
}

export function AdvancedAvailability() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [schedules, setSchedules] = useState<AvailabilitySchedule[]>([])
  const [currentSchedule, setCurrentSchedule] = useState<AvailabilitySchedule | null>(null)
  const [weeklyTemplates, setWeeklyTemplates] = useState<WeeklyTemplate[]>([])
  const [activeTab, setActiveTab] = useState("calendar")
  const [loading, setLoading] = useState(false)
  const [showTimeSlotEditor, setShowTimeSlotEditor] = useState(false)
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null)
  const [quickAddMode, setQuickAddMode] = useState(false)
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])

  // Quick time slot templates
  const quickTemplates = [
    { name: "Morning (9AM-12PM)", start: "09:00", end: "12:00", price: 80 },
    { name: "Afternoon (1PM-5PM)", start: "13:00", end: "17:00", price: 100 },
    { name: "Evening (6PM-9PM)", start: "18:00", end: "21:00", price: 120 },
    { name: "Full Day (9AM-6PM)", start: "09:00", end: "18:00", price: 200 },
  ]

  // Generate week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [selectedDate])

  useEffect(() => {
    fetchAvailabilityData()
    fetchWeeklyTemplates()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      const existingSchedule = schedules.find(s => isSameDay(s.date, selectedDate))
      setCurrentSchedule(existingSchedule || {
        date: selectedDate,
        isAvailable: true,
        timeSlots: [],
        notes: ""
      })
    }
  }, [selectedDate, schedules])

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pro/availability/schedule?startDate=${format(startOfWeek(selectedDate), 'yyyy-MM-dd')}&endDate=${format(endOfWeek(selectedDate), 'yyyy-MM-dd')}`)
      const data = await response.json()
      
      if (data.availability) {
        setSchedules(data.availability.map((item: any) => ({
          ...item,
          date: parseISO(item.date)
        })))
      }
    } catch (error) {
      console.error("Error fetching availability:", error)
      toast.error("Failed to load availability data")
    } finally {
      setLoading(false)
    }
  }

  const fetchWeeklyTemplates = async () => {
    try {
      // This would fetch from your API
      const mockTemplates: WeeklyTemplate[] = [
        {
          id: "1",
          name: "Standard Week",
          days: {
            monday: { 
              isAvailable: true, 
              timeSlots: quickTemplates.slice(0, 2).map(t => ({ 
                id: Math.random().toString(),
                startTime: t.start,
                endTime: t.end,
                isAvailable: true,
                maxBookings: 1,
                price: t.price,
                notes: ""
              })) 
            },
            tuesday: { 
              isAvailable: true, 
              timeSlots: quickTemplates.slice(0, 2).map(t => ({ 
                id: Math.random().toString(),
                startTime: t.start,
                endTime: t.end,
                isAvailable: true,
                maxBookings: 1,
                price: t.price,
                notes: ""
              })) 
            },
            wednesday: { 
              isAvailable: true, 
              timeSlots: quickTemplates.slice(0, 2).map(t => ({ 
                id: Math.random().toString(),
                startTime: t.start,
                endTime: t.end,
                isAvailable: true,
                maxBookings: 1,
                price: t.price,
                notes: ""
              })) 
            },
            thursday: { 
              isAvailable: true, 
              timeSlots: quickTemplates.slice(0, 2).map(t => ({ 
                id: Math.random().toString(),
                startTime: t.start,
                endTime: t.end,
                isAvailable: true,
                maxBookings: 1,
                price: t.price,
                notes: ""
              })) 
            },
            friday: { 
              isAvailable: true, 
              timeSlots: quickTemplates.slice(0, 2).map(t => ({ 
                id: Math.random().toString(),
                startTime: t.start,
                endTime: t.end,
                isAvailable: true,
                maxBookings: 1,
                price: t.price,
                notes: ""
              })) 
            },
            saturday: { isAvailable: false, timeSlots: [] },
            sunday: { isAvailable: false, timeSlots: [] }
          }
        }
      ]
      setWeeklyTemplates(mockTemplates)
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  const saveSchedule = async () => {
    if (!currentSchedule) return

    try {
      setLoading(true)
      const response = await fetch("/api/pro/availability/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(currentSchedule.date, 'yyyy-MM-dd'),
          timeSlots: currentSchedule.timeSlots,
          isAvailable: currentSchedule.isAvailable,
          notes: currentSchedule.notes
        })
      })

      if (response.ok) {
        toast.success("Availability saved successfully")
        fetchAvailabilityData()
      } else {
        toast.error("Failed to save availability")
      }
    } catch (error) {
      console.error("Error saving schedule:", error)
      toast.error("Failed to save availability")
    } finally {
      setLoading(false)
    }
  }

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: Math.random().toString(),
      startTime: "09:00",
      endTime: "10:00",
      isAvailable: true,
      maxBookings: 1,
      price: 80,
      notes: "",
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }
    
    setCurrentSchedule(prev => prev ? {
      ...prev,
      timeSlots: [...prev.timeSlots, newSlot]
    } : null)
  }

  const updateTimeSlot = (id: string, updates: Partial<TimeSlot>) => {
    setCurrentSchedule(prev => prev ? {
      ...prev,
      timeSlots: prev.timeSlots.map(slot => 
        slot.id === id ? { ...slot, ...updates } : slot
      )
    } : null)
  }

  const removeTimeSlot = (id: string) => {
    setCurrentSchedule(prev => prev ? {
      ...prev,
      timeSlots: prev.timeSlots.filter(slot => slot.id !== id)
    } : null)
  }

  const duplicateTimeSlot = (timeSlot: TimeSlot) => {
    const newSlot: TimeSlot = {
      ...timeSlot,
      id: Math.random().toString(),
      startTime: addMinutes(parseISO(`2000-01-01T${timeSlot.endTime}`), 30).toTimeString().slice(0, 5),
      endTime: addMinutes(parseISO(`2000-01-01T${timeSlot.endTime}`), 90).toTimeString().slice(0, 5)
    }
    
    setCurrentSchedule(prev => prev ? {
      ...prev,
      timeSlots: [...prev.timeSlots, newSlot]
    } : null)
  }

  const applyWeeklyTemplate = (template: WeeklyTemplate) => {
    const dayName = format(selectedDate, 'EEEE').toLowerCase()
    const dayData = template.days[dayName]
    
    if (dayData) {
      setCurrentSchedule(prev => prev ? {
        ...prev,
        isAvailable: dayData.isAvailable,
        timeSlots: dayData.timeSlots.map(slot => ({
          ...slot,
          id: Math.random().toString(),
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        }))
      } : null)
      toast.success(`Applied ${template.name} template`)
    }
  }

  const quickAddTimeSlots = (template: typeof quickTemplates[0]) => {
    const newSlot: TimeSlot = {
      id: Math.random().toString(),
      startTime: template.start,
      endTime: template.end,
      isAvailable: true,
      maxBookings: 1,
      price: template.price,
      notes: "",
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }
    
    setCurrentSchedule(prev => prev ? {
      ...prev,
      timeSlots: [...prev.timeSlots, newSlot]
    } : null)
    
    toast.success(`Added ${template.name} time slot`)
  }

  const bulkEditDates = () => {
    if (selectedDates.length === 0) {
      toast.error("Please select dates to edit")
      return
    }

    // Apply current schedule to all selected dates
    selectedDates.forEach(date => {
      if (currentSchedule) {
        const schedule: AvailabilitySchedule = {
          date,
          isAvailable: currentSchedule.isAvailable,
          notes: currentSchedule.notes,
          timeSlots: currentSchedule.timeSlots.map(slot => ({
            ...slot,
            id: Math.random().toString()
          }))
        }
        
        setSchedules(prev => {
          const filtered = prev.filter(s => !isSameDay(s.date, date))
          return [...filtered, schedule]
        })
      }
    })

    toast.success(`Applied schedule to ${selectedDates.length} dates`)
    setSelectedDates([])
    setBulkEditMode(false)
  }

  const getDateStatus = (date: Date) => {
    const schedule = schedules.find(s => isSameDay(s.date, date))
    if (!schedule) return "unset"
    if (!schedule.isAvailable) return "unavailable"
    if (schedule.timeSlots.length === 0) return "no-slots"
    return "available"
  }

  const getDateColor = (date: Date) => {
    const status = getDateStatus(date)
    switch (status) {
      case "available": return "bg-green-100 text-green-800 border-green-200"
      case "unavailable": return "bg-red-100 text-red-800 border-red-200"
      case "no-slots": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getDateIcon = (date: Date) => {
    const status = getDateStatus(date)
    switch (status) {
              case "available": return <CheckCircle className="w-4 h-4" />
      case "unavailable": return <X className="w-4 h-4" />
      case "no-slots": return <AlertCircle className="w-4 h-4" />
      default: return <CalendarDays className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Availability Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your schedule, time slots, and availability preferences
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => setBulkEditMode(!bulkEditMode)}>
            <Copy className="w-4 h-4 mr-2" />
            Bulk Edit
          </Button>
          <Button onClick={saveSchedule} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Template</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          {/* Week Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Week Overview</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, -7))}
                  >
                    Previous Week
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, 7))}
                  >
                    Next Week
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95",
                      getDateColor(day),
                      isSameDay(day, selectedDate) && "ring-2 ring-blue-500 ring-offset-2"
                    )}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {format(day, 'EEE')}
                      </div>
                      <div className="text-lg font-bold">
                        {format(day, 'd')}
                      </div>
                      <div className="flex justify-center mt-1">
                        {getDateIcon(day)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Daily Schedule Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                  disabled={(date) => {
                    // Empêcher la sélection de dates/heures antérieures à l'heure + 1 minute
                    const oneHourFromNow = new Date()
                    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1, oneHourFromNow.getMinutes() + 1, 0, 0)
                    return date < oneHourFromNow
                  }}
                />
              </CardContent>
            </Card>

            {/* Schedule Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Schedule for {format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="available"
                      checked={currentSchedule?.isAvailable ?? true}
                      onCheckedChange={(checked) => setCurrentSchedule(prev => prev ? { ...prev, isAvailable: checked } : null)}
                    />
                    <Label htmlFor="available">Available</Label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes for this day..."
                    value={currentSchedule?.notes || ""}
                    onChange={(e) => setCurrentSchedule(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  />
                </div>

                {/* Quick Add Templates */}
                <div>
                  <Label>Quick Add Time Slots</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {quickTemplates.map((template) => (
                      <Button
                        key={template.name}
                        variant="outline"
                        size="sm"
                        onClick={() => quickAddTimeSlots(template)}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Time Slots</Label>
                    <Button onClick={addTimeSlot} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Slot
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {currentSchedule?.timeSlots.map((timeSlot, index) => (
                      <div
                        key={timeSlot.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 transition-all duration-200 hover:shadow-md"
                        style={{
                          animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: timeSlot.color }}
                        />
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <Input
                            type="time"
                            value={timeSlot.startTime}
                            onChange={(e) => updateTimeSlot(timeSlot.id, { startTime: e.target.value })}
                            className="text-sm"
                          />
                          <Input
                            type="time"
                            value={timeSlot.endTime}
                            onChange={(e) => updateTimeSlot(timeSlot.id, { endTime: e.target.value })}
                            className="text-sm"
                          />
                          <Input
                            type="number"
                            placeholder="Price"
                            value={timeSlot.price}
                            onChange={(e) => updateTimeSlot(timeSlot.id, { price: parseFloat(e.target.value) || 0 })}
                            className="text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateTimeSlot(timeSlot)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(timeSlot.id)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeklyTemplates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{template.name}</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyWeeklyTemplate(template)}
                      >
                        Apply
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(template.days).map(([day, data]) => (
                        <div key={day} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{day}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant={data.isAvailable ? "default" : "secondary"}>
                              {data.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                            {data.isAvailable && (
                              <span className="text-gray-500">
                                {data.timeSlots.length} slots
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Available Days</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {schedules.filter(s => s.isAvailable).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Time Slots</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {schedules.reduce((acc, s) => acc + s.timeSlots.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +15.3% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{schedules.reduce((acc, s) => acc + s.timeSlots.reduce((sum, ts) => sum + ts.price, 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Availability Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-block weekends</Label>
                  <p className="text-sm text-gray-500">Automatically mark weekends as unavailable</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Business hours only</Label>
                  <p className="text-sm text-gray-500">Restrict time slots to business hours (9AM-6PM)</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Buffer time between appointments</Label>
                  <p className="text-sm text-gray-500">Add 15-minute buffer between time slots</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// Helper function to add minutes to a time string
function addMinutes(time: Date, minutes: number): Date {
  return new Date(time.getTime() + minutes * 60000)
}
