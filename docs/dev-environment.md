# 🌐 Environnement de Développement INKSPOT

## 🔗 URLs d'accès

### **Application principale**
- **URL principale**: https://dev.inkspot.com
- **URL API**: https://dev-api.inkspot.com
- **URL Admin**: https://dev-admin.inkspot.com
- **Monitoring**: https://dev-monitoring.inkspot.com

### **Endpoints de test**
- **Health Check**: https://dev.inkspot.com/api/health
- **Authentication**: https://dev.inkspot.com/api/auth
- **Posts**: https://dev.inkspot.com/api/posts
- **Bookings**: https://dev.inkspot.com/api/bookings
- **Users**: https://dev.inkspot.com/api/users
- **Search**: https://dev.inkspot.com/api/search

## 🔑 Identifiants de test

### **Comptes administrateur**
```
Email: admin@dev.inkspot.com
Mot de passe: admin123
Rôle: Super Admin
```

### **Comptes utilisateurs**
```
Email: user@dev.inkspot.com
Mot de passe: user123
Rôle: Utilisateur standard
```

```
Email: artist@dev.inkspot.com
Mot de passe: artist123
Rôle: Artiste/Pro
```

```
Email: test@dev.inkspot.com
Mot de passe: test123
Rôle: Utilisateur de test
```

## 🧪 Tests rapides

### **Vérification de santé**
```bash
curl https://dev.inkspot.com/api/health
```

### **Test d'authentification**
```bash
curl -X POST https://dev.inkspot.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@dev.inkspot.com","password":"user123"}'
```

### **Test des posts**
```bash
curl https://dev.inkspot.com/api/posts
```

### **Test des réservations**
```bash
curl https://dev.inkspot.com/api/bookings
```

## 📱 Fonctionnalités disponibles

### **✅ Fonctionnalités actives**
- [x] Authentification et inscription
- [x] Gestion des profils utilisateurs
- [x] Création et affichage des posts
- [x] Système de réservations
- [x] Messagerie en temps réel
- [x] Recherche avancée
- [x] Notifications push
- [x] Système de paiements
- [x] Dashboard administrateur

### **🔧 Fonctionnalités en développement**
- [ ] Système de recommandations IA
- [ ] Analytics avancés
- [ ] Intégration multi-plateformes
- [ ] Système de badges et récompenses

## 🗄️ Base de données

### **Type**: PostgreSQL
- **Host**: dev-db.inkspot.com
- **Port**: 5432
- **Database**: inkspot_dev
- **Reset**: Quotidien à 2h00 UTC

### **Tables principales**
- `users` - Utilisateurs et profils
- `posts` - Publications et contenus
- `bookings` - Réservations et rendez-vous
- `conversations` - Messages et conversations
- `payments` - Transactions et paiements
- `notifications` - Notifications push

## 📊 Monitoring et logs

### **Grafana Dashboard**
- **URL**: https://dev-monitoring.inkspot.com
- **Utilisateur**: admin
- **Mot de passe**: admin123

### **Logs applicatifs**
- **Niveau**: DEBUG
- **Rétention**: 7 jours
- **Format**: JSON structuré

### **Métriques surveillées**
- Temps de réponse des API
- Taux d'erreur
- Utilisation des ressources
- Nombre d'utilisateurs actifs
- Performance des requêtes DB

## 🚀 Déploiement

### **Fréquence**
- **Automatique**: À chaque push sur la branche `dev`
- **Manuel**: Via GitHub Actions (workflow_dispatch)

### **Processus**
1. Build de l'application
2. Génération automatique des clés VAPID
3. Déploiement des artefacts
4. Vérifications de santé
5. Notification de succès

### **Rollback**
- **Automatique**: En cas d'échec des health checks
- **Manuel**: Via l'interface d'administration

## 🔒 Sécurité

### **Environnement isolé**
- Base de données séparée
- Variables d'environnement spécifiques
- Pas d'accès aux données de production

### **Tests de sécurité**
- Scan automatique des vulnérabilités
- Audit des dépendances
- Tests de pénétration automatisés

## 📞 Support

### **En cas de problème**
1. Vérifier les logs dans Grafana
2. Consulter le statut des services
3. Contacter l'équipe DevOps
4. Ouvrir un ticket sur GitHub

### **Contacts**
- **DevOps**: devops@inkspot.com
- **Développement**: dev@inkspot.com
- **Urgences**: +33 1 23 45 67 89

---

**🚀 L'environnement de développement est prêt pour les tests et le développement !**
