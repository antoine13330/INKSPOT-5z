# Système de Statut en Ligne - INKSPOT

## Vue d'ensemble

Ce document décrit le nouveau système de statut en ligne implémenté pour résoudre le problème de statut incorrect lors de l'utilisation de comptes multiples.

## Problème résolu

**Avant** : Le statut en ligne était déterminé uniquement par la dernière activité de la conversation (`updatedAt`), ce qui causait des affichages incorrects du statut "hors ligne" même pour des utilisateurs actifs.

**Après** : Le statut en ligne est maintenant géré en temps réel via WebSocket, avec un fallback sur l'activité récente.

## Architecture

### 1. Gestionnaire WebSocket Centralisé (`lib/websocket-manager.ts`)

- **Singleton** : Une seule instance gère toutes les connexions
- **Gestion des comptes multiples** : Évite les conflits entre sessions
- **Reconnexion automatique** : Gère les déconnexions et reconnexions
- **Nettoyage automatique** : Nettoie les connexions inactives

### 2. API WebSocket (`app/api/websocket/route.ts`)

- **Authentification** : Vérifie la session utilisateur
- **Gestion des conversations** : Suit les utilisateurs dans chaque conversation
- **Notifications de statut** : Informe les participants des changements de statut

### 3. API de Statut (`app/api/users/[id]/online-status/route.ts`)

- **Statut en temps réel** : Récupère le statut actuel d'un utilisateur
- **Sécurité** : Vérifie les permissions d'accès
- **Fallback** : Fournit le statut même si WebSocket n'est pas disponible

### 4. Composant d'Interface (`components/ui/online-status-indicator.tsx`)

- **Indicateur visuel** : Point vert/gris + texte
- **Variantes** : Avec/sans icône, différentes tailles
- **Accessibilité** : Couleurs et contrastes appropriés

## Utilisation

### Dans une page de conversation

```tsx
import { useWebSocketManager } from '@/lib/websocket-manager'
import { OnlineStatusIndicatorWithIcon } from '@/components/ui/online-status-indicator'

export default function ConversationPage() {
  const { connect, disconnect } = useWebSocketManager()
  const [isOnline, setIsOnline] = useState(false)

  // Connexion WebSocket
  useEffect(() => {
    if (conversationId && session?.user?.id) {
      connect(session.user.id, conversationId, (message) => {
        if (message.type === 'USER_STATUS') {
          setIsOnline(message.status === 'online')
        }
      })
    }
    
    return () => {
      if (session?.user?.id) {
        disconnect(session.user.id)
      }
    }
  }, [conversationId, session?.user?.id])

  return (
    <div>
      <OnlineStatusIndicatorWithIcon 
        isOnline={isOnline} 
        showText={true}
        size="sm"
      />
    </div>
  )
}
```

### Gestion des comptes multiples

Le système gère automatiquement les comptes multiples :

1. **Connexion unique** : Chaque utilisateur a une seule connexion WebSocket
2. **Isolation** : Les statuts sont isolés par utilisateur
3. **Nettoyage** : Les connexions sont nettoyées au démontage

## Configuration

### Variables d'environnement

```env
# URL de l'application (pour CORS WebSocket)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Paramètres WebSocket

```typescript
// Dans lib/websocket-manager.ts
private maxReconnectAttempts = 5
private reconnectInterval = 3000
```

## Dépannage

### Problèmes courants

1. **Statut toujours "hors ligne"**
   - Vérifier la connexion WebSocket dans la console
   - Vérifier que l'API `/api/websocket` fonctionne

2. **Conflits entre comptes**
   - Vérifier que chaque utilisateur a un ID unique
   - Vérifier la gestion des sessions

3. **Reconnexions fréquentes**
   - Vérifier la stabilité du réseau
   - Ajuster `reconnectInterval` si nécessaire

### Logs de débogage

```typescript
// Activer les logs détaillés
console.log('WebSocket connected for user', userId)
console.log('User status update:', message)
console.log('WebSocket disconnected for user', userId)
```

## Performance

### Optimisations

- **Connexions uniques** : Un seul WebSocket par utilisateur
- **Nettoyage automatique** : Suppression des connexions inactives
- **Reconnexion intelligente** : Tentatives limitées avec délai

### Métriques

- **Connexions actives** : `websocketManager.getActiveConnectionsCount()`
- **Statut de connexion** : `websocketManager.isConnected(userId)`

## Sécurité

### Authentification

- **Session NextAuth** : Vérification obligatoire
- **Tokens** : Validation des tokens d'authentification
- **Permissions** : Vérification des accès aux conversations

### Protection

- **CORS** : Configuration appropriée pour WebSocket
- **Validation** : Vérification des données reçues
- **Isolation** : Séparation des données entre utilisateurs

## Tests

### Tests unitaires

```bash
npm run test -- --testPathPattern=websocket
```

### Tests d'intégration

```bash
npm run test:e2e -- --spec="websocket-status.spec.ts"
```

## Maintenance

### Mise à jour

1. **Vérifier les dépendances** : WebSocket, Socket.IO
2. **Tester les reconnexions** : Simuler des déconnexions
3. **Vérifier la performance** : Nombre de connexions actives

### Monitoring

- **Logs** : Surveiller les erreurs de connexion
- **Métriques** : Nombre de connexions actives
- **Alertes** : Taux d'échec de connexion élevé

## Support

Pour toute question ou problème avec le système de statut en ligne, consultez :

1. **Logs de la console** : Erreurs WebSocket
2. **Network tab** : Connexions WebSocket
3. **Documentation** : Ce fichier et les commentaires du code
