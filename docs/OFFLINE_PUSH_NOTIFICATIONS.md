# Système de Notifications Push Hors Ligne

Ce système envoie automatiquement des notifications push aux utilisateurs non connectés lorsqu'ils reçoivent des messages, propositions, images ou invitations de collaboration.

## Architecture

### 1. Détection d'utilisateurs hors ligne
- **Fichier**: `lib/offline-push-notifications.ts`
- **Fonction principale**: `isUserOffline(userId: string)`
- Vérifie via le système WebSocket si l'utilisateur est connecté
- Fallback sur `lastActiveAt` si pas d'information WebSocket
- Considère un utilisateur hors ligne après 5 minutes d'inactivité

### 2. Types de notifications supportés

#### Messages
- **Déclencheur**: Nouveaux messages dans conversations
- **Intégration**: `app/api/conversations/create/route.ts`, `app/api/messages/realtime/route.ts`
- **Actions**: Répondre, Voir

#### Propositions/Bookings
- **Déclencheur**: Nouvelles réservations
- **Intégration**: `app/api/bookings/route.ts`
- **Actions**: Accepter, Voir détails

#### Images/Posts
- **Déclencheur**: Nouveaux posts avec images
- **Intégration**: `app/api/posts/create/route.ts`
- **Fonctions helper**: `lib/image-notification-helpers.ts`
- **Actions**: Voir l'image, J'aime

#### Collaborations
- **Déclencheur**: Invitations de collaboration
- **Intégration**: `app/api/collaborations/route.ts`
- **Actions**: Accepter, Voir détails

### 3. Service Worker amélioré
- **Fichier**: `public/sw.js`
- Gestion intelligente des différents types de notifications
- Actions contextuelles selon le type
- Navigation intelligente vers les bonnes pages

### 4. API de gestion des abonnements
- **Base**: `/api/push-subscriptions`
- **Préférences**: `/api/push-subscriptions/preferences`
- **Test**: `/api/push-subscriptions/test`

## Utilisation

### 1. Côté client - Abonnement aux notifications

```tsx
import { PushNotificationSetup } from "@/components/push-notification-setup"

// Dans un composant ou page
<PushNotificationSetup 
  showSettings={true} 
  autoPrompt={false} 
/>
```

### 2. Côté serveur - Envoi de notifications

```typescript
import { 
  notifyOfflineUserForMessage,
  notifyOfflineUserForProposal,
  notifyOfflineUserForImage,
  notifyOfflineUserForCollaboration
} from "@/lib/offline-push-notifications"

// Pour un message
await notifyOfflineUserForMessage(
  recipientId,
  senderId,
  conversationId,
  messageContent
)

// Pour une proposition
await notifyOfflineUserForProposal(
  recipientId,
  senderId,
  {
    bookingId: booking.id,
    title: "Nouvelle réservation"
  }
)

// Pour une image
await notifyOfflineUserForImage(
  recipientId,
  senderId,
  {
    postId: post.id,
    imageUrl: "https://...",
    content: "Nouvelle image partagée"
  }
)

// Pour une collaboration
await notifyOfflineUserForCollaboration(
  recipientId,
  senderId,
  {
    collaborationId: collab.id,
    postId: post.id
  }
)
```

### 3. Fonctions utilitaires

```typescript
import { 
  notifyOfflineConversationMembers,
  notifyInterestedUsersForNewPost 
} from "@/lib/offline-push-notifications"

// Notifier tous les membres d'une conversation
await notifyOfflineConversationMembers(
  conversationId,
  senderId,
  messageContent
)

// Notifier les utilisateurs intéressés par un nouveau post
await notifyInterestedUsersForNewPost(
  postId,
  authorId,
  imageUrls,
  content
)
```

## Configuration requise

### 1. Variables d'environnement
```env
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
EMAIL_FROM=noreply@yourdomain.com
```

### 2. Base de données
Les tables suivantes doivent exister (déjà dans le schema Prisma):
- `PushSubscription`
- `DevicePreferences`
- `Notification`

### 3. Manifest Web App
Le fichier `public/manifest.json` doit être configuré pour PWA.

## Test du système

### 1. Test via l'interface
1. Aller sur une page avec le composant `PushNotificationSetup`
2. Activer les notifications
3. Utiliser le bouton "Envoyer une notification de test"

### 2. Test via API
```bash
curl -X POST http://localhost:3000/api/push-subscriptions/test \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"title": "Test", "message": "Test message"}'
```

### 3. Test en conditions réelles
1. S'abonner aux notifications sur un appareil
2. Se déconnecter ou fermer l'application
3. Faire envoyer un message/proposition depuis un autre compte
4. Vérifier que la notification arrive

## Bonnes pratiques

### 1. Gestion des erreurs
- Toutes les fonctions de notification sont wrappées dans des try/catch
- Les erreurs de notification ne font jamais échouer les actions principales
- Logs détaillés pour le debugging

### 2. Performance
- Vérification rapide du statut en ligne avant envoi
- Envoi en lot pour les notifications multiples
- Cache des vérifications d'abonnement

### 3. UX
- Permission demandée de manière non intrusive
- Actions contextuelles dans les notifications
- Navigation intelligente vers les bonnes pages

### 4. Sécurité
- Vérification des permissions utilisateur
- Validation des données d'abonnement
- Protection contre le spam de notifications

## Dépannage

### 1. Notifications pas reçues
- Vérifier les permissions du navigateur
- Vérifier les clés VAPID
- Vérifier que le service worker est enregistré
- Consulter les logs serveur

### 2. Mauvaise navigation
- Vérifier les URLs dans les payloads de notification
- Vérifier la gestion des actions dans le service worker

### 3. Performance
- Monitorer le nombre d'abonnements actifs
- Nettoyer régulièrement les abonnements expirés
- Optimiser les requêtes de vérification de statut

## Évolutions futures

1. **Notifications groupées**: Regrouper plusieurs notifications du même type
2. **Notifications programmées**: Différer l'envoi selon les préférences utilisateur
3. **Analytics**: Tracker les taux d'ouverture et d'interaction
4. **A/B Testing**: Tester différents messages et formats
5. **Rich Notifications**: Images et actions plus avancées

