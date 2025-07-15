"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const presetColors = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
]

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal bg-gray-800 border-gray-700">
          <div className="w-4 h-4 rounded mr-2 border border-gray-600" style={{ backgroundColor: color }} />
          {color}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-gray-800 border-gray-700">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">Custom Color</label>
            <div className="flex space-x-2">
              <Input
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="w-12 h-8 p-0 border-0 bg-transparent cursor-pointer"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 bg-gray-700 border-gray-600 text-white"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">Preset Colors</label>
            <div className="grid grid-cols-5 gap-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  className="w-8 h-8 rounded border border-gray-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: presetColor }}
                  onClick={() => {
                    onChange(presetColor)
                    setIsOpen(false)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
