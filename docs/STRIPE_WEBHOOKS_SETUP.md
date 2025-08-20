# Configuration des Webhooks Stripe pour INKSPOT

## 📋 Vue d'ensemble

Ce guide explique comment configurer les webhooks Stripe pour le système de rendez-vous INKSPOT.

## 🔧 Configuration en développement

### 1. Installer Stripe CLI

```bash
# Windows (avec Chocolatey)
choco install stripe

# macOS (avec Homebrew)
brew install stripe/stripe-cli/stripe

# Ou télécharger depuis : https://stripe.com/docs/stripe-cli
```

### 2. Authentifier Stripe CLI

```bash
stripe login
```

### 3. Variables d'environnement

Assurez-vous d'avoir ces variables dans votre `.env.local` :

```bash
# Clés Stripe (mode test)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Secret pour webhooks (sera généré)
STRIPE_WEBHOOK_APPOINTMENTS_SECRET=whsec_...

# URL de l'application
NEXTAUTH_URL=http://localhost:3000
```

### 4. Rediriger les webhooks vers le local

```bash
# Terminal 1 : Démarrer l'application Next.js
npm run dev

# Terminal 2 : Rediriger les webhooks Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe-appointments
```

La commande `stripe listen` va :
- Afficher votre secret webhook (commence par `whsec_`)
- Rediriger tous les événements Stripe vers votre endpoint local

### 5. Copier le secret webhook

Quand vous lancez `stripe listen`, vous verrez :

```
Ready! Your webhook signing secret is whsec_1234567890...
```

Copiez ce secret dans votre `.env.local` :

```bash
STRIPE_WEBHOOK_APPOINTMENTS_SECRET=whsec_1234567890...
```

### 6. Redémarrer l'application

```bash
# Ctrl+C puis
npm run dev
```

## 🎯 Événements écoutés

Notre webhook (`/api/webhooks/stripe-appointments`) écoute :

| Événement | Description |
|-----------|-------------|
| `checkout.session.completed` | Session Stripe Checkout terminée avec succès |
| `payment_intent.succeeded` | Payment Intent confirmé (backup) |
| `payment_intent.payment_failed` | Échec de paiement |

## 🧪 Tester les webhooks

### Test 1 : Paiement réussi

1. Créer un rendez-vous (en tant que PRO)
2. Accepter le rendez-vous (en tant que client)
3. Cliquer sur "Payer l'acompte" 
4. Utiliser une carte de test : `4242 4242 4242 4242`
5. Vérifier que le webhook met à jour le statut

### Test 2 : Annulation

1. Dans le Dashboard Stripe Test, annuler un paiement
2. Vérifier que le webhook traite l'événement d'échec

### Cartes de test Stripe

```
# Succès
4242 4242 4242 4242

# Échec
4000 0000 0000 0002

# Authentification 3D Secure
4000 0027 6000 3184
```

## 🚀 Configuration en production

### 1. Créer un endpoint webhook dans Stripe

1. Aller sur [Dashboard Stripe](https://dashboard.stripe.com/webhooks)
2. Cliquer "Add endpoint"
3. URL : `https://votre-domaine.com/api/webhooks/stripe-appointments`
4. Événements à écouter :
   - `checkout.session.completed`
   - `payment_intent.succeeded` 
   - `payment_intent.payment_failed`

### 2. Récupérer le secret webhook

Dans l'onglet "Signing secret" de votre webhook, copiez le secret.

### 3. Variables d'environnement production

```bash
# Clés Stripe (mode live)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Secret webhook production
STRIPE_WEBHOOK_APPOINTMENTS_SECRET=whsec_...

# URL de production
NEXTAUTH_URL=https://votre-domaine.com
```

## 🔍 Débugger les webhooks

### Logs en développement

```bash
# Voir les logs détaillés
stripe listen --forward-to localhost:3000/api/webhooks/stripe-appointments --log-level debug
```

### Vérifier les événements

1. Dashboard Stripe > Développeurs > Webhooks
2. Cliquer sur votre endpoint
3. Voir les tentatives de livraison

### Logs application

Les webhooks loggent dans la console Next.js :

```
✅ Webhook reçu: checkout.session.completed
💳 Paiement traité: 40€ pour "Tatouage saucisson"
✅ Statut mis à jour: PROPOSED → CONFIRMED
```

## 🛠️ Dépannage

### Erreur "Invalid signature"

- Vérifiez que `STRIPE_WEBHOOK_APPOINTMENTS_SECRET` est correct
- Redémarrez l'application après modification

### Événements non reçus

- Vérifiez que `stripe listen` est actif
- Confirmez l'URL du webhook (avec `/api/webhooks/stripe-appointments`)

### Timeout

- Les webhooks ont 30s max pour répondre
- Optimisez les opérations DB dans le handler

## 📊 Monitoring

En production, surveillez :

- **Taux de succès** des webhooks (>99%)
- **Latence** de traitement (<5s)
- **Tentatives** de relivraison

## 🔒 Sécurité

- ✅ Vérification signature Stripe
- ✅ Validation des métadonnées
- ✅ Authentification utilisateur
- ✅ Logs d'audit complets

## 📚 Liens utiles

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)

