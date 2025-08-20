import { SearchFilters, SearchResult, SearchSuggestion } from '@/types/search'

export class SearchService {
  private cache = new Map<string, { results: SearchResult[]; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Perform intelligent search with advanced filtering and relevance scoring
   */
  async search(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(query, filters)
      const cached = this.cache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.results
      }

      // Perform search
      const results = await this.performSearch(query, filters)
      
      // Apply relevance scoring
      const scoredResults = this.scoreResults(results, query, filters)
      
      // Sort by relevance
      const sortedResults = scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore)
      
      // Cache results
      this.cache.set(cacheKey, {
        results: sortedResults,
        timestamp: Date.now()
      })

      return sortedResults

    } catch (error) {
      console.error('Error in search service:', error)
      throw new Error('Erreur lors de la recherche')
    }
  }

  /**
   * Generate intelligent search suggestions
   */
  async generateSuggestions(query: string, userId?: string): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = []

      // Direct matches
      const directSuggestions = await this.getDirectSuggestions(query)
      suggestions.push(...directSuggestions)

      // Trending searches
      const trendingSuggestions = await this.getTrendingSuggestions(query)
      suggestions.push(...trendingSuggestions)

      // User-specific suggestions
      if (userId) {
        const userSuggestions = await this.getUserSuggestions(query, userId)
        suggestions.push(...userSuggestions)
      }

      // Contextual suggestions
      const contextualSuggestions = await this.getContextualSuggestions(query)
      suggestions.push(...contextualSuggestions)

      // Remove duplicates and sort by relevance
      const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions)
      return uniqueSuggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 10)

    } catch (error) {
      console.error('Error generating suggestions:', error)
      return []
    }
  }

  /**
   * Get search analytics and insights
   */
  async getSearchAnalytics(userId: string, timeRange: 'day' | 'week' | 'month' = 'week') {
    try {
      const analytics = {
        totalSearches: await this.getTotalSearches(userId, timeRange),
        averageResults: await this.getAverageResults(userId, timeRange),
        popularQueries: await this.getPopularQueries(userId, timeRange),
        searchPerformance: await this.getSearchPerformance(userId, timeRange),
        userBehavior: await this.getUserBehavior(userId, timeRange)
      }

      return analytics

    } catch (error) {
      console.error('Error getting search analytics:', error)
      throw new Error('Erreur lors de la récupération des analyses')
    }
  }

  /**
   * Track search behavior for analytics
   */
  async trackSearch(userId: string, searchData: {
    query: string
    resultCount: number
    filters: SearchFilters
    timestamp: string
    responseTime: number
    clickedResults?: string[]
  }) {
    try {
      // Store search record
      await this.storeSearchRecord(userId, searchData)
      
      // Update search statistics
      await this.updateSearchStats(userId, searchData)
      
      // Update trending searches
      await this.updateTrendingSearches(searchData.query)
      
      // Update user behavior metrics
      if (searchData.clickedResults) {
        await this.updateClickThroughMetrics(userId, searchData)
      }

    } catch (error) {
      console.error('Error tracking search:', error)
    }
  }

  /**
   * Perform the actual search operation
   */
  private async performSearch(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    try {
      // Search in different data sources
      const [professionals, services, posts, events] = await Promise.all([
        this.searchProfessionals(query, filters),
        this.searchServices(query, filters),
        this.searchPosts(query, filters),
        this.searchEvents(query, filters)
      ])

      results.push(...professionals, ...services, ...posts, ...events)

    } catch (error) {
      console.error('Error performing search:', error)
    }

    return results
  }

  /**
   * Score results based on relevance to query and filters
   */
  private scoreResults(results: SearchResult[], query: string, filters: SearchFilters): SearchResult[] {
    return results.map(result => {
      let score = 0

      // Text relevance (exact matches, partial matches, etc.)
      score += this.calculateTextRelevance(result, query)

      // Filter relevance
      score += this.calculateFilterRelevance(result, filters)

      // Recency bonus
      score += this.calculateRecencyBonus(result)

      // Popularity bonus
      score += this.calculatePopularityBonus(result)

      // Quality indicators
      score += this.calculateQualityScore(result)

      return {
        ...result,
        relevanceScore: Math.min(score, 100) // Cap at 100
      }
    })
  }

  /**
   * Calculate text relevance score
   */
  private calculateTextRelevance(result: SearchResult, query: string): number {
    let score = 0
    const queryLower = query.toLowerCase()
    const titleLower = result.title.toLowerCase()
    const descLower = result.description.toLowerCase()

    // Exact title match
    if (titleLower === queryLower) score += 50
    // Title contains query
    else if (titleLower.includes(queryLower)) score += 30
    // Description contains query
    else if (descLower.includes(queryLower)) score += 15

    // Word-by-word matching
    const queryWords = queryLower.split(/\s+/)
    const titleWords = titleLower.split(/\s+/)
    const descWords = descLower.split(/\s+/)

    for (const word of queryWords) {
      if (titleWords.includes(word)) score += 10
      if (descWords.includes(word)) score += 5
    }

    return score
  }

  /**
   * Calculate filter relevance score
   */
  private calculateFilterRelevance(result: SearchResult, filters: SearchFilters): number {
    let score = 0

    // Location relevance
    if (filters.location && result.location.toLowerCase().includes(filters.location.toLowerCase())) {
      score += 20
    }

    // Distance relevance (closer = higher score)
    if (filters.radius && result.distance <= filters.radius) {
      score += Math.max(0, 15 - (result.distance / filters.radius) * 15)
    }

    // Price relevance
    if (result.price && filters.priceRange) {
      const [min, max] = filters.priceRange
      if (result.price >= min && result.price <= max) {
        score += 10
      }
    }

    // Rating relevance
    if (filters.rating && result.rating >= filters.rating) {
      score += (result.rating - filters.rating) * 5
    }

    // Boolean filters
    if (filters.verified && result.verified) score += 5
    if (filters.instantBooking && result.instantBooking) score += 5
    if (filters.virtualConsultation && result.virtualConsultation) score += 5

    return score
  }

  /**
   * Calculate recency bonus
   */
  private calculateRecencyBonus(result: SearchResult): number {
    const now = new Date()
    const lastActive = new Date(result.lastActive)
    const daysDiff = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff <= 1) return 10      // Today
    if (daysDiff <= 7) return 5       // This week
    if (daysDiff <= 30) return 2      // This month
    return 0
  }

  /**
   * Calculate popularity bonus
   */
  private calculatePopularityBonus(result: SearchResult): number {
    let score = 0

    // Rating bonus
    score += result.rating * 2

    // Review count bonus (capped)
    score += Math.min(result.reviewCount / 10, 10)

    return score
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(result: SearchResult): number {
    let score = 0

    // Verified status
    if (result.verified) score += 5

    // Complete profile indicators
    if (result.image) score += 3
    if (result.tags.length > 0) score += 2
    if (result.availability.length > 0) score += 2

    return score
  }

  /**
   * Generate cache key for search results
   */
  private generateCacheKey(query: string, filters: SearchFilters): string {
    const filterString = JSON.stringify(filters)
    return `${query}:${filterString}`
  }

  /**
   * Remove duplicate suggestions
   */
  private removeDuplicateSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>()
    return suggestions.filter(suggestion => {
      const key = suggestion.text.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  // Mock database search functions (replace with actual implementations)
  private async searchProfessionals(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    // Mock implementation
    return []
  }

  private async searchServices(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    // Mock implementation
    return []
  }

  private async searchPosts(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    // Mock implementation
    return []
  }

  private async searchEvents(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    // Mock implementation
    return []
  }

  private async getDirectSuggestions(query: string): Promise<SearchSuggestion[]> {
    // Mock implementation
    return []
  }

  private async getTrendingSuggestions(query: string): Promise<SearchSuggestion[]> {
    // Mock implementation
    return []
  }

  private async getUserSuggestions(query: string, userId: string): Promise<SearchSuggestion[]> {
    // Mock implementation
    return []
  }

  private async getContextualSuggestions(query: string): Promise<SearchSuggestion[]> {
    // Mock implementation
    return []
  }

  private async getTotalSearches(userId: string, timeRange: string): Promise<number> {
    // Mock implementation
    return 0
  }

  private async getAverageResults(userId: string, timeRange: string): Promise<number> {
    // Mock implementation
    return 0
  }

  private async getPopularQueries(userId: string, timeRange: string) {
    // Mock implementation
    return []
  }

  private async getSearchPerformance(userId: string, timeRange: string) {
    // Mock implementation
    return {}
  }

  private async getUserBehavior(userId: string, timeRange: string) {
    // Mock implementation
    return {}
  }

  private async storeSearchRecord(userId: string, searchData: any) {
    // Mock implementation
  }

  private async updateSearchStats(userId: string, searchData: any) {
    // Mock implementation
  }

  private async updateTrendingSearches(query: string) {
    // Mock implementation
  }

  private async updateClickThroughMetrics(userId: string, searchData: any) {
    // Mock implementation
  }
}
