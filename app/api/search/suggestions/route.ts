import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = "force-dynamic"

interface SearchSuggestion {
  text: string
  type: 'query' | 'filter' | 'trending' | 'recent'
  relevance: number
  metadata?: Record<string, any>
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Generate intelligent suggestions based on query
    const suggestions: SearchSuggestion[] = []

    // 1. Direct query suggestions (exact matches or close matches)
    const directSuggestions = await generateDirectSuggestions(query)
    suggestions.push(...directSuggestions)

    // 2. Trending searches related to the query
    const trendingSuggestions = await generateTrendingSuggestions(query)
    suggestions.push(...trendingSuggestions)

    // 3. Recent searches from user history (if authenticated)
    if (session?.user?.id) {
      const recentSuggestions = await generateRecentSuggestions(query, session.user.id)
      suggestions.push(...recentSuggestions)
    }

    // 4. Contextual suggestions based on query patterns
    const contextualSuggestions = await generateContextualSuggestions(query)
    suggestions.push(...contextualSuggestions)

    // 5. Filter suggestions
    const filterSuggestions = await generateFilterSuggestions(query)
    suggestions.push(...filterSuggestions)

    // Sort by relevance and remove duplicates
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.text === suggestion.text)
      )
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10)

    return NextResponse.json({ suggestions: uniqueSuggestions })

  } catch (error) {
    console.error('Error generating search suggestions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération des suggestions' },
      { status: 500 }
    )
  }
}

// Generate direct suggestions based on database content
async function generateDirectSuggestions(query: string): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = []
  
  try {
    // Search in professionals
    const proSuggestions = await searchProfessionals(query)
    suggestions.push(...proSuggestions.map(s => ({
      text: s.name,
      type: 'query' as const,
      relevance: 0.9,
      metadata: { type: 'professional', id: s.id }
    })))

    // Search in services
    const serviceSuggestions = await searchServices(query)
    suggestions.push(...serviceSuggestions.map(s => ({
      text: s.name,
      type: 'query' as const,
      relevance: 0.8,
      metadata: { type: 'service', id: s.id }
    })))

    // Search in specializations
    const specSuggestions = await searchSpecializations(query)
    suggestions.push(...specSuggestions.map(s => ({
      text: s.name,
      type: 'query' as const,
      relevance: 0.7,
      metadata: { type: 'specialization', id: s.id }
    })))

  } catch (error) {
    console.error('Error generating direct suggestions:', error)
  }

  return suggestions
}

// Generate trending searches
async function generateTrendingSuggestions(query: string): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = []
  
  try {
    // Get trending searches from analytics
    const trendingSearches = await getTrendingSearches()
    
    for (const trend of trendingSearches) {
      if (trend.query.toLowerCase().includes(query.toLowerCase()) || 
          query.toLowerCase().includes(trend.query.toLowerCase())) {
        suggestions.push({
          text: trend.query,
          type: 'trending',
          relevance: 0.6 + (trend.count / 100), // Higher count = higher relevance
          metadata: { count: trend.count, trend: trend.trend }
        })
      }
    }

  } catch (error) {
    console.error('Error generating trending suggestions:', error)
  }

  return suggestions
}

// Generate recent searches from user history
async function generateRecentSuggestions(query: string, userId: string): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = []
  
  try {
    // Get user's recent searches
    const recentSearches = await getUserRecentSearches(userId)
    
    for (const recent of recentSearches) {
      if (recent.query.toLowerCase().includes(query.toLowerCase()) || 
          query.toLowerCase().includes(recent.query.toLowerCase())) {
        suggestions.push({
          text: recent.query,
          type: 'recent',
          relevance: 0.5 + (recent.recency / 100), // More recent = higher relevance
          metadata: { timestamp: recent.timestamp }
        })
      }
    }

  } catch (error) {
    console.error('Error generating recent suggestions:', error)
  }

  return suggestions
}

