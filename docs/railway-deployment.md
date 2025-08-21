# 🚂 Déploiement Railway - INKSPOT

## 📋 Vue d'ensemble

INKSPOT utilise maintenant **Railway** pour le déploiement automatique, remplaçant l'ancien système de déploiement manuel avec Docker et GitHub Actions.

## 🎯 Avantages de Railway

- ✅ **Déploiement automatique** depuis GitHub
- ✅ **Gestion des environnements** (dev, staging, prod)
- ✅ **Scaling automatique** selon la charge
- ✅ **Monitoring intégré** et logs en temps réel
- ✅ **Base de données gérée** (PostgreSQL)
- ✅ **Variables d'environnement** sécurisées
- ✅ **Health checks** automatiques
- ✅ **Rollback** en un clic

## 🚀 Configuration

### 1. Fichier `railway.json`

```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm run build",
    "watchPatterns": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 3
  }
}
```

### 2. Fichier `.railwayignore`

Exclut les fichiers inutiles du déploiement :
- Dossiers de développement (`node_modules/`, `.next/`)
- Fichiers de test et documentation
- Configuration Docker locale
- Logs et fichiers temporaires

## 🌍 Environnements

### Development
- **Branch** : `dev`
- **Déploiement** : Automatique sur push
- **URL** : `https://inkspot-dev.railway.app`

### Staging (optionnel)
- **Branch** : `staging`
- **Déploiement** : Automatique sur push
- **URL** : `https://inkspot-staging.railway.app`

### Production
- **Branch** : `main`
- **Déploiement** : Automatique sur push
- **URL** : `https://inkspot.railway.app`

## 🔧 Variables d'environnement

### Variables requises
```bash
# Base de données
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://your-domain.railway.app"

# AWS S3
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
AWS_S3_BUCKET="..."

# Stripe
STRIPE_SECRET_KEY="..."
STRIPE_PUBLISHABLE_KEY="..."
STRIPE_WEBHOOK_SECRET="..."
```

### Variables optionnelles
```bash
# Email
EMAIL_SERVER_HOST="..."
EMAIL_SERVER_PORT="..."
EMAIL_SERVER_USER="..."
EMAIL_SERVER_PASSWORD="..."

# Monitoring
RAILWAY_ENVIRONMENT="production"
```

## 📊 Monitoring et Logs

### Health Check
- **Endpoint** : `/api/health`
- **Fréquence** : Toutes les 5 minutes
- **Timeout** : 5 minutes
- **Action** : Redémarrage automatique si échec

### Logs
- **Accès** : Via Railway Dashboard
- **Rétention** : 30 jours
- **Filtrage** : Par niveau (info, warn, error)

### Métriques
- **CPU** : Utilisation en temps réel
- **Mémoire** : Consommation RAM
- **Réseau** : Trafic entrant/sortant
- **Base de données** : Connexions actives

## 🚨 Gestion des erreurs

### Redémarrage automatique
- **Politique** : `on_failure`
- **Tentatives max** : 3
- **Délai** : 30 secondes entre tentatives

### Rollback
- **Méthode** : Via Railway Dashboard
- **Vitesse** : Instantané
- **Données** : Préservées

## 🔄 Workflow de déploiement

### 1. Push sur GitHub
```bash
git push origin dev    # → Déploiement dev automatique
git push origin main   # → Déploiement production automatique
```

### 2. Build automatique
- Détection des changements
- Installation des dépendances
- Build de l'application
- Tests de santé

### 3. Déploiement
- Arrêt de l'ancienne version
- Déploiement de la nouvelle version
- Health check
- Activation du trafic

### 4. Monitoring
- Vérification des logs
- Surveillance des métriques
- Alertes en cas de problème

## 🛠️ Commandes utiles

### Railway CLI (optionnel)
```bash
# Installation
npm install -g @railway/cli

# Connexion
railway login

# Déploiement manuel
railway up

# Voir les logs
railway logs

# Ouvrir le dashboard
railway open
```

### Vérification locale
```bash
# Test du build
npm run build

# Test de démarrage
npm start

# Test des variables d'environnement
npm run env:check
```

## 📝 Troubleshooting

### Build échoue
1. Vérifier les erreurs TypeScript : `npm run type-check`
2. Vérifier les dépendances : `npm install`
3. Vérifier la configuration : `npm run env:check`

### Déploiement échoue
1. Vérifier les logs Railway
2. Vérifier les variables d'environnement
3. Vérifier la connectivité de la base de données

### Application ne démarre pas
1. Vérifier le health check : `/api/health`
2. Vérifier les logs d'erreur
3. Vérifier la configuration de la base de données

## 🔗 Liens utiles

- **Railway Dashboard** : https://railway.app/dashboard
- **Documentation Railway** : https://docs.railway.app
- **Support Railway** : https://railway.app/support
- **Status Railway** : https://status.railway.app

---

*Dernière mise à jour : $(Get-Date -Format "dd/MM/yyyy")*
