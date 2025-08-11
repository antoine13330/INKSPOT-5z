"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  SearchIcon, 
  HashIcon, 
  UserIcon, 
  ClockIcon, 
  TrendingUpIcon,
  XIcon,
  MapPinIcon
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"

interface AutoCompleteProps {
  query: string
  onQueryChange: (query: string) => void
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  showSuggestions?: boolean
}

interface SearchSuggestion {
  id: string
  type: 'user' | 'hashtag' | 'recent' | 'trending' | 'location'
  text: string
  description?: string
  avatar?: string
  verified?: boolean
  count?: number
  location?: string
}

// API response types
interface UserData {
  id: string
  username: string
  businessName?: string
  firstName?: string
  lastName?: string
  avatar?: string
  verified: boolean
  location?: string
}

interface HashtagData {
  tag: string
  count: number
}

interface SearchHistoryData {
  id: string
  query: string
}

interface TrendingData {
  tag?: string
  query?: string
}

export function AutoComplete({
  query,
  onQueryChange,
  onSearch,
  placeholder = "Search posts, users, hashtags...",
  className = "",
  showSuggestions = true
}: AutoCompleteProps) {
  const { data: session } = useSession()
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  const debouncedFetch = useCallback(
    (searchQuery: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        if (searchQuery.trim().length >= 2) {
          await fetchSuggestions(searchQuery.trim())
        } else {
          await fetchDefaultSuggestions()
        }
      }, 300)
    },
    []
  )

  useEffect(() => {
    if (showSuggestions) {
      if (query.trim()) {
        debouncedFetch(query)
      } else {
        fetchDefaultSuggestions()
      }
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [query, showSuggestions, debouncedFetch])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const [usersResponse, hashtagsResponse] = await Promise.all([
        fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=3`),
        fetch(`/api/search/hashtags?q=${encodeURIComponent(searchQuery)}&limit=5`)
      ])

      const usersData = await usersResponse.json()
      const hashtagsData = await hashtagsResponse.json()

      const newSuggestions: SearchSuggestion[] = []

      // Add user suggestions
      if (usersData.users) {
        usersData.users.forEach((user: UserData) => {
          newSuggestions.push({
            id: `user-${user.id}`,
            type: 'user',
            text: user.username,
            description: user.businessName || `${user.firstName} ${user.lastName}`.trim(),
            avatar: user.avatar,
            verified: user.verified,
            location: user.location
          })
        })
      }

      // Add hashtag suggestions
      if (hashtagsData.hashtags) {
        hashtagsData.hashtags.forEach((hashtag: HashtagData) => {
          newSuggestions.push({
            id: `hashtag-${hashtag.tag}`,
            type: 'hashtag',
            text: hashtag.tag,
            count: hashtag.count,
            description: `${hashtag.count} posts`
          })
        })
      }

      setSuggestions(newSuggestions)
    } catch (error) {
      // Log error for debugging (in production, send to monitoring service)
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching suggestions:', error)
      }
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDefaultSuggestions = async () => {
    if (!session?.user?.id) {
      // Show trending suggestions for non-authenticated users
      setSuggestions([
        {
          id: 'trending-1',
          type: 'trending',
          text: '#photography',
          description: 'Trending',
          count: 1234
        },
        {
          id: 'trending-2',
          type: 'trending',
          text: '#design',
          description: 'Trending',
          count: 892
        },
        {
          id: 'trending-3',
          type: 'trending',
          text: '#freelance',
          description: 'Trending',
          count: 756
        }
      ])
      return
    }

    try {
      const [recentResponse, trendingResponse] = await Promise.all([
        fetch('/api/search/history?limit=3'),
        fetch('/api/search/trending?limit=5')
      ])

      const recentData = await recentResponse.json()
      const trendingData = await trendingResponse.json()

      const newSuggestions: SearchSuggestion[] = []

      // Add recent searches
      if (recentData.searches) {
        recentData.searches.forEach((search: SearchHistoryData) => {
          newSuggestions.push({
            id: `recent-${search.id}`,
            type: 'recent',
            text: search.query,
            description: 'Recent search'
          })
        })
      }

      // Add trending hashtags
      if (trendingData.trending) {
        trendingData.trending.forEach((item: TrendingData) => {
          newSuggestions.push({
            id: `trending-${item.tag || item.query}`,
            type: 'trending',
            text: item.tag || item.query,
            description: 'Trending',
            count: item.count
          })
        })
      }

      setSuggestions(newSuggestions)
    } catch (error) {
      // Log error for debugging (in production, send to monitoring service)
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching default suggestions:', error)
      }
      setSuggestions([])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    onQueryChange(newQuery)
    setSelectedIndex(-1)
    setShowDropdown(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearch(query)
        setShowDropdown(false)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          selectSuggestion(suggestions[selectedIndex])
        } else {
          onSearch(query)
          setShowDropdown(false)
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    onQueryChange(suggestion.text)
    onSearch(suggestion.text)
    setShowDropdown(false)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    setShowDropdown(true)
    if (suggestions.length === 0) {
      fetchDefaultSuggestions()
    }
  }

  const clearSearch = () => {
    onQueryChange("")
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const renderSuggestionIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <UserIcon className="w-4 h-4" />
      case 'hashtag':
        return <HashIcon className="w-4 h-4" />
      case 'recent':
        return <ClockIcon className="w-4 h-4" />
      case 'trending':
        return <TrendingUpIcon className="w-4 h-4" />
      case 'location':
        return <MapPinIcon className="w-4 h-4" />
      default:
        return <SearchIcon className="w-4 h-4" />
    }
  }

  const getSuggestionsByType = () => {
    const grouped = suggestions.reduce((acc, suggestion) => {
      if (!acc[suggestion.type]) {
        acc[suggestion.type] = []
      }
      acc[suggestion.type].push(suggestion)
      return acc
    }, {} as Record<string, SearchSuggestion[]>)

    return grouped
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <XIcon className="w-4 h-4" />
          </Button>
        )}
      </div>

      {showDropdown && showSuggestions && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <SearchIcon className="w-6 h-6 mx-auto mb-2 animate-spin" />
                Searching...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {query ? "No suggestions found" : "Start typing to search"}
              </div>
            ) : (
              <div>
                {Object.entries(getSuggestionsByType()).map(([type, items], groupIndex) => (
                  <div key={type}>
                    {groupIndex > 0 && <Separator />}
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-500 mb-2 px-2 capitalize">
                        {type === 'recent' ? 'Recent Searches' : 
                         type === 'trending' ? 'Trending' :
                         type === 'user' ? 'Users' :
                         type === 'hashtag' ? 'Hashtags' : type}
                      </div>
                      {items.map((suggestion, index) => {
                        const globalIndex = suggestions.indexOf(suggestion)
                        return (
                          <div
                            key={suggestion.id}
                            className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                              selectedIndex === globalIndex
                                ? 'bg-blue-50 text-blue-700'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => selectSuggestion(suggestion)}
                          >
                            {suggestion.type === 'user' ? (
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={suggestion.avatar} />
                                <AvatarFallback>
                                  {suggestion.text.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                                {renderSuggestionIcon(suggestion.type)}
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium truncate">
                                  {suggestion.text}
                                </span>
                                {suggestion.verified && (
                                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                )}
                              </div>
                              {suggestion.description && (
                                <div className="text-sm text-gray-500 truncate">
                                  {suggestion.description}
                                </div>
                              )}
                              {suggestion.location && (
                                <div className="text-xs text-gray-400 flex items-center mt-1">
                                  <MapPinIcon className="w-3 h-3 mr-1" />
                                  {suggestion.location}
                                </div>
                              )}
                            </div>
                            
                            {suggestion.count && (
                              <Badge variant="secondary" className="text-xs">
                                {suggestion.count}
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}