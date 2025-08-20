# 🌐 Environnement de Développement INKSPOT

## 🔗 URLs GitHub réelles

### **Repository principal**
- **Repository**: https://github.com/antoine13330/INKSPOT-5z
- **Actions**: https://github.com/antoine13330/INKSPOT-5z/actions
- **Issues**: https://github.com/antoine13330/INKSPOT-5z/issues
- **Pull Requests**: https://github.com/antoine13330/INKSPOT-5z/pulls
- **Settings**: https://github.com/antoine13330/INKSPOT-5z/settings
- **Security**: https://github.com/antoine13330/INKSPOT-5z/security

### **Environnements de déploiement**
- **Dev Branch**: https://github.com/antoine13330/INKSPOT-5z/tree/dev
- **Main Branch**: https://github.com/antoine13330/INKSPOT-5z/tree/main
- **Workflows**: https://github.com/antoine13330/INKSPOT-5z/actions/workflows

## 🔑 Informations de déploiement

### **Branches actives**
```
Branch: dev
- Déploiement automatique sur push
- Tests et build automatisés
- Workflow: .github/workflows/deploy-github-actions.yml

Branch: main
- Déploiement de production
- Tests complets requis
- Workflow: .github/workflows/ci-cd.yml
```

### **Workflows disponibles**
- **CI/CD Pipeline**: Déploiement complet avec tests
- **Deploy via GitHub Actions**: Déploiement rapide avec URLs GitHub
- **Deploy to GitHub Pages**: Déploiement statique (si configuré)

## 🧪 Tests et monitoring

### **Vérification du statut**
- **Actions**: https://github.com/antoine13330/INKSPOT-5z/actions
- **Build Status**: Visible dans l'onglet Actions
- **Deployment Logs**: Logs détaillés dans chaque workflow

### **Tests automatisés**
- **Tests unitaires**: Exécutés automatiquement
- **Tests E2E**: Playwright (temporairement désactivé)
- **Security scan**: npm audit + Snyk
- **Code quality**: Linting et formatage

## 📱 Fonctionnalités disponibles

### **✅ Fonctionnalités actives**
- [x] Authentification et inscription
- [x] Gestion des profils utilisateurs
- [x] Création et affichage des posts
- [x] Système de réservations
- [x] Messagerie en temps réel
- [x] Recherche avancée
- [x] Notifications push (VAPID auto-généré)
- [x] Système de paiements
- [x] Dashboard administrateur

### **🔧 Fonctionnalités en développement**
- [ ] Système de recommandations IA
- [ ] Analytics avancés
- [ ] Intégration multi-plateformes
- [ ] Système de badges et récompenses

## 🗄️ Base de données

### **Type**: PostgreSQL
- **Configuration**: Via variables d'environnement
- **Migration**: Prisma automatique
- **Seed**: Données de test automatiques

### **Tables principales**
- `users` - Utilisateurs et profils
- `posts` - Publications et contenus
- `bookings` - Réservations et rendez-vous
- `conversations` - Messages et conversations
- `payments` - Transactions et paiements
- `notifications` - Notifications push

## 📊 Monitoring et logs

### **GitHub Actions**
- **URL**: https://github.com/antoine13330/INKSPOT-5z/actions
- **Logs**: Disponibles en temps réel
- **Historique**: Conservation des logs de build

### **Métriques surveillées**
- Statut des builds
- Temps d'exécution des workflows
- Taux de succès des déploiements
- Performance des tests

## 🚀 Déploiement

### **Fréquence**
- **Automatique**: À chaque push sur `dev` et `main`
- **Manuel**: Via GitHub Actions (workflow_dispatch)

### **Processus**
1. **Push** sur la branche
2. **Trigger** du workflow GitHub Actions
3. **Build** de l'application
4. **Génération automatique** des clés VAPID
5. **Tests** automatisés
6. **Déploiement** via GitHub Actions
7. **Notification** de succès

### **Rollback**
- **Automatique**: En cas d'échec des tests
- **Manuel**: Via GitHub (revert commit)

## 🔒 Sécurité

### **GitHub Security**
- **Dependabot**: Mises à jour automatiques
- **Code scanning**: Analyse de sécurité
- **Secret scanning**: Détection des secrets exposés

### **Tests de sécurité**
- **npm audit**: Vérification des vulnérabilités
- **Snyk**: Scan de sécurité avancé
- **GitHub Actions**: Environnement sécurisé

## 📞 Support

### **En cas de problème**
1. **Vérifier** les Actions GitHub
2. **Consulter** les logs de workflow
3. **Ouvrir** une issue sur GitHub
4. **Contacter** l'équipe via GitHub

### **Ressources utiles**
- **Issues**: https://github.com/antoine13330/INKSPOT-5z/issues
- **Discussions**: https://github.com/antoine13330/INKSPOT-5z/discussions
- **Wiki**: https://github.com/antoine13330/INKSPOT-5z/wiki

---

**🚀 Votre environnement de développement est maintenant déployé via GitHub Actions avec des URLs réelles !**

**🔗 Vérifiez le statut**: https://github.com/antoine13330/INKSPOT-5z/actions
