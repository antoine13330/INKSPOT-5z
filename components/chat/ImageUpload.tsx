"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, X, Upload, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  onCancel: () => void
  className?: string
}

interface UploadedImage {
  id: string
  file: File
  preview: string
  uploading: boolean
  uploaded: boolean
  url?: string
}

export function ImageUpload({ onImageUpload, onCancel, className }: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image valide`)
        return false
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} est trop volumineux (max 10MB)`)
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) return

    // Create previews
    const newImages: UploadedImage[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      uploaded: false
    }))

    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image?.preview) {
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const uploadImage = async (image: UploadedImage) => {
    if (image.uploading || image.uploaded) return

    setImages(prev => 
      prev.map(img => 
        img.id === image.id 
          ? { ...img, uploading: true }
          : img
      )
    )

    try {
      const formData = new FormData()
      formData.append('file', image.file)
      formData.append('type', 'message')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      
      setImages(prev => 
        prev.map(img => 
          img.id === image.id 
            ? { ...img, uploading: false, uploaded: true, url: data.url }
            : img
        )
      )

      // Call the callback with the uploaded image URL
      onImageUpload(data.url)
      
      toast.success('Image uploadée avec succès')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Échec de l\'upload de l\'image')
      
      setImages(prev => 
        prev.map(img => 
          img.id === image.id 
            ? { ...img, uploading: false }
            : img
        )
      )
    }
  }

  const uploadAllImages = async () => {
    if (images.length === 0) return

    setIsUploading(true)
    
    try {
      for (const image of images) {
        if (!image.uploaded) {
          await uploadImage(image)
        }
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    
    if (files.length > 0) {
      const event = { target: { files } } as any
      handleFileSelect(event)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className={`image-upload ${className || ''}`}>
      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-2">
          <Upload className="w-8 h-8 mx-auto text-gray-400" />
          <p className="text-sm text-gray-600">
            Glissez-déposez vos images ici ou{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-primary hover:underline"
            >
              cliquez pour sélectionner
            </button>
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF jusqu'à 10MB
          </p>
        </div>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Images sélectionnées</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={uploadAllImages}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload tout
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={image.preview}
                    alt="Preview"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Status overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : image.uploaded ? (
                    <div className="text-white text-center">
                      <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-xs">Uploadé</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => uploadImage(image)}
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </Button>
                  )}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Filename */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                  {image.file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
