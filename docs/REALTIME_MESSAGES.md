# Messages en Temps Réel - INKSPOT

## Vue d'ensemble

Ce document décrit le nouveau système de messages en temps réel implémenté avec Socket.IO pour permettre la réception instantanée des messages dans les conversations.

## Fonctionnalités

### ✅ **Messages en temps réel**
- Réception instantanée des messages
- Pas de rechargement de page nécessaire
- Mise à jour automatique de la liste des messages

### ✅ **Indicateurs de frappe**
- Affichage "X est en train d'écrire..."
- Gestion de plusieurs utilisateurs qui tapent
- Arrêt automatique après 2 secondes d'inactivité

### ✅ **Statut en ligne**
- Mise à jour en temps réel du statut
- Indicateurs visuels clairs
- Gestion des déconnexions

### ✅ **Confirmations de lecture**
- Marquage automatique des messages comme lus
- Synchronisation entre participants
- Indicateurs visuels de statut

## Architecture

### 1. **Serveur Socket.IO** (`lib/websocket.ts`)
- **Rooms de conversation** : Chaque conversation a sa propre room
- **Authentification** : Vérification des sessions utilisateur
- **Diffusion sécurisée** : Messages envoyés uniquement aux participants

### 2. **Client Socket.IO** (`hooks/useSocketIO.ts`)
- **Connexion automatique** : Gestion des connexions/déconnexions
- **Reconnexion** : Tentative automatique en cas de perte de connexion
- **Gestion des événements** : Traitement des différents types de messages

### 3. **Interface utilisateur**
- **Indicateurs de frappe** : Composant `TypingIndicator`
- **Liste des messages** : Mise à jour automatique
- **Statut en ligne** : Indicateurs visuels

## Utilisation

### Dans une page de conversation

```tsx
import { useSocketIO } from '@/hooks/useSocketIO'
import { TypingIndicator } from '@/components/chat/TypingIndicator'

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([])

  const {
    isConnected,
    sendMessage,
    startTyping,
    stopTyping
  } = useSocketIO({
    conversationId: 'conv123',
    onMessage: (data) => {
      if (data.type === 'NEW_MESSAGE') {
        // Ajouter le nouveau message
        const newMessage = data.message
        setMessages(prev => [...prev, newMessage])
      }
    },
    onTypingIndicator: (data) => {
      if (data.type === 'USER_TYPING') {
        setTypingUsers(prev => [...prev, { userId: data.userId, userName: data.userName }])
      } else if (data.type === 'USER_STOP_TYPING') {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId))
      }
    }
  })

  return (
    <div>
      {/* Liste des messages */}
      <MessageList messages={messages} />
      
      {/* Indicateur de frappe */}
      <TypingIndicator typingUsers={typingUsers} />
      
      {/* Input pour envoyer des messages */}
      <MessageInput
        onSendMessage={sendMessage}
        onStartTyping={startTyping}
        onStopTyping={stopTyping}
        senderName="Votre nom"
      />
    </div>
  )
}
```

### Gestion des indicateurs de frappe

```tsx
// Démarrer l'indicateur de frappe
const handleTypingStart = () => {
  startTyping('Votre nom')
}

// Arrêter l'indicateur de frappe
const handleTypingStop = () => {
  stopTyping('Votre nom')
}

// Dans le composant MessageInput
<Input
  onKeyDown={handleTypingStart}
  onKeyUp={handleTypingStop}
  onChange={(e) => setMessage(e.target.value)}
/>
```

## Sécurité

### **Authentification**
- Vérification des sessions NextAuth
- Tokens d'authentification Socket.IO
- Validation des permissions de conversation

### **Isolation des données**
- Rooms séparées par conversation
- Messages diffusés uniquement aux participants
- Pas d'accès croisé entre conversations

### **Validation**
- Vérification des types de messages
- Sanitisation des contenus
- Protection contre les injections

## Performance

### **Optimisations**
- **Connexions uniques** : Un seul Socket.IO par utilisateur
- **Rooms intelligentes** : Rejoindre/quitter automatiquement
- **Nettoyage automatique** : Suppression des connexions inactives

