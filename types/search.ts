export interface SearchFilters {
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
  sortBy?: 'relevance' | 'rating' | 'price' | 'distance' | 'recent'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SearchResult {
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
  metadata?: {
    category?: string
    subcategory?: string
    experience?: number
    languages?: string[]
    specializations?: string[]
    portfolio?: string[]
    certifications?: string[]
    insurance?: boolean
    emergency?: boolean
    homeService?: boolean
    studioService?: boolean
    virtualService?: boolean
    groupService?: boolean
    individualService?: boolean
    duration?: number
    maxParticipants?: number
    cancellationPolicy?: string
    depositRequired?: boolean
    depositAmount?: number
    paymentMethods?: string[]
    workingHours?: {
      [key: string]: {
        open: string
        close: string
        closed: boolean
      }
    }
  }
}

export interface SearchSuggestion {
  text: string
  type: 'query' | 'filter' | 'trending' | 'recent'
  relevance: number
  metadata?: {
    type?: string
    id?: string
    count?: number
    trend?: 'up' | 'down' | 'stable'
    timestamp?: Date
    filterType?: string
    value?: any
    pattern?: string
  }
}

export interface SearchAnalytics {
  totalSearches: number
  averageResults: number
  popularQueries: Array<{
    query: string
    count: number
    trend: 'up' | 'down' | 'stable'
    conversionRate?: number
  }>
  searchPerformance: {
    averageResponseTime: number
    cacheHitRate: number
    errorRate: number
    totalQueries: number
    successfulQueries: number
    failedQueries: number
  }
  userBehavior: {
    clickThroughRate: number
    averageSessionDuration: number
    bounceRate: number
    averageQueriesPerSession: number
    mostCommonFilters: string[]
    searchAbandonmentRate: number
  }
  searchTrends: Array<{
    date: string
    searches: number
    results: number
    avgResponseTime: number
    uniqueUsers: number
    conversionRate: number
  }>
  topCategories: Array<{
    category: string
    searches: number
    conversionRate: number
    averageRating: number
    topQueries: string[]
  }>
  locationInsights: Array<{
    location: string
    searches: number
    topQueries: string[]
    averageRating: number
    conversionRate: number
  }>
  performanceMetrics: {
    peakSearchHours: Array<{
      hour: string
      searches: number
    }>
    searchVolumeByDay: Array<{
      day: string
      searches: number
    }>
    averageResultsByQueryLength: Array<{
      queryLength: string
      averageResults: number
    }>
  }
}

export interface SearchSession {
  id: string
  userId?: string
  sessionId: string
  startTime: Date
  endTime?: Date
  queries: Array<{
    query: string
    timestamp: Date
    resultCount: number
    filters: SearchFilters
    responseTime: number
    clickedResults: string[]
    abandoned: boolean
  }>
  totalQueries: number
  totalResults: number
  averageResponseTime: number
  conversionRate: number
}

export interface SearchQuery {
  id: string
  userId?: string
  sessionId: string
  query: string
  timestamp: Date
  filters: SearchFilters
  resultCount: number
  responseTime: number
  clickedResults: string[]
  abandoned: boolean
  searchType: 'instant' | 'manual'
  source: 'search_bar' | 'suggestion' | 'filter' | 'saved_search'
  metadata?: {
    userAgent?: string
    referrer?: string
    page?: string
    device?: string
    location?: string
  }
}

export interface SearchFilter {
  id: string
  name: string
  type: 'text' | 'number' | 'range' | 'select' | 'multiselect' | 'boolean' | 'date'
  options?: Array<{
    value: string | number | boolean
    label: string
    count?: number
  }>
  defaultValue?: any
  required?: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  category: string
  order: number
  active: boolean
}

export interface SearchIndex {
  id: string
  name: string
  type: 'professional' | 'service' | 'post' | 'event' | 'all'
  fields: Array<{
    name: string
    type: 'text' | 'number' | 'date' | 'boolean' | 'array' | 'object'
    searchable: boolean
    filterable: boolean
    sortable: boolean
    boost?: number
  }>
  lastUpdated: Date
  documentCount: number
  size: number
  status: 'active' | 'building' | 'error'
}

export interface SearchRelevanceConfig {
  weights: {
    title: number
    description: number
    tags: number
    category: number
    location: number
    rating: number
    reviewCount: number
    recency: number
    popularity: number
    verification: number
    completeness: number
  }
  boostFactors: {
    exactMatch: number
    partialMatch: number
    wordMatch: number
    proximity: number
    freshness: number
    authority: number
  }
  thresholds: {
    minimumRelevance: number
    maximumResults: number
    cacheExpiration: number
  }
}

export interface SearchPerformanceMetrics {
  queryTime: number
  indexingTime: number
  cacheHitRate: number
  memoryUsage: number
  cpuUsage: number
  networkLatency: number
  databaseQueries: number
  averageResponseSize: number
  errorRate: number
  throughput: number
}

export interface SearchOptimization {
  id: string
  name: string
  description: string
  type: 'query' | 'index' | 'cache' | 'algorithm' | 'ui'
  status: 'active' | 'testing' | 'inactive'
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  metrics: {
    before: SearchPerformanceMetrics
    after: SearchPerformanceMetrics
    improvement: number
  }
  appliedAt: Date
  expiresAt?: Date
  metadata?: Record<string, any>
}
