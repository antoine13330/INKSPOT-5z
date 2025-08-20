# 🎨 INKSPOT - Plateforme de Tatouage et Art

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** 18+ 
- **npm** ou **yarn**
- **Git**
- **PostgreSQL** (pour la base de données)
- **AWS S3** (pour le stockage des fichiers)

### Installation
```bash
# Cloner le projet
git clone https://github.com/antoine13330/INKSPOT-5z.git
cd INKSPOT-5z

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Configurer les variables d'environnement
# Voir section Configuration ci-dessous

# Initialiser la base de données
npm run db:setup

# Lancer le serveur de développement
npm run dev
```

## ⚙️ Configuration

### Variables d'environnement (.env)
```bash
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/inkspot"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (optionnel)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
```

## 🛠️ Commandes Utiles

### Développement
```bash
# Lancer le serveur de développement
npm run dev

# Lancer en mode production locale
npm run build
npm start

# Lancer avec HTTPS (pour les webhooks)
npm run dev:https
```

### Base de données
```bash
# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# Réinitialiser la base de données
npm run db:reset

# Seeder la base de données
npm run db:seed

# Ouvrir Prisma Studio
npm run db:studio
```

### Tests
```bash
# Lancer tous les tests
npm test

# Lancer les tests en mode watch
npm run test:watch

# Lancer les tests E2E
npm run test:e2e

# Lancer les tests avec coverage
npm run test:coverage

# Lancer un test spécifique
npm test -- --testNamePattern="search functionality"
```

### Linting et Formatage
```bash
# Vérifier le code avec ESLint
npm run lint

# Corriger automatiquement les erreurs ESLint
npm run lint:fix

# Formater le code avec Prettier
npm run format

# Vérifier le formatage
npm run format:check
```

### Build et Déploiement
```bash
# Build de production
npm run build

# Analyser le bundle
npm run analyze

# Vérifier le build
npm run build:check

# Lancer le serveur de production
npm start
```

### Docker
```bash
# Lancer avec Docker Compose (développement)
docker-compose -f docker-compose-dev.yml up

# Lancer avec Docker Compose (production)
docker-compose -f docker-compose.prod.yml up

# Reconstruire les images
docker-compose build --no-cache

# Arrêter les services
docker-compose down
```

## 📁 Structure du Projet

```
INKSPOT-5z/
├── app/                    # Pages et API Next.js 13+
│   ├── api/               # Routes API
│   ├── auth/              # Pages d'authentification
│   ├── profile/           # Gestion des profils
│   ├── pro/               # Dashboard professionnel
│   └── ...
├── components/             # Composants React réutilisables
│   ├── ui/                # Composants UI de base
│   ├── auth/              # Composants d'authentification
│   ├── chat/              # Système de chat
│   └── ...
├── lib/                    # Utilitaires et configurations
│   ├── auth.ts            # Configuration NextAuth
│   ├── prisma.ts          # Client Prisma
│   ├── s3.ts              # Gestion AWS S3
│   └── ...
├── prisma/                 # Schéma et migrations de base de données
├── __tests__/              # Tests unitaires et d'intégration
├── e2e/                    # Tests end-to-end
└── public/                 # Fichiers statiques
```

## 🔧 Développement

### Workflow Git
```bash
# Créer une nouvelle branche de fonctionnalité
git checkout -b feature/nouvelle-fonctionnalite

# Créer une branche de correction
git checkout -b fix/correction-bug

# Créer une branche de documentation
git checkout -b docs/amelioration-docs

# Commiter les changements
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"

# Pousser la branche
git push origin feature/nouvelle-fonctionnalite

# Merger sur dev
git checkout dev
git merge feature/nouvelle-fonctionnalite
git push origin dev
```

### Conventions de Commits
```bash
# Format: type(scope): description

# Exemples :
feat: ajouter système de notifications
fix(auth): corriger problème de connexion
docs: mettre à jour la documentation
refactor(api): simplifier la logique des routes
test: ajouter tests pour le composant Search
chore: mettre à jour les dépendances
```

### Débogage
```bash
# Lancer avec logs détaillés
DEBUG=* npm run dev

# Lancer Prisma en mode debug
DEBUG=prisma:* npm run dev

# Vérifier les variables d'environnement
npm run env:check

# Tester la connexion à la base de données
npm run db:test
```

## 🚀 Déploiement

### Production
```bash
# Build de production
npm run build

# Vérifier le build
npm run build:check

# Lancer en production
npm start

# Avec PM2
pm2 start npm --name "inkspot" -- start
```

### Environnements
```bash
# Développement
NODE_ENV=development npm run dev

# Staging
NODE_ENV=staging npm run build && npm start

# Production
NODE_ENV=production npm run build && npm start
```