### **Gestion de la mémoire**
- Limitation du nombre de messages en mémoire
- Nettoyage des indicateurs de frappe
- Gestion des timeouts de reconnexion

## Dépannage

### **Problèmes courants**

1. **Messages non reçus**
   - Vérifier la connexion Socket.IO dans la console
   - Vérifier que l'utilisateur est dans la bonne room
   - Vérifier les permissions de conversation

2. **Indicateurs de frappe ne fonctionnent pas**
   - Vérifier les appels `startTyping`/`stopTyping`
   - Vérifier que `senderName` est passé
   - Vérifier la gestion des timeouts

3. **Déconnexions fréquentes**
   - Vérifier la stabilité du réseau
   - Vérifier la configuration du serveur
   - Ajuster les paramètres de reconnexion

### **Logs de débogage**

```typescript
// Activer les logs détaillés
console.log('Socket.IO connected:', isConnected)
console.log('Typing users:', typingUsers)
console.log('New message received:', data)
```

## Configuration

### **Variables d'environnement**

```env
# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Configuration Socket.IO
SOCKET_IO_PATH=/api/socketio
SOCKET_IO_CORS_ORIGIN=http://localhost:3000
```

### **Paramètres Socket.IO**

```typescript
// Dans hooks/useSocketIO.ts
const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
  path: '/api/socketio',
  transports: ['websocket', 'polling'],
  timeout: 20000,
  reconnection: true,
  reconnectionDelay: 1000,
  maxReconnectionAttempts: 5
})
```

## Tests

### **Tests unitaires**

```bash
# Tests des composants
npm run test -- --testPathPattern=typing-indicator
npm run test -- --testPathPattern=message-input

# Tests Socket.IO
npm run test -- --testPathPattern=socket-io
```

### **Tests d'intégration**

```bash
# Tests E2E des messages
npm run test:e2e -- --spec="realtime-messages.spec.ts"
```

## Monitoring

### **Métriques à surveiller**

- **Connexions actives** : Nombre d'utilisateurs connectés
- **Messages par seconde** : Volume de trafic
- **Taux de reconnexion** : Stabilité des connexions
- **Latence des messages** : Performance en temps réel

### **Alertes**

```bash
# Script de monitoring
#!/bin/bash
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "INKSPOT Socket.IO is down!" | mail -s "Alert: Socket.IO Down" admin@yourdomain.com
fi
```

## Support

### **En cas de problème**

1. **Vérifier les logs** : Console du navigateur et serveur
2. **Vérifier la connexion** : Statut Socket.IO
3. **Vérifier les rooms** : Participants connectés
4. **Vérifier l'authentification** : Session utilisateur

### **Documentation**

- **Code** : Commentaires dans le code source
- **API** : `/docs/ONLINE_STATUS_SYSTEM.md`
- **Messages** : Ce fichier
- **Déploiement** : `/docs/BUILD_AND_DEPLOYMENT.md`

## Exemples d'utilisation

### **Chat simple**

```tsx
const { sendMessage } = useSocketIO({
  conversationId: 'conv123',
  onMessage: (data) => {
    if (data.type === 'NEW_MESSAGE') {
      setMessages(prev => [...prev, data.message])
    }
  }
})

const handleSend = (content: string) => {
  sendMessage({
    content,
    type: 'text',
    conversationId: 'conv123',
    senderId: 'user123'
  })
}
```

### **Chat avec indicateurs de frappe**

```tsx
const { startTyping, stopTyping } = useSocketIO({
  conversationId: 'conv123',
  onTypingIndicator: (data) => {
    if (data.type === 'USER_TYPING') {
      setTypingUsers(prev => [...prev, { userId: data.userId, userName: data.userName }])
    }
  }
})

<Input
  onKeyDown={() => startTyping('Votre nom')}
  onKeyUp={() => stopTyping('Votre nom')}
/>
```

Le système est maintenant prêt pour les messages en temps réel ! 🚀
