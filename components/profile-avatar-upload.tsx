'use client';

import React, { useState } from 'react';
import { LocalImageUpload } from '@/components/ui/local-image-upload';
import { useLocalUpload } from '@/hooks/useLocalUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ProfileAvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange?: (avatarUrl: string) => void;
  className?: string;
}

export function ProfileAvatarUpload({
  currentAvatar,
  onAvatarChange,
  className
}: ProfileAvatarUploadProps) {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentAvatar);
  const { uploadAvatar, isUploading, progress, error, clearError } = useLocalUpload();

  const handleAvatarUpload = async (url: string, fileName: string) => {
    console.log('Avatar uploadé:', { url, fileName });
    setAvatarUrl(url);
    onAvatarChange?.(url);
  };

  const handleAvatarRemove = () => {
    setAvatarUrl(undefined);
    onAvatarChange?.('');
  };

  if (!session?.user?.id) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Avatar du profil</CardTitle>
          <CardDescription>
            Connectez-vous pour modifier votre avatar
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Avatar du profil
        </CardTitle>
        <CardDescription>
          Personnalisez votre avatar de profil. Formats supportés: PNG, JPG, GIF, WebP
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Affichage de l'avatar actuel */}
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={avatarUrl} alt="Avatar du profil" />
            <AvatarFallback className="text-lg">
              <User className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h4 className="font-medium">Avatar actuel</h4>
            <p className="text-sm text-muted-foreground">
              {avatarUrl ? 'Avatar personnalisé' : 'Aucun avatar défini'}
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Upload en cours...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-auto p-1"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* Composant d'upload */}
        <LocalImageUpload
          onUpload={handleAvatarUpload}
          onRemove={handleAvatarRemove}
          type="avatar"
          userId={session.user.id}
          currentImage={avatarUrl}
          label="Changer l'avatar"
          maxSize={5} // 5MB max pour les avatars
          acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
        />

        {/* Informations supplémentaires */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Taille maximale: 5MB</p>
          <p>• Formats recommandés: PNG, JPG</p>
          <p>• L'image sera automatiquement redimensionnée si nécessaire</p>
        </div>
      </CardContent>
    </Card>
  );
}

