# Système de Mise à Jour en Temps Réel des Paiements

## Vue d'ensemble

Ce système résout le problème où les utilisateurs ne voient pas immédiatement les confirmations de paiement Stripe dans l'interface. Il utilise une combinaison de WebSockets et de polling pour garantir que l'interface se met à jour automatiquement.

## Architecture

### 1. Webhook Stripe
- **Fichier** : `app/api/stripe/webhook/route.ts`
- **Fonction** : Écoute les événements Stripe et émet des notifications WebSocket
- **Événements gérés** :
  - `payment_intent.succeeded`
  - `checkout.session.completed`
  - `payment_intent.payment_failed`
  - `charge.refunded`

### 2. Hook React `usePaymentStatus`
- **Fichier** : `hooks/usePaymentStatus.ts`
- **Fonction** : Gère la connexion WebSocket et le polling de fallback
- **Fonctionnalités** :
  - Connexion WebSocket automatique
  - Reconnexion automatique en cas de déconnexion
  - Polling de fallback (30s par défaut)
  - Gestion des événements de paiement

### 3. Composants d'Interface
- **`PaymentStatusNotifier`** : Notification globale des changements de statut
- **`PaymentStatusDisplay`** : Affichage du statut de paiement en temps réel
- **`AutoRefreshAppointments`** : Rafraîchissement automatique des listes
- **`PaymentNotificationProvider`** : Provider global pour les notifications

## Utilisation

### 1. Dans le Layout Principal

```tsx
// app/layout.tsx
import { PaymentNotificationProvider } from '@/components/layout/PaymentNotificationProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <PaymentNotificationProvider>
          {children}
        </PaymentNotificationProvider>
      </body>
    </html>
  )
}
```

### 2. Dans une Page de Rendez-vous

```tsx
import { PaymentStatusDisplay } from '@/components/payments/PaymentStatusDisplay'
import { AutoRefreshAppointments } from '@/components/appointments/AutoRefreshAppointments'

export default function AppointmentPage() {
  const [appointments, setAppointments] = useState([])
  
  const refreshAppointments = () => {
    // Logique de rafraîchissement
  }
  
  return (
    <AutoRefreshAppointments onRefresh={refreshAppointments}>
      {appointments.map(appointment => (
        <PaymentStatusDisplay
          key={appointment.id}
          appointmentId={appointment.id}
          initialStatus={appointment.paymentStatus}
          amount={appointment.amount}
          currency={appointment.currency}
        />
      ))}
    </AutoRefreshAppointments>
  )
}
```

### 3. Dans un Composant Personnalisé

```tsx
import { usePaymentStatus } from '@/hooks/usePaymentStatus'

export function MyComponent() {
  const { refreshData, isConnected } = usePaymentStatus({
    onPaymentConfirmed: (data) => {
      console.log('Paiement confirmé:', data)
      // Logique personnalisée
    },
    onStatusUpdated: (data) => {
      console.log('Statut mis à jour:', data)
      // Logique personnalisée
    }
  })
  
  return (
    <div>
      <p>Statut de connexion: {isConnected ? 'Connecté' : 'Déconnecté'}</p>
      <button onClick={refreshData}>Rafraîchir</button>
    </div>
  )
}
```

## Configuration

### Variables d'Environnement

```bash
# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3001
WS_PORT=3001

# Stripe
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Configuration WebSocket

Le système utilise Socket.IO côté serveur. Assurez-vous que le serveur WebSocket est configuré et accessible.

## Gestion des Erreurs

### Fallback WebSocket → Polling

Si la connexion WebSocket échoue, le système bascule automatiquement vers un polling toutes les 30 secondes.

### Reconnexion Automatique

En cas de déconnexion WebSocket, le système tente de se reconnecter automatiquement toutes les 3 secondes.

### Logs et Monitoring

- Les erreurs WebSocket sont loggées dans la console
- Les événements de paiement sont tracés
- Les tentatives de reconnexion sont monitorées

## Avantages

1. **Temps réel** : Mise à jour immédiate de l'interface
2. **Robuste** : Fallback vers le polling si WebSocket échoue
3. **Automatique** : Aucune action manuelle requise
4. **Performant** : Utilise les WebSockets pour la latence minimale
5. **Flexible** : Callbacks personnalisables pour chaque composant

## Dépannage

### Problème : Les mises à jour ne s'affichent pas

1. Vérifiez la connexion WebSocket dans la console
2. Assurez-vous que le serveur WebSocket est en cours d'exécution
3. Vérifiez les variables d'environnement
4. Consultez les logs du webhook Stripe

### Problème : WebSocket ne se connecte pas

1. Vérifiez l'URL WebSocket dans les variables d'environnement
2. Assurez-vous que le port est accessible
3. Vérifiez la configuration CORS si nécessaire

### Problème : Polling trop fréquent

1. Ajustez l'intervalle dans `usePaymentStatus`
2. Désactivez le polling si WebSocket fonctionne
3. Optimisez les appels API de rafraîchissement

