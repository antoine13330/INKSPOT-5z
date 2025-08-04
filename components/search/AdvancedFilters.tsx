"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CalendarIcon, ChevronDownIcon, FilterIcon, MapPinIcon, StarIcon, XIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { AdvancedSearchFilters } from "@/app/api/search/advanced/route"

interface AdvancedFiltersProps {
  filters: AdvancedSearchFilters
  onFiltersChange: (filters: AdvancedSearchFilters) => void
  onSearch: () => void
  onReset: () => void
  isLoading?: boolean
}

const SPECIALTIES_OPTIONS = [
  "Photography", "Videography", "Graphic Design", "Web Design", "UI/UX Design",
  "Copywriting", "Content Creation", "Social Media", "Marketing", "SEO",
  "Music Production", "Audio Engineering", "Voice Over", "Translation",
  "Consulting", "Coaching", "Teaching", "Programming", "Data Analysis"
]

const LOCATION_OPTIONS = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg",
  "Montpellier", "Bordeaux", "Lille", "London", "Berlin", "Madrid", "Rome",
  "Amsterdam", "Brussels", "Zurich", "Geneva", "Barcelona", "Milan"
]

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onSearch,
  onReset,
  isLoading = false
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(filters.specialties || [])
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(filters.hashtags || [])
  const [newHashtag, setNewHashtag] = useState("")
  const [hourlyRange, setHourlyRange] = useState<[number, number]>([
    filters.minHourlyRate || 0,
    filters.maxHourlyRate || 200
  ])
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined
  )

  useEffect(() => {
    setSelectedSpecialties(filters.specialties || [])
    setSelectedHashtags(filters.hashtags || [])
    setHourlyRange([filters.minHourlyRate || 0, filters.maxHourlyRate || 200])
    setDateFrom(filters.dateFrom ? new Date(filters.dateFrom) : undefined)
    setDateTo(filters.dateTo ? new Date(filters.dateTo) : undefined)
  }, [filters])

  const updateFilters = (updates: Partial<AdvancedSearchFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const addSpecialty = (specialty: string) => {
    if (!selectedSpecialties.includes(specialty)) {
      const newSpecialties = [...selectedSpecialties, specialty]
      setSelectedSpecialties(newSpecialties)
      updateFilters({ specialties: newSpecialties })
    }
  }

  const removeSpecialty = (specialty: string) => {
    const newSpecialties = selectedSpecialties.filter(s => s !== specialty)
    setSelectedSpecialties(newSpecialties)
    updateFilters({ specialties: newSpecialties })
  }

  const addHashtag = () => {
    if (newHashtag.trim() && !selectedHashtags.includes(newHashtag.trim())) {
      const hashtag = newHashtag.trim().startsWith('#') ? newHashtag.trim() : `#${newHashtag.trim()}`
      const newHashtags = [...selectedHashtags, hashtag]
      setSelectedHashtags(newHashtags)
      updateFilters({ hashtags: newHashtags })
      setNewHashtag("")
    }
  }

  const removeHashtag = (hashtag: string) => {
    const newHashtags = selectedHashtags.filter(h => h !== hashtag)
    setSelectedHashtags(newHashtags)
    updateFilters({ hashtags: newHashtags })
  }

  const handleHourlyRangeChange = (values: [number, number]) => {
    setHourlyRange(values)
    updateFilters({
      minHourlyRate: values[0],
      maxHourlyRate: values[1]
    })
  }

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date)
    updateFilters({ dateFrom: date?.toISOString() })
  }

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date)
    updateFilters({ dateTo: date?.toISOString() })
  }

  const resetAllFilters = () => {
    setSelectedSpecialties([])
    setSelectedHashtags([])
    setNewHashtag("")
    setHourlyRange([0, 200])
    setDateFrom(undefined)
    setDateTo(undefined)
    onReset()
  }

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value.trim() !== ''
    if (typeof value === 'number') return value > 0
    return false
  }).length

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FilterIcon className="w-5 h-5" />
            <span>Advanced Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDownIcon 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </Button>
        </CardTitle>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Content Type */}
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select
                  value={filters.contentType || "both"}
                  onValueChange={(value) => updateFilters({ contentType: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Posts & Users</SelectItem>
                    <SelectItem value="posts">Posts Only</SelectItem>
                    <SelectItem value="users">Users Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Type */}
              <div className="space-y-2">
                <Label>User Type</Label>
                <Select
                  value={filters.userType || ""}
                  onValueChange={(value) => updateFilters({ userType: value as any || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="CLIENT">Clients</SelectItem>
                    <SelectItem value="PRO">Professionals</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={filters.sortBy || "relevance"}
                  onValueChange={(value) => updateFilters({ sortBy: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Location & Geographic Filters */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <MapPinIcon className="w-4 h-4 mr-2" />
                Location & Geographic
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select
                    value={filters.location || ""}
                    onValueChange={(value) => updateFilters({ location: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Location</SelectItem>
                      {LOCATION_OPTIONS.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Search Radius (km)</Label>
                  <Input
                    type="number"
                    value={filters.radius || 50}
                    onChange={(e) => updateFilters({ radius: Number(e.target.value) })}
                    placeholder="50"
                    min="1"
                    max="500"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Specialties */}
            <div className="space-y-4">
              <h4 className="font-medium">Specialties & Skills</h4>
              <div className="space-y-3">
                <Select onValueChange={addSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES_OPTIONS
                      .filter(specialty => !selectedSpecialties.includes(specialty))
                      .map(specialty => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedSpecialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedSpecialties.map(specialty => (
                      <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                        {specialty}
                        <XIcon
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeSpecialty(specialty)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Hashtags */}
            <div className="space-y-4">
              <h4 className="font-medium">Hashtags</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    placeholder="Add hashtag"
                    onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                  />
                  <Button onClick={addHashtag} size="sm">
                    Add
                  </Button>
                </div>
                {selectedHashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedHashtags.map(hashtag => (
                      <Badge key={hashtag} variant="outline" className="flex items-center gap-1">
                        {hashtag}
                        <XIcon
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeHashtag(hashtag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Price Range */}
            <div className="space-y-4">
              <h4 className="font-medium">Hourly Rate (€)</h4>
              <div className="space-y-4">
                <Slider
                  value={hourlyRange}
                  onValueChange={handleHourlyRangeChange}
                  max={200}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>€{hourlyRange[0]}/hour</span>
                  <span>€{hourlyRange[1]}/hour</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Date Range */}
            <div className="space-y-4">
              <h4 className="font-medium">Date Range</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={handleDateFromChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={handleDateToChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Filters */}
            <div className="space-y-4">
              <h4 className="font-medium">Additional Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={filters.verified || false}
                    onCheckedChange={(checked) => updateFilters({ verified: !!checked })}
                  />
                  <Label htmlFor="verified" className="flex items-center">
                    <StarIcon className="w-4 h-4 mr-1" />
                    Verified only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPortfolio"
                    checked={filters.hasPortfolio || false}
                    onCheckedChange={(checked) => updateFilters({ hasPortfolio: !!checked })}
                  />
                  <Label htmlFor="hasPortfolio">Has Portfolio</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Active in last (days)</Label>
                  <Input
                    type="number"
                    value={filters.activeInDays || ""}
                    onChange={(e) => updateFilters({ 
                      activeInDays: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    placeholder="30"
                    min="1"
                    max="365"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Engagement</Label>
                  <Input
                    type="number"
                    value={filters.minEngagement || ""}
                    onChange={(e) => updateFilters({ 
                      minEngagement: e.target.value ? Number(e.target.value) : undefined 
                    })}
                    placeholder="10"
                    min="1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={onSearch} disabled={isLoading} className="flex-1">
                {isLoading ? "Searching..." : "Apply Filters"}
              </Button>
              <Button variant="outline" onClick={resetAllFilters} className="flex-1">
                Reset All
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}