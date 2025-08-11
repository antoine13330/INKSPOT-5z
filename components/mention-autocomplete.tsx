"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users } from "lucide-react"

interface Pro {
  id: string
  username: string
  firstName?: string
  lastName?: string
  businessName?: string
  avatar?: string
  specialties: string[]
}

interface MentionAutocompleteProps {
  query: string
  onSelect: (pro: Pro) => void
  onClose: () => void
}

export function MentionAutocomplete({ query, onSelect, onClose }: MentionAutocompleteProps) {
  const [pros, setPros] = useState<Pro[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!query.trim()) {
      setPros([])
      return
    }

    const searchPros = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/users/pros/search?q=${encodeURIComponent(query)}&limit=5`)
        const data = await response.json()
        setPros(data.pros || [])
        setSelectedIndex(0)
      } catch (error) {
        console.error("Error searching pros:", error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchPros, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pros.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % pros.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + pros.length) % pros.length)
          break
        case "Enter":
          e.preventDefault()
          if (pros[selectedIndex]) {
            onSelect(pros[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [pros, selectedIndex, onSelect, onClose])

  if (pros.length === 0 && !loading) {
    return null
  }

  return (
    <Card className="absolute top-full left-0 right-0 z-50 bg-gray-800 border-gray-600 shadow-lg">
      <CardContent className="p-2">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {pros.map((pro, index) => (
              <Button
                key={pro.id}
                variant="ghost"
                className={`w-full justify-start h-auto p-2 ${
                  index === selectedIndex ? "bg-gray-700" : "hover:bg-gray-700"
                }`}
                onClick={() => onSelect(pro)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={pro.avatar} />
                    <AvatarFallback className="bg-gray-600 text-white text-xs">
                      {pro.businessName ? pro.businessName.charAt(0) : pro.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white truncate">
                        {pro.businessName || `${pro.firstName || ""} ${pro.lastName || ""}`.trim() || pro.username}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        @{pro.username}
                      </Badge>
                    </div>
                    {pro.specialties.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400 truncate">
                          {pro.specialties.slice(0, 2).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 