## 📊 Monitoring et Logs

### Logs
```bash
# Voir les logs en temps réel
npm run logs:watch

# Voir les logs d'erreur
npm run logs:error

# Voir les logs de performance
npm run logs:perf
```

### Métriques
```bash
# Lancer Prometheus
npm run monitoring:prometheus

# Lancer Grafana
npm run monitoring:grafana

# Voir les métriques
npm run monitoring:metrics
```

## 🧪 Tests

### Tests Unitaires
```bash
# Lancer tous les tests
npm test

# Lancer un fichier spécifique
npm test -- components/Search.test.tsx

# Lancer avec coverage
npm run test:coverage

# Lancer en mode watch
npm run test:watch
```

### Tests E2E
```bash
# Lancer Playwright
npm run test:e2e

# Lancer en mode UI
npm run test:e2e:ui

# Lancer un test spécifique
npm run test:e2e -- --grep "authentication flow"
```

### Tests de Performance
```bash
# Lighthouse
npm run test:lighthouse

# Bundle analyzer
npm run test:bundle

# Performance monitoring
npm run test:perf
```

## 🔒 Sécurité

### Vérifications de Sécurité
```bash
# Audit des dépendances
npm audit

# Correction automatique
npm audit fix

# Vérification des secrets
npm run security:check

# Scan de vulnérabilités
npm run security:scan
```

### Authentification
```bash
# Tester l'authentification
npm run auth:test

# Vérifier les sessions
npm run auth:sessions

# Nettoyer les sessions expirées
npm run auth:cleanup
```

## 📱 PWA et Offline

### Service Worker
```bash
# Générer le service worker
npm run pwa:generate

# Tester le mode offline
npm run pwa:test

# Mettre à jour le manifest
npm run pwa:manifest
```

### Push Notifications
```bash
# Tester les notifications
npm run notifications:test

# Vérifier les abonnements
npm run notifications:subscriptions

# Envoyer une notification de test
npm run notifications:send-test
```

## 🌐 API et Webhooks

### Tests d'API
```bash
# Tester toutes les routes API
npm run api:test

# Tester une route spécifique
npm run api:test -- /api/users

# Vérifier les webhooks
npm run webhooks:test

# Tester Stripe
npm run stripe:test
```

### Documentation API
```bash
# Générer la documentation OpenAPI
npm run api:docs:generate

# Lancer Swagger UI
npm run api:docs:serve

# Exporter la documentation
npm run api:docs:export
```

## 🚨 Dépannage

### Problèmes Courants

#### Base de données
```bash
# Connexion refusée
npm run db:check-connection

# Migrations en échec
npm run db:reset
npm run db:migrate

# Problème de permissions
npm run db:fix-permissions
```

#### Build
```bash
# Erreur de build
npm run build:clean
npm run build

# Problème de dépendances
rm -rf node_modules package-lock.json
npm install
```

#### Performance
```bash
# Vérifier la taille du bundle
npm run analyze

# Optimiser les images
npm run images:optimize

# Vérifier les performances
npm run perf:check
```

### Logs d'Erreur
```bash
# Voir les erreurs en temps réel
npm run logs:errors:watch

# Analyser les erreurs
npm run logs:analyze

# Nettoyer les logs
npm run logs:cleanup
```

## 📚 Ressources

### Documentation
- [Next.js 13+](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Stripe](https://stripe.com/docs)

### Outils de Développement
- [VS Code Extensions](https://marketplace.visualstudio.com/)
- [Postman](https://www.postman.com/) - Tests d'API
- [Insomnia](https://insomnia.rest/) - Alternative à Postman
- [DBeaver](https://dbeaver.io/) - Gestionnaire de base de données

### Monitoring
- [Sentry](https://sentry.io/) - Gestion des erreurs
- [LogRocket](https://logrocket.com/) - Session replay
- [Vercel Analytics](https://vercel.com/analytics) - Métriques

## 🤝 Contribution

### Comment Contribuer
1. Fork le projet
2. Créer une branche de fonctionnalité
3. Commiter les changements
4. Pousser vers la branche
5. Créer une Pull Request

### Standards de Code
- Utiliser TypeScript strict
- Suivre les conventions ESLint
- Écrire des tests pour les nouvelles fonctionnalités
- Documenter les changements importants

## 📞 Support

### Contact
- **Développeur Principal** : Antoine
- **Email** : [votre-email]
- **GitHub** : [@antoine13330](https://github.com/antoine13330)

### Issues
- Créer une issue sur GitHub pour les bugs
- Utiliser les templates fournis
- Fournir des informations détaillées

---

**🎯 INKSPOT - Votre plateforme de tatouage et d'art de confiance !**
