"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Star, 
  Euro, 
  Users, 
  Clock,
  TrendingUp,
  History,
  Bookmark,
  Zap,
  Settings,
  X,
  ArrowRight,
  RefreshCw,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { format, subDays, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { useFormValidation } from '@/components/ui/form-validation'
import { debounce } from '@/lib/utils'

interface SearchFilters {
  location: string
  radius: number
  priceRange: [number, number]
  rating: number
  availability: string[]
  services: string[]
  experience: number
  languages: string[]
  specializations: string[]
  verified: boolean
  instantBooking: boolean
  virtualConsultation: boolean
}

interface SearchResult {
  id: string
  type: 'professional' | 'service' | 'post' | 'event'
  title: string
  description: string
  image?: string
  rating: number
  reviewCount: number
  price?: number
  location: string
  distance: number
  availability: string[]
  tags: string[]
  verified: boolean
  instantBooking: boolean
  virtualConsultation: boolean
  lastActive: Date
  relevanceScore: number
}

interface SearchAnalytics {
  totalSearches: number
  averageResults: number
  popularQueries: Array<{
    query: string
    count: number
    trend: 'up' | 'down' | 'stable'
  }>
  searchPerformance: {
    averageResponseTime: number
    cacheHitRate: number
    errorRate: number
  }
  userBehavior: {
    clickThroughRate: number
    averageSessionDuration: number
    bounceRate: number
  }
}

interface SearchSuggestion {
  text: string
  type: 'query' | 'filter' | 'trending' | 'recent'
  relevance: number
  metadata?: Record<string, any>
}

interface IntelligentSearchSystemProps {
  onSearch: (query: string, filters: SearchFilters) => Promise<SearchResult[]>
  onResultClick: (result: SearchResult) => void
  onFilterChange: (filters: SearchFilters) => void
  className?: string
}

export function IntelligentSearchSystem({
  onSearch,
  onResultClick,
  onFilterChange,
  className = ""
}: IntelligentSearchSystemProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    radius: 25,
    priceRange: [0, 500],
    rating: 0,
    availability: [],
    services: [],
    experience: 0,
    languages: [],
    specializations: [],
    verified: false,
    instantBooking: false,
    virtualConsultation: false
  })
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState('results')
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [savedSearches, setSavedSearches] = useState<Array<{ name: string; query: string; filters: SearchFilters }>>([])
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchMode, setSearchMode] = useState<'instant' | 'manual'>('instant')
  const [error, setError] = useState<string | null>(null)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Form validation
  const { validateField, getFieldError, hasErrors } = useFormValidation(
    { searchQuery: '' },
    {
      rules: [
        { type: 'required', message: 'La recherche est requise' },
        { type: 'minLength', value: 2, message: 'La recherche doit contenir au moins 2 caractères' },
        { type: 'maxLength', value: 100, message: 'La recherche ne peut pas dépasser 100 caractères' }
      ]
    }
  )

  // Load search history and saved searches
  useEffect(() => {
    loadSearchHistory()
    loadSavedSearches()
    loadSearchAnalytics()
  }, [])

  // Load search history from localStorage
  const loadSearchHistory = () => {
    try {
      const history = localStorage.getItem('searchHistory')
      if (history) {
        setSearchHistory(JSON.parse(history))
      }
    } catch (error) {
      console.error('Error loading search history:', error)
    }
  }

  // Save search to history
  const saveToHistory = (query: string) => {
    try {
      const newHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 10)
      setSearchHistory(newHistory)
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))
    } catch (error) {
      console.error('Error saving search history:', error)
    }
  }

  // Load saved searches
  const loadSavedSearches = () => {
    try {
      const saved = localStorage.getItem('savedSearches')
      if (saved) {
        setSavedSearches(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading saved searches:', error)
    }
  }

  // Save current search
  const saveCurrentSearch = () => {
    const name = prompt('Nom pour cette recherche sauvegardée:')
    if (name && searchQuery) {
      const newSavedSearch = { name, query: searchQuery, filters }
      const updatedSearches = [...savedSearches, newSavedSearch]
      setSavedSearches(updatedSearches)
      localStorage.setItem('savedSearches', JSON.stringify(updatedSearches))
      toast.success('Recherche sauvegardée')
    }
  }

  // Load saved search
  const loadSavedSearch = (savedSearch: { name: string; query: string; filters: SearchFilters }) => {
    setSearchQuery(savedSearch.query)
    setFilters(savedSearch.filters)
    performSearch(savedSearch.query, savedSearch.filters)
  }

  // Load search analytics
  const loadSearchAnalytics = async () => {
    try {
      const response = await fetch('/api/search/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading search analytics:', error)
    }
  }

  // Generate search suggestions
  const generateSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
    }
  }, [])

  // Debounced suggestion generation
  const debouncedGenerateSuggestions = useMemo(
    () => debounce(generateSuggestions as (...args: unknown[]) => unknown, 300),
    [generateSuggestions]
  )

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setError(null)
    
    if (searchMode === 'instant' && value.length >= 2) {
      debouncedGenerateSuggestions(value)
      
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      
      // Set new timeout for instant search
      searchTimeoutRef.current = setTimeout(() => {
        if (value.trim()) {
          performSearch(value, filters)
        }
      }, 500)
    }
  }

  // Perform search
  const performSearch = async (query: string, searchFilters: SearchFilters) => {
    if (!query.trim()) return

    try {
      setIsSearching(true)
      setError(null)
      
      // Validate search query
      const validation = await validateField('searchQuery', query)
      if (!validation.isValid) {
        setError(validation.errors[0])
        return
      }

      const searchResults = await onSearch(query, searchFilters)
      setResults(searchResults)
      saveToHistory(query)
      
      // Update filters
      onFilterChange(searchFilters)
      
      // Track search analytics
      trackSearchAnalytics(query, searchResults.length)
      
    } catch (error) {
      setError('Erreur lors de la recherche')
      toast.error('Erreur lors de la recherche')
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      performSearch(searchQuery, filters)
    }
  }

  // Track search analytics
  const trackSearchAnalytics = async (query: string, resultCount: number) => {
    try {
      await fetch('/api/search/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          resultCount,
          filters,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Error tracking search analytics:', error)
    }
  }

  // Update filters
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    
    if (searchMode === 'instant' && searchQuery.trim()) {
      performSearch(searchQuery, updatedFilters)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    const defaultFilters: SearchFilters = {
      location: "",
      radius: 25,
      priceRange: [0, 500],
      rating: 0,
      availability: [],
      services: [],
      experience: 0,
      languages: [],
      specializations: [],
      verified: false,
      instantBooking: false,
      virtualConsultation: false
    }
    setFilters(defaultFilters)
    
    if (searchQuery.trim()) {
      performSearch(searchQuery, defaultFilters)
    }
  }

  // Get suggestion icon
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'query': return <Search className="w-4 h-4" />
      case 'filter': return <Filter className="w-4 h-4" />
      case 'trending': return <TrendingUp className="w-4 h-4" />
      case 'recent': return <History className="w-4 h-4" />
      default: return <Search className="w-4 h-4" />
    }
  }

  // Get result type badge
  const getResultTypeBadge = (type: string) => {
    const badges = {
      professional: { label: 'Pro', variant: 'default' as const },
      service: { label: 'Service', variant: 'secondary' as const },
      post: { label: 'Post', variant: 'outline' as const },
      event: { label: 'Événement', variant: 'destructive' as const }
    }
    return badges[type as keyof typeof badges] || badges.post
  }

  // Format distance
  const formatDistance = (distance: number) => {
    if (distance < 1) return `${Math.round(distance * 1000)}m`
    return `${distance.toFixed(1)}km`
  }

  // Format last active
  const formatLastActive = (date: Date) => {
    if (isToday(date)) return "Aujourd'hui"
    if (isYesterday(date)) return "Hier"
    return format(date, 'dd/MM/yyyy', { locale: fr })
  }

  return (
    <ErrorBoundary>
      <div className={`space-y-6 ${className}`}>
        {/* Search Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Système de Recherche Intelligent</span>
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres Avancés
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchMode(searchMode === 'instant' ? 'manual' : 'instant')}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {searchMode === 'instant' ? 'Instantané' : 'Manuel'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Rechercher des professionnels, services, posts..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-20 h-12 text-lg"
                  disabled={isSearching}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!searchQuery.trim() || isSearching}
                    className="h-8"
                  >
                    Rechercher
                  </Button>
                </div>
              </div>

              {/* Search Suggestions */}
              {suggestions.length > 0 && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion.text)
                        setSuggestions([])
                        if (searchMode === 'instant') {
                          performSearch(suggestion.text, filters)
                        }
                      }}
                      className="w-full p-3 text-left hover:bg-muted flex items-center space-x-3 transition-colors"
                    >
                      {getSuggestionIcon(suggestion.type)}
                      <span className="flex-1">{suggestion.text}</span>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-2 text-sm text-destructive flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
            </form>

            {/* Quick Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={saveCurrentSearch}
                  disabled={!searchQuery}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4 mr-2" />
                  Effacer Filtres
                </Button>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>Mode: {searchMode === 'instant' ? 'Instantané' : 'Manuel'}</span>
                {results.length > 0 && (
                  <span>• {results.length} résultat{results.length > 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Filtres Avancés</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Location & Radius */}
                <div className="space-y-3">
                  <Label>Localisation</Label>
                  <Input
                    placeholder="Ville, code postal..."
                    value={filters.location}
                    onChange={(e) => updateFilters({ location: e.target.value })}
                  />
                  <div>
                    <Label>Rayon: {filters.radius}km</Label>
                    <Slider
                      value={[filters.radius]}
                      onValueChange={([value]) => updateFilters({ radius: value })}
                      max={100}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <Label>Fourchette de prix</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange[0]}
                      onChange={(e) => updateFilters({ 
                        priceRange: [parseInt(e.target.value) || 0, filters.priceRange[1]] 
                      })}
                    />
                    <span>-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange[1]}
                      onChange={(e) => updateFilters({ 
                        priceRange: [filters.priceRange[0], parseInt(e.target.value) || 500] 
                      })}
                    />
                    <span>€</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-3">
                  <Label>Note minimum</Label>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{filters.rating}+</span>
                  </div>
                  <Slider
                    value={[filters.rating]}
                    onValueChange={([value]) => updateFilters({ rating: value })}
                    max={5}
                    min={0}
                    step={0.5}
                    className="mt-2"
                  />
                </div>

                {/* Experience */}
                <div className="space-y-3">
                  <Label>Années d'expérience</Label>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{filters.experience}+ ans</span>
                  </div>
                  <Slider
                    value={[filters.experience]}
                    onValueChange={([value]) => updateFilters({ experience: value })}
                    max={20}
                    min={0}
                    step={1}
                    className="mt-2"
                  />
                </div>

                {/* Boolean Filters */}
                <div className="space-y-3">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={filters.verified}
                        onCheckedChange={(checked) => updateFilters({ verified: checked })}
                      />
                      <Label>Vérifié</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={filters.instantBooking}
                        onCheckedChange={(checked) => updateFilters({ instantBooking: checked })}
                      />
                      <Label>Réservation instantanée</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={filters.virtualConsultation}
                        onCheckedChange={(checked) => updateFilters({ virtualConsultation: checked })}
                      />
                      <Label>Consultation virtuelle</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results & Analytics */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results">Résultats ({results.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analyses</TabsTrigger>
            <TabsTrigger value="saved">Sauvegardées</TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <span>Recherche en cours...</span>
              </div>
            ) : results.length === 0 && searchQuery ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun résultat trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    Essayez de modifier vos critères de recherche ou vos filtres
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Effacer les filtres
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((result) => (
                  <Card 
                    key={result.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onResultClick(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={getResultTypeBadge(result.type).variant}>
                              {getResultTypeBadge(result.type).label}
                            </Badge>
                            {result.verified && (
                              <Badge variant="secondary" className="text-xs">
                                ✓ Vérifié
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium line-clamp-2">{result.title}</h4>
                        </div>
                        {result.image && (
                          <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 ml-2" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {result.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{result.rating}</span>
                            <span className="text-muted-foreground">({result.reviewCount})</span>
                          </div>
                          {result.price && (
                            <span className="font-medium">{result.price}€</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{result.location}</span>
                            <span>({formatDistance(result.distance)})</span>
                          </div>
                          <span>{formatLastActive(result.lastActive)}</span>
                        </div>
                        
                        {result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {result.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {result.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Recherches</p>
                        <p className="text-2xl font-bold">{analytics.totalSearches}</p>
                      </div>
                      <Search className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Résultats Moyens</p>
                        <p className="text-2xl font-bold">{analytics.averageResults}</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Temps de Réponse</p>
                        <p className="text-2xl font-bold">{analytics.searchPerformance.averageResponseTime}ms</p>
                      </div>
                      <Zap className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune donnée d'analyse disponible</p>
              </div>
            )}
          </TabsContent>

          {/* Saved Searches Tab */}
          <TabsContent value="saved" className="space-y-4">
            {savedSearches.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune recherche sauvegardée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedSearches.map((savedSearch, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{savedSearch.name}</h4>
                          <p className="text-sm text-muted-foreground">{savedSearch.query}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadSavedSearch(savedSearch)}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Charger
                          </Button>
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
    </ErrorBoundary>
  )
}
