"use client"

import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { MapPin } from "lucide-react"

interface AddressSuggestion {
  label: string
  city?: string
  postcode?: string
  coordinates?: { lat: number; lon: number }
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: AddressSuggestion) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Adresse (ex: 10 rue de Rivoli, Paris)",
  className,
  disabled = false,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value || "")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setQuery(value || "")
  }, [value])

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const timeout = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
          query
        )}&limit=5` 
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error("Adresse API error")
        const data = await res.json()
        const feats = Array.isArray(data?.features) ? data.features : []
        const mapped: AddressSuggestion[] = feats.map((f: any) => ({
          label: f?.properties?.label || "",
          city: f?.properties?.city,
          postcode: f?.properties?.postcode,
          coordinates: f?.geometry?.coordinates?.length === 2
            ? { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] }
            : undefined,
        }))
        setSuggestions(mapped)
        setIsOpen(true)
        setHighlightedIndex(mapped.length > 0 ? 0 : -1)
      } catch (err) {
        // Swallow abort errors
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  const handleSelect = (s: AddressSuggestion) => {
    onChange(s.label)
    onSelect?.(s)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex])
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }
  }

  const [dropdownRect, setDropdownRect] = useState<{ left: number; top: number; width: number } | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const updatePosition = () => {
      const el = wrapperRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setDropdownRect({ left: rect.left, top: rect.bottom, width: rect.width })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  return (
    <div className={cn("relative", className)} ref={wrapperRef}>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
        }}
        onFocus={() => { if (suggestions.length > 0) setIsOpen(true) }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
      {isOpen && dropdownRect && typeof window !== 'undefined' && createPortal(
        <div
          style={{ position: 'fixed', left: dropdownRect.left, top: dropdownRect.top, width: dropdownRect.width, zIndex: 9999 }}
        >
          <Card className="mt-1 w-full overflow-hidden">
            <div className="max-h-64 overflow-auto divide-y divide-border">
              {loading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Recherche...</div>
              )}
              {!loading && suggestions.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Aucune adresse</div>
              )}
              {!loading && suggestions.map((s, idx) => (
                <button
                  key={`${s.label}-${idx}`}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-accent/80 hover:text-accent-foreground flex items-start gap-2",
                    idx === highlightedIndex && "bg-accent/80 text-accent-foreground"
                  )}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelect(s)}
                >
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <div>
                    <div className="font-medium leading-5">{s.label}</div>
                    {(s.postcode || s.city) && (
                      <div className="text-xs text-muted-foreground">{[s.postcode, s.city].filter(Boolean).join(" ")}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>,
        document.body
      )}
    </div>
  )
}


