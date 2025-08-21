# 🚂 CI/CD avec Railway

Ce guide explique comment INKSPOT gère automatiquement le déploiement avec Railway.

## 🔄 **Déploiement Automatique Railway**

### **Comment ça fonctionne :**

1. **Détection automatique des changements**
   - Railway surveille automatiquement votre repo GitHub
   - Déploiement automatique sur push vers `dev` ou `main`

2. **Configuration automatique de l'environnement**
   - Les variables d'environnement sont gérées dans Railway
   - Build automatique avec `npm run build`
   - Démarrage automatique avec `npm start`

3. **Déploiement sans erreur**
   - Health checks automatiques sur `/api/health`
   - Rollback automatique en cas de problème
   - Monitoring intégré

## 🛠️ **Scripts Disponibles**

### **`npm run env:check`**
```bash
# Vérification des variables d'environnement
npm run env:check
```

**Ce que fait le script :**
- ✅ Vérifie la présence des variables requises
- 🔑 Valide les clés API (Stripe, AWS, etc.)
- 📁 Vérifie la configuration de la base de données
- 🔧 Affiche un rapport de configuration

### **`npm run vapid:generate`**
```bash
# Génération manuelle des clés VAPID
npm run vapid:generate
```

## 📋 **Workflow Railway**

### **Étape 1: Push sur GitHub**
```bash
# Déploiement automatique sur dev
git push origin dev

# Déploiement automatique sur production
git push origin main
```

### **Étape 2: Build automatique**
- Railway détecte les changements
- Installation automatique des dépendances
- Build avec `npm run build`
- Tests de santé automatiques

### **Étape 3: Déploiement**
- Arrêt de l'ancienne version
- Déploiement de la nouvelle version
- Health check sur `/api/health`
- Activation du trafic

## 🔍 **Configuration Automatique**

### **Variables d'environnement gérées par Railway :**
- `DATABASE_URL` - Connexion PostgreSQL
- `NEXTAUTH_SECRET` - Secret NextAuth
- `STRIPE_SECRET_KEY` - Clé secrète Stripe
- `AWS_ACCESS_KEY_ID` - Clé AWS S3
- `VAPID_PUBLIC_KEY` - Clé publique VAPID

### **Comportement selon l'environnement :**

| Environnement | Branch | URL | Variables |
|---------------|--------|-----|-----------|
| **Development** | `dev` | `https://inkspot-dev.railway.app` | Dev + Test |
| **Staging** | `staging` | `https://inkspot-staging.railway.app` | Staging |
| **Production** | `main` | `https://inkspot.railway.app` | Production |

## 🔑 **Génération des Clés VAPID**

### **Processus automatique :**
```javascript
// Railway gère automatiquement les variables d'environnement
// Les clés VAPID sont configurées dans le dashboard Railway
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
```

### **Configuration dans Railway :**
1. Aller dans le dashboard Railway
2. Sélectionner votre projet
3. Aller dans "Variables"
4. Ajouter les variables VAPID :
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

## 📊 **Monitoring et Logs**

### **Health Checks :**
- **Endpoint** : `/api/health`
- **Fréquence** : Toutes les 5 minutes
- **Action** : Redémarrage automatique si échec

### **Logs :**
- Accès via Railway Dashboard
- Rétention de 30 jours
- Filtrage par niveau (info, warn, error)

### **Métriques :**
- CPU et mémoire en temps réel
- Trafic réseau
- Connexions base de données

## 🚨 **Gestion des Erreurs**

### **Redémarrage automatique :**
- Politique : `on_failure`
- Tentatives max : 3
- Délai : 30 secondes entre tentatives

### **Rollback :**
- Via Railway Dashboard
- Vitesse : Instantané
- Données préservées

## 🔗 **Liens utiles**

- **Railway Dashboard** : https://railway.app/dashboard
- **Documentation Railway** : https://docs.railway.app
- **Support Railway** : https://railway.app/support
- **Status Railway** : https://status.railway.app

---

*Dernière mise à jour : Migration vers Railway - $(Get-Date -Format "dd/MM/yyyy")*
