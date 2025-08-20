# 🔧 Dépannage VAPID - Notifications Push

Ce guide vous aide à résoudre les problèmes liés aux clés VAPID et aux notifications push.

## 🚨 Erreur courante

### **Erreur lors du build :**
```
Error: No key set vapidDetails.publicKey during the build process when collecting page data for /api/bookings
```

## ✅ Solution rapide

### **Étape 1: Installer web-push**
```bash
npm install web-push
```

### **Étape 2: Générer les clés VAPID**
```bash
npm run vapid:generate
```

### **Étape 3: Créer le fichier .env**
```bash
# À la racine du projet
touch .env
```

### **Étape 4: Ajouter les variables VAPID**
```bash
# Dans votre fichier .env
VAPID_PUBLIC_KEY="votre-clé-publique-générée"
VAPID_PRIVATE_KEY="votre-clé-privée-générée"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="votre-clé-publique-générée"
```

### **Étape 5: Vérifier la configuration**
```bash
npm run env:check
```

### **Étape 6: Redémarrer le serveur**
```bash
npm run dev
```

## 🔍 Vérifications

### **1. Variables d'environnement**
```bash
# Vérifier que les variables sont définies
echo $VAPID_PUBLIC_KEY
echo $VAPID_PRIVATE_KEY
echo $NEXT_PUBLIC_VAPID_PUBLIC_KEY
```

### **2. Fichier .env**
- Le fichier `.env` doit être à la racine du projet
- Pas d'espaces autour du signe `=`
- Pas de guillemets autour des valeurs

### **3. Redémarrage**
- Les variables d'environnement ne sont chargées qu'au démarrage
- Redémarrez complètement votre serveur après modification

## 🐛 Problèmes courants

### **Problème: Clés VAPID toujours manquantes**
**Solutions :**
1. Vérifiez que le fichier `.env` est bien à la racine
2. Vérifiez la syntaxe (pas d'espaces, pas de guillemets)
3. Redémarrez complètement le serveur
4. Vérifiez avec `npm run env:check`

### **Problème: Erreur côté client**
**Vérifications :**
1. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` est défini
2. Le service worker est chargé
3. HTTPS est activé (requis pour les notifications)

### **Problème: Erreur côté serveur**
**Vérifications :**
1. `VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY` sont définis
2. `EMAIL_FROM` est configuré
3. Les clés sont valides

## 🔑 Régénération des clés

Si vous devez régénérer vos clés VAPID :

```bash
# Supprimer l'ancien fichier .env
rm .env

# Régénérer les clés
npm run vapid:generate

# Recréer le fichier .env avec les nouvelles clés
# Puis redémarrer le serveur
```

## 📱 Test des notifications

### **1. Vérifier l'abonnement**
```javascript
// Dans la console du navigateur
navigator.serviceWorker.ready.then(registration => {
  registration.pushManager.getSubscription().then(subscription => {
    console.log('Abonnement:', subscription);
  });
});
```

### **2. Tester l'envoi**
```bash
# Via l'API (si configurée)
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'
```

## 🔒 Sécurité

- **Ne jamais commiter** le fichier `.env`
- **Garder secret** `VAPID_PRIVATE_KEY`
- **Utiliser des clés différentes** pour chaque environnement
- **Régénérer régulièrement** les clés de production

## 📚 Ressources

- [Guide complet VAPID](docs/environment-setup.md)
- [Documentation web-push](https://github.com/web-push-libs/web-push)
- [Spécification VAPID](https://tools.ietf.org/html/rfc8292)

## 🆘 Support

Si le problème persiste :

1. Vérifiez les logs du serveur
2. Utilisez `npm run env:check`
3. Consultez la documentation complète
4. Vérifiez que toutes les dépendances sont installées
