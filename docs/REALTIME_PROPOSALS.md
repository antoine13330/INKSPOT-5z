# Système de Propositions en Temps Réel

## Vue d'ensemble

Ce document décrit le système de suivi en temps réel des propositions de rendez-vous dans l'application INKSPOT. Le système permet aux utilisateurs de voir instantanément les changements de statut des propositions et les nouvelles propositions reçues.

## Architecture

### 1. Extensions WebSocket

Le système étend le serveur WebSocket existant (`lib/websocket.ts`) avec de nouveaux événements :

- **`proposal-status-update`** : Émis quand un client change le statut d'une proposition
- **`new-proposal`** : Émis quand une nouvelle proposition est créée
- **`proposal-status-changed`** : Reçu par tous les participants d'une conversation quand un statut change
- **`proposal-created`** : Reçu par tous les participants quand une nouvelle proposition est créée

### 2. Émetteur WebSocket (`lib/websocket-emitter.ts`)

Fonctions utilitaires pour émettre des événements WebSocket depuis les APIs :

```typescript
emitProposalStatusUpdate(data: {
  appointmentId: string
  status: string
  conversationId: string
  changedBy: string
})

emitNewProposal(data: {
  appointmentId: string
  conversationId: string
  proposalData: any
})
```

### 3. Hook de Temps Réel (`hooks/useProposalRealtime.ts`)

Hook React personnalisé pour gérer les événements temps réel :

```typescript
const {
  proposalUpdates,
  newProposals,
  isConnected,
  emitProposalStatusUpdate,
  emitNewProposal,
  clearProposalUpdates,
  clearNewProposals
} = useProposalRealtime({
  conversationId,
  userId,
  onProposalStatusChange,
  onNewProposal
})
```

### 4. Composant d'Indicateur (`components/conversation/ProposalRealtimeIndicator.tsx`)

Composant qui affiche les notifications temps réel des propositions dans les conversations.

## Points d'Intégration

### APIs Modifiées

1. **`/api/appointments/propose`** : Émet un événement `new-proposal` après la création
2. **`/api/appointments/[id]/status`** : Émet un événement `proposal-status-update` après la modification
3. **`/api/appointments/[id]/respond`** : Émet un événement `proposal-status-update` après la réponse

### Interface Utilisateur

Le composant `ProposalRealtimeIndicator` est intégré dans :
- **Page de conversation** (`app/conversations/[id]/page.tsx`) : Affiché entre les messages et la zone de saisie

## Fonctionnalités

### 1. Notifications Temps Réel

- **Changements de statut** : Notifications visuelles quand une proposition change de statut
- **Nouvelles propositions** : Alertes quand une nouvelle proposition est reçue
- **Messages toast** : Notifications push pour les changements importants

### 2. Indicateurs Visuels

- **Badges de statut** : Affichage coloré des différents statuts
- **Animations** : Transitions fluides pour les nouvelles notifications
- **Auto-masquage** : Les notifications disparaissent automatiquement après un délai

### 3. Statuts Supportés

- **PROPOSED** : Proposition initiale (bleu)
- **ACCEPTED** : Acceptée par le client (vert)
- **REJECTED** : Refusée par le client (rouge)
- **CANCELLED** : Annulée (gris)
- **CONFIRMED** : Confirmée par le pro (vert émeraude)
- **COMPLETED** : Terminée (violet)
- **RESCHEDULED** : À reporter (orange)

## Utilisation

### Pour les Développeurs

1. **Créer une nouvelle proposition** :
   ```typescript
   // L'événement temps réel est automatiquement émis
   fetch('/api/appointments/propose', { method: 'POST', ... })
   ```

2. **Changer le statut d'une proposition** :
   ```typescript
   // L'événement temps réel est automatiquement émis
   fetch('/api/appointments/[id]/status', { method: 'PATCH', ... })
   ```

3. **Écouter les événements dans un composant** :
   ```typescript
   useProposalRealtime({
     conversationId: 'conversation-id',
     userId: 'user-id',
     onProposalStatusChange: (data) => {
       // Gérer le changement de statut
     },
     onNewProposal: (data) => {
       // Gérer la nouvelle proposition
     }
   })
   ```

### Pour les Utilisateurs

1. **Indicateur de connexion** : Badge vert/rouge pour indiquer l'état de la connexion temps réel
2. **Notifications automatiques** : Apparaissent automatiquement pour les changements de propositions
3. **Actions rapides** : Boutons pour voir les détails ou masquer les notifications

## Configuration

### Variables d'Environnement

- `WEBSOCKET_URL` : URL du serveur WebSocket (optionnel, utilise l'URL courante par défaut)
- `NEXT_PUBLIC_APP_URL` : URL de l'application pour les CORS WebSocket

### Délais

- **Auto-masquage des notifications** : 10 secondes pour les changements de statut, 15 secondes pour les nouvelles propositions
- **Reconnexion WebSocket** : Automatique avec backoff exponentiel

## Debugging

### Logs de Développement

```javascript
// Vérifier les événements WebSocket dans la console
console.log('[ProposalRealtime] Status change received:', data)
console.log('[WebSocket] Proposal status update emitted:', data)
```

### Vérification de Connexion

```typescript
const { isConnected } = useProposalRealtime({ ... })
// isConnected indique l'état de la connexion WebSocket
```

## Performances

- **Optimisations** : Utilisation de `useCallback` pour éviter les re-rendus inutiles
- **Nettoyage** : Déconnexion automatique des listeners WebSocket au démontage
- **Efficacité** : Événements ciblés par conversation pour réduire le trafic

## Compatibilité

- **Navigateurs** : Tous les navigateurs modernes supportant WebSocket
- **Mobile** : Compatible avec les applications React Native
- **Fallback** : Le système fonctionne toujours sans WebSocket (rechargement manuel)
