# Notifications en Temps Réel - Propositions de Rendez-vous

## Vue d'ensemble

Ce document décrit le système de notifications en temps réel pour les propositions de rendez-vous dans INKSPOT. Le système utilise WebSocket (Socket.IO) pour diffuser instantanément les nouvelles propositions et les changements de statut.

## Architecture

### Composants principaux

1. **Serveur WebSocket** (`lib/websocket.ts`)
   - Gère les connexions Socket.IO
   - Gère les rooms de conversation
   - Émet les événements en temps réel

2. **Émetteur WebSocket** (`lib/websocket-emitter.ts`)
   - Émet les événements depuis les API routes
   - Utilise le serveur Socket.IO pour diffuser

3. **Hook useSocketIO** (`hooks/useSocketIO.ts`)
   - Gère la connexion côté client
   - Écoute les événements WebSocket
   - Gère la reconnexion automatique

4. **Hook useProposalNotifications** (`hooks/useProposalNotifications.ts`)
   - Hook spécialisé pour les notifications de propositions
   - Gère l'état des propositions récentes
   - Affiche les notifications toast

### Flux de données

```
API Route → WebSocket Emitter → Socket.IO Server → Client WebSocket → Hook → UI
```

## Événements WebSocket

### Événements émis

- `proposal-created` : Nouvelle proposition créée
- `proposal-status-changed` : Statut d'une proposition modifié

### Événements écoutés

- `conversation-message` : Nouveau message dans la conversation
- `typing-indicator` : Indicateur de frappe
- `user-status` : Changement de statut utilisateur
- `message-read` : Message marqué comme lu

## Utilisation

### Dans un composant de conversation

```tsx
import { useProposalNotifications } from '@/hooks/useProposalNotifications'

function ConversationComponent({ conversationId }) {
  const {
    recentProposals,
    isConnected,
    clearProposal,
    clearAllProposals
  } = useProposalNotifications({
    conversationId,
    onProposalReceived: (proposal) => {
      // Rafraîchir les données
      refetchConversation()
    },
    onProposalStatusChanged: (data) => {
      // Gérer le changement de statut
      refetchConversation()
    },
    showToastNotifications: true
  })

  return (
    <div>
      {/* Affichage des propositions récentes */}
      {recentProposals.map(proposal => (
        <ProposalNotification
          key={proposal.appointmentId}
          proposal={proposal}
          onAccept={() => handleAccept(proposal.appointmentId)}
          onReject={() => handleReject(proposal.appointmentId)}
        />
      ))}
    </div>
  )
}
```

### Composant de notification

```tsx
import { ProposalNotification } from '@/components/ui/proposal-notification'

<ProposalNotification
  proposal={proposalData}
  onAccept={handleAccept}
  onReject={handleReject}
  onView={handleView}
  onDismiss={handleDismiss}
/>
```

## Configuration

### Variables d'environnement

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
WEBSOCKET_URL=ws://localhost:3001
```

### Configuration Socket.IO

Le serveur Socket.IO est configuré avec :
- Path : `/api/socketio`
- CORS activé
- Authentification par token
- Rooms de conversation avec préfixe `conversation:`

## Dépannage

### Problèmes courants

1. **Notifications non reçues**
   - Vérifier la connexion WebSocket
   - Vérifier que l'utilisateur est dans la bonne room
   - Vérifier les logs du serveur

2. **Connexion perdue**
   - Le système se reconnecte automatiquement
   - Vérifier la stabilité du réseau
   - Vérifier la configuration CORS

3. **Événements non émis**
   - Vérifier que le serveur Socket.IO est initialisé
   - Vérifier les logs de l'émetteur
   - Vérifier que la room existe

### Logs utiles

```bash
# Logs de connexion
[WebSocket] User connected: userId

# Logs d'émission
[WebSocket] New proposal emitted to conversation conversationId: appointmentId

# Logs de room
User userId joined conversation room conversation:conversationId
```

## Tests

### Composant de test

Utilisez le composant `ProposalNotificationTest` pour tester les notifications :

```tsx
import { ProposalNotificationTest } from '@/components/debug/proposal-notification-test'

<ProposalNotificationTest conversationId="test-conversation" />
```

### Simulation d'événements

```javascript
// Simuler une nouvelle proposition
const event = new CustomEvent('proposal-created', { 
  detail: proposalData 
})
window.dispatchEvent(event)
```

## Performance

### Optimisations

- Nettoyage automatique des anciennes propositions (1 heure)
- Limitation du nombre de propositions affichées (5 max)
- Reconnexion automatique avec backoff
- Heartbeat toutes les 30 secondes

### Monitoring

- Statut de connexion WebSocket
- Nombre de propositions en cours
- Latence des notifications
- Taux de reconnexion

## Sécurité

- Authentification par token JWT
- Validation des permissions de conversation
- Isolation des rooms par conversation
- Rate limiting sur les événements

## Évolutions futures

- [ ] Notifications push pour les appareils mobiles
- [ ] Historique des notifications
- [ ] Préférences de notification par utilisateur
- [ ] Notifications groupées
- [ ] Support des pièces jointes dans les notifications
