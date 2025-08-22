"use client"

import type React from "react"

import { useRef, type ReactNode } from "react"
// ACCESSIBILITY: Import accessible notifications
import { useAccessibleNotifications } from "@/hooks/useAccessibleNotifications"

interface ImageUploadProps {
  onUpload: (file: File) => void
  accept?: string
  maxSize?: number
  children: ReactNode
  // ACCESSIBILITY: Optional props for multimedia support
  allowVideo?: boolean
  requireAltText?: boolean
  onAltTextRequired?: (file: File) => void
}

export function ImageUpload({ 
  onUpload, 
  accept = "image/*", 
  maxSize = 5 * 1024 * 1024, 
  children,
  // ACCESSIBILITY: Default to false for backward compatibility
  allowVideo = false,
  requireAltText = false,
  onAltTextRequired
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  // ACCESSIBILITY: Use accessible notifications
  const { showErrorNotification, showSuccessNotification } = useAccessibleNotifications()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // ACCESSIBILITY: Check file size with accessible error notification
    if (file.size > maxSize) {
      showErrorNotification(
        `The selected file is too large. Please choose a file smaller than ${Math.round(maxSize / (1024 * 1024))}MB.`,
        "File Size Error"
      )
      return
    }

    // ACCESSIBILITY: Enhanced file type checking with better error messages
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    
    if (!isImage && (!allowVideo || !isVideo)) {
      const expectedTypes = allowVideo ? "image or video" : "image"
      showErrorNotification(
        `Please select an ${expectedTypes} file. The selected file type is not supported.`,
        "Invalid File Type"
      )
      return
    }

    // ACCESSIBILITY: For video files, provide guidance
    if (isVideo) {
      showSuccessNotification(
        "Video file selected. Please ensure to provide captions or transcriptions for accessibility.",
        "Video Upload"
      )
    }

    // ACCESSIBILITY: For images that might contain text
    if (isImage && requireAltText && onAltTextRequired) {
      showSuccessNotification(
        "Image selected. Please provide alternative text to describe the image content.",
        "Image Upload"
      )
      onAltTextRequired(file)
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

  // ACCESSIBILITY: Determine proper accept attribute based on settings
  const acceptAttribute = allowVideo ? "image/*,video/*" : accept

  return (
    <>
      <input 
        ref={fileInputRef} 
        type="file" 
        accept={acceptAttribute} 
        onChange={handleFileChange} 
        className="hidden"
        // ACCESSIBILITY: Proper input labeling
        aria-label={`Upload ${allowVideo ? 'image or video' : 'image'} file`}
        aria-describedby="upload-help"
      />
      <div 
        onClick={handleClick} 
        className="cursor-pointer"
        // ACCESSIBILITY: Make upload area keyboard accessible
        role="button"
        tabIndex={0}
        aria-label={`Click to upload ${allowVideo ? 'image or video' : 'image'} file`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {children}
      </div>
      {/* ACCESSIBILITY: Hidden help text */}
      <div id="upload-help" className="sr-only">
        {allowVideo 
          ? `Upload an image or video file. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB. For videos, please provide captions or transcriptions.`
          : `Upload an image file. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB.`
        }
      </div>
    </>
  )
}
