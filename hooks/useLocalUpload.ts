import { useState, useCallback } from 'react';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface UploadResult {
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
}

export function useLocalUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null
  });

  const uploadFile = useCallback(async (
    file: File,
    type: 'avatar' | 'post' | 'general' = 'general',
    userId?: string
  ): Promise<UploadResult | null> => {
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (userId) {
        formData.append('userId', userId);
      }

      // Simuler le progrès
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 100);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      
      setUploadState({
        isUploading: false,
        progress: 100,
        error: null
      });

      // Réinitialiser le progrès après un délai
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, progress: 0 }));
      }, 1000);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
      
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage
      });

      return null;
    }
  }, []);

  const uploadAvatar = useCallback(async (
    file: File,
    userId: string
  ): Promise<UploadResult | null> => {
    return uploadFile(file, 'avatar', userId);
  }, [uploadFile]);

  const uploadPostImage = useCallback(async (
    file: File,
    userId: string
  ): Promise<UploadResult | null> => {
    return uploadFile(file, 'post', userId);
  }, [uploadFile]);

  const clearError = useCallback(() => {
    setUploadState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null
    });
  }, []);

  return {
    ...uploadState,
    uploadFile,
    uploadAvatar,
    uploadPostImage,
    clearError,
    reset
  };
}

