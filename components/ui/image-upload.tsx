"use client"

import type React from "react"

import { useRef, type ReactNode } from "react"

interface ImageUploadProps {
  onUpload: (file: File) => void
  accept?: string
  maxSize?: number
  children: ReactNode
}

export function ImageUpload({ onUpload, accept = "image/*", maxSize = 5 * 1024 * 1024, children }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`)
      return
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    onUpload(file)

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>
    </>
  )
}
