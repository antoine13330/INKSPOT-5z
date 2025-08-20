'use client';

import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocalImageUploadProps {
  onUpload: (url: string, fileName: string) => void;
  onRemove?: () => void;
  type?: 'avatar' | 'post' | 'general';
  userId?: string;
  className?: string;
  maxSize?: number; // en MB
  acceptedTypes?: string[];
  currentImage?: string;
  label?: string;
  disabled?: boolean;
}

export function LocalImageUpload({
  onUpload,
  onRemove,
  type = 'general',
  userId,
  className,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  currentImage,
  label = 'Upload d\'image',
  disabled = false
}: LocalImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    if (!acceptedTypes.includes(file.type)) {
      setError(`Type de fichier non supporté. Types acceptés: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Validation de la taille
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Fichier trop volumineux. Taille maximale: ${maxSize}MB`);
      return;
    }

    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload du fichier
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (userId) {
        formData.append('userId', userId);
      }

      // Simuler le progrès
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      
      // Appeler le callback avec l'URL et le nom du fichier
      onUpload(result.url, result.fileName);
      
      // Réinitialiser l'état
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
      setIsUploading(false);
      setUploadProgress(0);
      setPreviewUrl(currentImage || null);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove?.();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const input = fileInputRef.current;
        if (input) {
          input.files = files;
          handleFileSelect({ target: { files } } as any);
        }
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Label htmlFor="image-upload">{label}</Label>
      
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          'hover:border-primary/50 cursor-pointer',
          previewUrl ? 'border-primary' : 'border-muted-foreground/25',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Aperçu"
              className="max-w-full h-auto max-h-64 mx-auto rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Cliquez pour uploader</span> ou glissez-déposez
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF jusqu'à {maxSize}MB
            </p>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Upload en cours...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      <Input
        ref={fileInputRef}
        id="image-upload"
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {!previewUrl && !isUploading && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Choisir une image
        </Button>
      )}
    </div>
  );
}

