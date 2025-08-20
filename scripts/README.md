# 🔐 Scripts de configuration des secrets GitHub

Ce dossier contient des scripts PowerShell pour configurer automatiquement tous vos secrets GitHub nécessaires au pipeline CI/CD.

## 📋 Secrets requis pour le pipeline CI/CD

### 🔑 **Stripe (ESSENTIEL pour le build)**
- `STRIPE_SECRET_KEY` - Clé secrète Stripe
- `STRIPE_PUBLISHABLE_KEY` - Clé publique Stripe  
- `STRIPE_WEBHOOK_SECRET` - Secret webhook Stripe

### 🗄️ **Base de données**
- `DATABASE_URL` - URL de connexion PostgreSQL
- `DIRECT_URL` - URL directe PostgreSQL

### 🔐 **NextAuth**
- `NEXTAUTH_SECRET` - Secret de chiffrement NextAuth
- `NEXTAUTH_URL` - URL de l'application

### 🌐 **OAuth Providers**
- `GOOGLE_CLIENT_ID` - ID client Google OAuth
- `GOOGLE_CLIENT_SECRET` - Secret client Google OAuth

### ☁️ **AWS S3**
- `AWS_ACCESS_KEY_ID` - Clé d'accès AWS
- `AWS_SECRET_ACCESS_KEY` - Clé secrète AWS
- `AWS_REGION` - Région AWS (ex: eu-west-3)
- `AWS_S3_BUCKET` - Nom du bucket S3

### 📊 **Monitoring**
- `GRAFANA_URL` - URL Grafana
- `PROMETHEUS_URL` - URL Prometheus

### 🛡️ **Security**
- `SNYK_TOKEN` - Token Snyk pour le security scanning

## 🚀 Utilisation des scripts

### **Option 1: Script simple avec GitHub CLI (RECOMMANDÉ)**

```powershell
# 1. Installer GitHub CLI
# https://cli.github.com/

# 2. S'authentifier
gh auth login

# 3. Exécuter le script
.\scripts\setup-github-secrets-simple.ps1
```

### **Option 2: Script avec API REST**

```powershell
# 1. Créer un token GitHub avec les permissions repo
# https://github.com/settings/tokens

# 2. Exécuter le script
.\scripts\setup-github-secrets.ps1 -GitHubToken "ghp_..." -Repository "INKSPOT-5z"
```

## 📝 Configuration manuelle

Si vous préférez configurer manuellement :

1. **Aller sur GitHub** : `https://github.com/antoine13330/INKSPOT-5z/settings/secrets/actions`
2. **Cliquer sur "New repository secret"**
3. **Ajouter chaque secret un par un**

## ⚠️ **IMPORTANT : Erreur de build actuelle**

L'erreur actuelle du pipeline CI/CD :
```
Error: Neither apiKey nor config.authenticator provided at c._setAuthenticator
```

**Cause** : Le fichier `lib/stripe.ts` essaie d'initialiser Stripe pendant le build, mais `STRIPE_SECRET_KEY` n'est pas disponible.

**Solution** : 
1. ✅ **Déjà corrigé** : Le fichier `lib/stripe.ts` gère maintenant le cas où Stripe n'est pas configuré
2. 🔑 **À faire** : Configurer `STRIPE_SECRET_KEY` dans les secrets GitHub
3. 🚀 **Résultat** : Le build passera sans erreurs d'authentification

## 🔍 Vérification

Après configuration des secrets :

1. **Vérifiez sur GitHub** : `https://github.com/antoine13330/INKSPOT-5z/settings/secrets/actions`
2. **Relancez le workflow CI/CD** : Le build devrait maintenant passer
3. **Vérifiez les logs** : Plus d'erreurs d'authentification Stripe

## 🆘 Dépannage

### **Erreur "GitHub CLI non installé"**
```bash
# Installer GitHub CLI
winget install GitHub.cli
# ou
choco install gh
```

### **Erreur "GitHub CLI non authentifié"**
```bash
gh auth login
```

### **Erreur "Token GitHub invalide"**
- Vérifiez que le token a les permissions `repo`
- Créez un nouveau token si nécessaire

### **Erreur "Repository non trouvé"**
- Vérifiez le nom du repository et de l'owner
- Assurez-vous d'avoir accès au repository
