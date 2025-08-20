# 🚀 CI/CD avec Génération Automatique VAPID

Ce guide explique comment INKSPOT gère automatiquement les clés VAPID en CI/CD sans configuration manuelle.

## 🔄 **Génération Automatique des Clés VAPID**

### **Comment ça fonctionne :**

1. **Détection automatique du mode CI/CD**
   - Le script détecte `CI=true` ou `GITHUB_ACTIONS=true`
   - Génère automatiquement les clés VAPID si elles sont manquantes

2. **Configuration automatique de l'environnement**
   - Les clés sont définies dans `process.env`
   - Création d'un fichier `.env.ci` temporaire
   - Variables par défaut pour les tests

3. **Build sans erreur VAPID**
   - Le build peut se lancer immédiatement
   - Aucune configuration manuelle requise

## 🛠️ **Scripts Disponibles**

### **`npm run ci:setup`**
```bash
# Configuration automatique pour CI/CD
npm run ci:setup
```

**Ce que fait le script :**
- ✅ Détecte le mode CI/CD
- 🔑 Génère les clés VAPID automatiquement
- 📁 Crée un fichier `.env.ci` temporaire
- 🔧 Configure les variables par défaut
- 📋 Vérifie la configuration finale

### **`npm run vapid:generate`**
```bash
# Génération manuelle des clés VAPID
npm run vapid:generate
```

## 📋 **Workflow GitHub Actions**

### **Étape 1: Setup automatique**
```yaml
- name: Setup environment (VAPID auto-generation)
  run: node scripts/ci-setup.js
```

### **Étape 2: Vérification**
```yaml
- name: Verify environment
  run: npm run env:check
```

### **Étape 3: Build sans erreur**
```yaml
- name: Build application
  run: npm run build
  env:
    NODE_ENV: production
    CI: true
```

## 🔍 **Détection Automatique**

### **Variables d'environnement détectées :**
- `CI=true` - Mode CI/CD standard
- `GITHUB_ACTIONS=true` - GitHub Actions
- `NODE_ENV=production` - Mode production

### **Comportement selon le mode :**

| Mode | Comportement VAPID |
|------|-------------------|
| **CI/CD** | ✅ Génération automatique + variables par défaut |
| **Production** | ⚠️ Vérification stricte des clés |
| **Développement** | 🔧 Génération automatique si manquant |

## 🔑 **Génération des Clés VAPID**

### **Processus automatique :**
```javascript
// Détection du mode CI/CD
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

if (isCI && !process.env.VAPID_PUBLIC_KEY) {
  // Génération automatique
  const vapidKeys = webpush.generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = vapidKeys.publicKey;
  process.env.VAPID_PRIVATE_KEY = vapidKeys.privateKey;
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = vapidKeys.publicKey;
}
```

### **Variables configurées :**
- `VAPID_PUBLIC_KEY` - Clé publique pour le serveur
- `VAPID_PRIVATE_KEY` - Clé privée secrète
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Clé publique côté client

## 📁 **Fichiers Créés en CI/CD**

### **`.env.ci` (temporaire)**
```bash
# Configuration automatique CI/CD
VAPID_PUBLIC_KEY=BPx...xyz
VAPID_PRIVATE_KEY=...secret...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPx...xyz
EMAIL_FROM=noreply@inkspot-ci.com
NODE_ENV=production
CI=true
```

## 🚀 **Avantages de l'Automatisation**

### **✅ Pour les développeurs :**
- Aucune configuration manuelle requise
- Build immédiat en CI/CD
- Clés VAPID toujours disponibles

### **✅ Pour le CI/CD :**
- Pipeline robuste et fiable
- Pas d'erreur de build VAPID
- Déploiement automatisé

### **✅ Pour la production :**
- Vérification stricte des clés
- Sécurité maintenue
- Configuration validée

## 🔧 **Configuration Personnalisée**

### **Variables d'environnement personnalisées :**
```bash
# Dans votre workflow CI/CD
env:
  CUSTOM_VAPID_EMAIL: "your-email@domain.com"
  CUSTOM_VAPID_SUBJECT: "mailto:your-email@domain.com"
```

### **Script de configuration personnalisé :**
```javascript
// Dans scripts/ci-setup.js
const customEmail = process.env.CUSTOM_VAPID_EMAIL || 'noreply@inkspot-ci.com';
const customSubject = process.env.CUSTOM_VAPID_SUBJECT || `mailto:${customEmail}`;
```

## 📊 **Monitoring et Logs**

### **Logs de configuration :**
```
🔑 Génération des clés VAPID...
✅ Clés VAPID générées et configurées
📁 Fichier .env.ci créé pour le CI/CD
🔍 Vérification de la configuration...
  ✅ VAPID_PUBLIC_KEY: Configuré
  ✅ VAPID_PRIVATE_KEY: Configuré
🎉 Configuration CI/CD terminée avec succès !
```

### **Vérification finale :**
```bash
npm run env:check
```

## 🆘 **Dépannage CI/CD**

### **Problème: Clés VAPID toujours manquantes**
**Solutions :**
1. Vérifiez que `CI=true` est défini
2. Exécutez `npm run ci:setup` avant le build
3. Vérifiez les logs de configuration

### **Problème: Build échoue malgré l'automatisation**
**Vérifications :**
1. Le script `ci:setup` s'est-il exécuté ?
2. Les variables sont-elles définies dans `process.env` ?
3. Le mode CI est-il détecté correctement ?

## 📚 **Ressources**

- [Guide de configuration VAPID](docs/environment-setup.md)
- [Dépannage VAPID](docs/vapid-troubleshooting.md)
- [Workflow GitHub Actions](.github/workflows/ci-cd.yml)
- [Script CI/CD](scripts/ci-setup.js)

---

**🎉 Avec cette automatisation, votre CI/CD fonctionnera sans aucune configuration manuelle des clés VAPID !**
