# 🔧 Configuration de l'Environnement - INKSPOT

Ce guide vous explique comment configurer toutes les variables d'environnement nécessaires pour faire fonctionner INKSPOT.

## 📋 Variables d'environnement requises

### **1. Base de données**
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/inkspot"
```

### **2. Authentification (NextAuth.js)**
```bash
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### **3. 🔑 NOTIFICATIONS PUSH (VAPID) - OBLIGATOIRE**
```bash
# Générer avec: node scripts/generate-vapid-keys.js
VAPID_PUBLIC_KEY="your-vapid-public-key-here"
VAPID_PRIVATE_KEY="your-vapid-private-key-here"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key-here"
```

### **4. AWS S3 (Stockage des fichiers)**
```bash
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket-name"
```

### **5. Stripe (Paiements)**
```bash
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### **6. Email (SMTP)**
```bash
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
```

## 🚀 Configuration rapide

### **Étape 1: Générer les clés VAPID**
```bash
# Installer web-push si pas déjà fait
npm install web-push

# Générer les clés VAPID
node scripts/generate-vapid-keys.js
```

### **Étape 2: Créer le fichier .env**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Ou créer manuellement
touch .env
```

### **Étape 3: Ajouter les variables**
Ajoutez toutes les variables listées ci-dessus dans votre fichier `.env`

### **Étape 4: Redémarrer le serveur**
```bash
npm run dev
```

## ⚠️ Problèmes courants

### **Erreur VAPID lors du build**
Si vous obtenez l'erreur :
```
Error: No key set vapidDetails.publicKey during the build process
```

**Solution :**
1. Vérifiez que `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` sont définis dans `.env`
2. Redémarrez votre serveur de développement
3. Vérifiez que le fichier `.env` est bien à la racine du projet

### **Notifications push ne fonctionnent pas**
**Vérifications :**
1. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` est défini et accessible côté client
2. `VAPID_PRIVATE_KEY` est défini côté serveur
3. Le service worker est correctement configuré
4. HTTPS est activé (requis pour les notifications push)

## 🔒 Sécurité

- **Ne jamais commiter** le fichier `.env` dans Git
- **Garder secret** `VAPID_PRIVATE_KEY` et `NEXTAUTH_SECRET`
- **Utiliser des clés différentes** pour chaque environnement (dev, staging, prod)
- **Régénérer régulièrement** les clés de production

## 📚 Ressources

- [Documentation web-push](https://github.com/web-push-libs/web-push)
- [Guide VAPID](https://web.dev/push-notifications-web-push-protocol/)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