// Generate contextual suggestions based on query patterns
async function generateContextualSuggestions(query: string): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = []
  
  try {
    // Common search patterns and their expansions
    const patterns = [
      { pattern: /tatouage/i, expansions: ['tatouage personnalisé', 'tatouage artistique', 'tatouage tribal'] },
      { pattern: /massage/i, expansions: ['massage relaxant', 'massage thérapeutique', 'massage sportif'] },
      { pattern: /coiffure/i, expansions: ['coiffure mariage', 'coiffure coloriste', 'coiffure homme'] },
      { pattern: /beauté/i, expansions: ['soin visage', 'maquillage', 'manucure', 'épilation'] },
      { pattern: /fitness/i, expansions: ['coaching sportif', 'yoga', 'pilates', 'musculation'] }
    ]

    for (const { pattern, expansions } of patterns) {
      if (pattern.test(query)) {
        for (const expansion of expansions) {
          if (expansion.toLowerCase().includes(query.toLowerCase())) {
            suggestions.push({
              text: expansion,
              type: 'query',
              relevance: 0.4,
              metadata: { pattern: pattern.source }
            })
          }
        }
      }
    }

  } catch (error) {
    console.error('Error generating contextual suggestions:', error)
  }

  return suggestions
}

// Generate filter suggestions
async function generateFilterSuggestions(query: string): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = []
  
  try {
    // Location-based suggestions
    if (query.match(/^\d{5}$/)) { // Postal code
      const city = await getCityFromPostalCode(query)
      if (city) {
        suggestions.push({
          text: `à ${city}`,
          type: 'filter',
          relevance: 0.3,
          metadata: { filterType: 'location', value: city }
        })
      }
    }

    // Price-based suggestions
    if (query.match(/gratuit|gratuite/i)) {
      suggestions.push({
        text: 'Prix: Gratuit',
        type: 'filter',
        relevance: 0.3,
        metadata: { filterType: 'price', value: 'free' }
      })
    }

    if (query.match(/pas cher|économique/i)) {
      suggestions.push({
        text: 'Prix: Économique (< 50€)',
        type: 'filter',
        relevance: 0.3,
        metadata: { filterType: 'price', value: 'cheap' }
      })
    }

    // Rating-based suggestions
    if (query.match(/excellent|5 étoiles/i)) {
      suggestions.push({
        text: 'Note: 5 étoiles',
        type: 'filter',
        relevance: 0.3,
        metadata: { filterType: 'rating', value: 5 }
      })
    }

  } catch (error) {
    console.error('Error generating filter suggestions:', error)
  }

  return suggestions
}

// Mock database functions (replace with actual database queries)
async function searchProfessionals(query: string) {
  // Mock data - replace with actual database query
  return [
    { id: '1', name: 'Marie Dubois - Tatoueuse' },
    { id: '2', name: 'Jean Martin - Coiffeur' },
    { id: '3', name: 'Sophie Bernard - Esthéticienne' }
  ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
}

async function searchServices(query: string) {
  // Mock data - replace with actual database query
  return [
    { id: '1', name: 'Tatouage personnalisé' },
    { id: '2', name: 'Coupe et coloration' },
    { id: '3', name: 'Soin du visage' }
  ].filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
}

async function searchSpecializations(query: string) {
  // Mock data - replace with actual database query
  return [
    { id: '1', name: 'Tatouage tribal' },
    { id: '2', name: 'Coiffure mariage' },
    { id: '3', name: 'Massage relaxant' }
  ].filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
}

async function getTrendingSearches() {
  // Mock data - replace with actual analytics query
  return [
    { query: 'tatouage fleur de lotus', count: 45, trend: 'up' as const },
    { query: 'coiffure mariage', count: 32, trend: 'up' as const },
    { query: 'massage relaxant', count: 28, trend: 'stable' as const }
  ]
}

async function getUserRecentSearches(userId: string) {
  // Mock data - replace with actual user history query
  return [
    { query: 'tatouage', timestamp: new Date(), recency: 1 },
    { query: 'coiffeur', timestamp: new Date(Date.now() - 86400000), recency: 0.8 },
    { query: 'massage', timestamp: new Date(Date.now() - 172800000), recency: 0.6 }
  ]
}

async function getCityFromPostalCode(postalCode: string) {
  // Mock data - replace with actual postal code lookup
  const cities: Record<string, string> = {
    '75001': 'Paris 1er',
    '75002': 'Paris 2ème',
    '69001': 'Lyon 1er',
    '13001': 'Marseille 1er'
  }
  return cities[postalCode] || null
}
