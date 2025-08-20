# Migration de S3 vers le Stockage Local

Ce document explique comment migrer votre application de AWS S3 vers le stockage local dans le dossier `public` de Next.js.

## 🎯 Avantages du Stockage Local

- **Pas de coûts** : Aucun frais AWS
- **Développement simplifié** : Pas besoin de configurer les credentials AWS
- **Performance locale** : Accès direct aux fichiers
- **Contrôle total** : Gestion complète des fichiers
- **Déploiement simple** : Fichiers inclus dans le build

## 📁 Structure des Dossiers

```
public/
├── uploads/
│   ├── avatars/          # Avatars des utilisateurs
│   ├── posts/            # Images des posts
│   └── temp/             # Fichiers temporaires
```

## 🔧 Configuration

### 1. Mise à jour de `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  images: {
    // Configuration pour les images locales
    domains: ['localhost'],
    // Plus besoin de remotePatterns pour S3
  },
  // ... autres configurations
};
```

### 2. Variables d'environnement

Vous pouvez supprimer ces variables AWS :
```bash
# Supprimer ou commenter
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=
# AWS_S3_BUCKET=
```

## 📤 Utilisation

### Hook personnalisé

```typescript
import { useLocalUpload } from '@/hooks/useLocalUpload';

function MyComponent() {
  const { uploadAvatar, isUploading, progress, error } = useLocalUpload();

  const handleFileUpload = async (file: File) => {
    const result = await uploadAvatar(file, userId);
    if (result) {
      console.log('Avatar uploadé:', result.url);
    }
  };

  return (
    // Votre composant
  );
}
```

### Composant d'upload

```typescript
import { LocalImageUpload } from '@/components/ui/local-image-upload';

<LocalImageUpload
  onUpload={(url, fileName) => console.log('Uploadé:', url)}
  type="avatar"
  userId={userId}
  maxSize={5} // 5MB
  acceptedTypes={['image/jpeg', 'image/png']}
/>
```

### API directe

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('type', 'avatar');
formData.append('userId', userId);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log('URL:', result.url);
```

## 🚀 Fonctionnalités

### Types d'upload supportés

- **`avatar`** : Avatars des utilisateurs
- **`post`** : Images des posts
- **`general`** : Fichiers généraux (stockés dans `temp`)

### Validation automatique

- Types de fichiers autorisés
- Taille maximale configurable
- Génération de noms uniques
- Gestion des erreurs

### Sécurité

- Validation des types MIME
- Limitation de taille
- Noms de fichiers sécurisés
- Isolation par dossier

## 📱 Composants disponibles

### `LocalImageUpload`

Composant complet avec drag & drop, prévisualisation et gestion d'erreurs.

### `ProfileAvatarUpload`

Composant spécialisé pour les avatars de profil avec exemple d'utilisation.

## 🔄 Migration des Données Existantes

### 1. Télécharger depuis S3

```typescript
// Script de migration (à exécuter une fois)
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { writeFile } from 'fs/promises';

async function migrateFromS3() {
  // Télécharger chaque fichier depuis S3
  // L'uploader vers le stockage local
  // Mettre à jour la base de données
}
```

### 2. Mettre à jour la base de données

```sql
-- Exemple de mise à jour des URLs
UPDATE users 
SET avatar = REPLACE(avatar, 'https://bucket.s3.amazonaws.com', '/uploads/avatars')
WHERE avatar LIKE '%s3.amazonaws.com%';
```

## ⚠️ Limitations

### Développement vs Production

- **Développement** : Stockage local parfait
- **Production** : Considérer la scalabilité

### Stockage

- Les fichiers sont stockés sur le serveur
- Pas de réplication automatique
- Sauvegarde manuelle nécessaire

### Performance

- Pas d'optimisation automatique des images
- Pas de CDN intégré
- Limité par l'espace disque

## 🚀 Déploiement

### Vercel

Les fichiers dans `public/` sont automatiquement servis statiquement.

### Docker

```dockerfile
# Copier les uploads existants
COPY public/uploads ./public/uploads
```

### Autres plateformes

Vérifiez que le dossier `public/uploads` est bien inclus dans votre déploiement.

## 🔧 Maintenance

### Nettoyage des fichiers temporaires

```typescript
import { cleanupTempFiles } from '@/lib/local-storage';

// Nettoyer les fichiers de plus de 24h
await cleanupTempFiles(24 * 60 * 60 * 1000);
```

### Surveillance de l'espace disque

```typescript
import { listFiles } from '@/lib/local-storage';

// Lister tous les fichiers
const avatars = await listFiles('avatars');
const posts = await listFiles('posts');
```

## 📚 Exemples Complets

Voir les composants dans :
- `components/ui/local-image-upload.tsx`
- `components/profile-avatar-upload.tsx`
- `hooks/useLocalUpload.ts`

## 🆘 Support

En cas de problème :

1. Vérifiez que les dossiers `public/uploads/*` existent
2. Vérifiez les permissions d'écriture
3. Consultez les logs de l'API `/api/upload`
4. Vérifiez que le package `uuid` est installé

## 🔮 Évolutions Futures

- Compression automatique des images
- Redimensionnement automatique
- Système de cache
- Migration vers un autre service cloud si nécessaire

