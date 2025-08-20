'use client';

import React from 'react';
import { ProfileAvatarUpload } from '@/components/profile-avatar-upload';
import { LocalImageUpload } from '@/components/ui/local-image-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function DemoUploadPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Démonstration du Stockage Local</h1>
        <p className="text-lg text-muted-foreground">
          Testez le nouveau système d'upload local qui remplace S3
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload d'avatar */}
        <Card>
          <CardHeader>
            <CardTitle>Upload d'Avatar</CardTitle>
            <CardDescription>
              Testez l'upload d'avatar avec le composant ProfileAvatarUpload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileAvatarUpload
              onAvatarChange={(url) => {
                // Avatar changed (removed console.log for production)
              }}
            />
          </CardContent>
        </Card>

        {/* Upload d'image de post */}
        <Card>
          <CardHeader>
            <CardTitle>Upload d'Image de Post</CardTitle>
            <CardDescription>
              Testez l'upload d'image de post avec le composant LocalImageUpload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocalImageUpload
              onUpload={(url, fileName) => {
                // Image uploaded (removed console.log for production)
                alert(`Uploadé avec succès!\nURL: ${url}\nNom: ${fileName}`);
              }}
              type="post"
              userId="demo-user-123"
              label="Upload d'image de post"
              maxSize={10}
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Informations sur le système */}
      <Card>
        <CardHeader>
          <CardTitle>Informations sur le Système de Stockage Local</CardTitle>
          <CardDescription>
            Détails sur la migration de S3 vers le stockage local
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Avantages</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Pas de coûts AWS</li>
                <li>• Développement simplifié</li>
                <li>• Performance locale</li>
                <li>• Contrôle total</li>
                <li>• Déploiement simple</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Structure des Dossiers</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code>public/uploads/avatars/</code></li>
                <li>• <code>public/uploads/posts/</code></li>
                <li>• <code>public/uploads/temp/</code></li>
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Fonctionnalités</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Validation automatique des types de fichiers</li>
              <li>• Limitation de taille configurable</li>
              <li>• Génération de noms uniques sécurisés</li>
              <li>• Gestion des erreurs complète</li>
              <li>• Support du drag & drop</li>
              <li>• Prévisualisation des images</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Utilisation</h4>
            <div className="bg-muted p-4 rounded-lg">
              <code className="text-sm">
                {`import { LocalImageUpload } from '@/components/ui/local-image-upload';

<LocalImageUpload
  onUpload={(url, fileName) => console.log('Uploadé:', url)}
  type="avatar"
  userId={userId}
  maxSize={5}
/>`}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

