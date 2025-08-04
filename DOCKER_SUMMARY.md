# 🐳 INKSPOT Docker Configuration - Résumé

## 📁 Fichiers Créés

### Configuration Docker
- `docker-compose.yml` - Configuration principale avec tous les services
- `docker-compose.prod.yml` - Overrides pour la production
- `Dockerfile` - Image pour l'application Next.js
- `Dockerfile.websocket` - Image pour le serveur WebSocket
- `Dockerfile.prisma-studio` - Image pour Prisma Studio
- `.dockerignore` - Optimisation des builds

### Scripts
- `scripts/start.sh` - Script d'orchestration principal
- `scripts/backup.sh` - Script de sauvegarde automatique
- `scripts/init-database.sql` - Initialisation de la base de données

### Documentation
- `DOCKER_SETUP.md` - Guide complet d'utilisation
- `env.example` - Template des variables d'environnement

## 🏗️ Architecture des Services

### Services Principaux
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  WebSocket      │    │   PostgreSQL    │
│   (Port 3000)   │    │  (Port 3001)    │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Port 6379)   │
                    └─────────────────┘
```

### Services de Monitoring
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Grafana     │    │   Prometheus    │    │  Node Exporter  │
│   (Port 3002)   │    │   (Port 9090)   │    │   (Port 9100)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Postgres Exporter│
                    │   (Port 9187)   │
                    └─────────────────┘
```

### Services de Développement
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Ngrok       │    │    Mailhog      │    │ Prisma Studio   │
│   (Port 4040)   │    │   (Port 8025)   │    │   (Port 5555)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Commandes de Démarrage

### Développement
```bash
# Démarrage simple
npm run docker:start

# Démarrage avec Prisma Studio
npm run docker:start:dev

# Ou utiliser le script directement
./scripts/start.sh start --dev
```

### Production
```bash
# Build pour la production
npm run docker:build:prod

# Démarrage en production
npm run docker:up:prod
```

## 🔧 Gestion des Services

### Commandes Utiles
```bash
# Statut des services
npm run docker:status

# Logs
npm run docker:logs

# Logs d'un service spécifique
npm run docker:logs app

# Arrêt
npm run docker:stop

# Redémarrage
npm run docker:restart

# Reset base de données
npm run docker:reset-db
```

## 📊 Accès aux Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Application** | http://localhost:3000 | - |
| **WebSocket** | ws://localhost:3001 | - |
| **Grafana** | http://localhost:3002 | admin/admin123 |
| **Prometheus** | http://localhost:9090 | - |
| **Mailhog** | http://localhost:8025 | - |
| **Ngrok UI** | http://localhost:4040 | - |
| **Prisma Studio** | http://localhost:5555 | - |

## 🔒 Variables d'Environnement

### Obligatoires
```env
# Base de données
DATABASE_URL="postgresql://inkspot_user:inkspot_password@postgres:5432/inkspot"
REDIS_URL="redis://redis:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Ngrok
NGROK_AUTHTOKEN="your-ngrok-token"
```

### Optionnelles
```env
# OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# Email
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

## 🐛 Dépannage

### Problèmes Courants

1. **Services ne démarrent pas**
   ```bash
   # Vérifier Docker
   docker ps -a
   
   # Vérifier les logs
   npm run docker:logs
   ```

2. **Base de données non accessible**
   ```bash
   # Vérifier la connexion
   docker-compose exec postgres psql -U inkspot_user -d inkspot
   
   # Reset si nécessaire
   npm run docker:reset-db
   ```

3. **WebSocket non connecté**
   ```bash
   # Vérifier les logs
   npm run docker:logs websocket
   
   # Redémarrer
   docker-compose restart websocket
   ```

### Nettoyage
```bash
# Arrêt complet
docker-compose down

# Suppression des volumes (ATTENTION: supprime les données)
docker-compose down -v

# Suppression des images
docker-compose down --rmi all
```

## 📈 Monitoring

### Dashboards Grafana
- **INKSPOT Overview** - Vue d'ensemble générale
- **INKSPOT Business** - Métriques métier
- **INKSPOT Technical** - Métriques techniques
- **INKSPOT Realtime** - Données en temps réel

### Métriques Collectées
- **Système** : CPU, RAM, Disque, Réseau
- **Application** : Requêtes, Erreurs, Performance
- **Base de données** : Connexions, Requêtes, Performance
- **WebSocket** : Connexions actives, Messages

## 🔄 Sauvegarde

### Automatique
- Sauvegarde quotidienne à 2h du matin
- Rétention de 30 jours
- Compression automatique

### Manuel
```bash
# Sauvegarde manuelle
docker-compose exec backup /backup.sh

# Restauration
docker-compose exec postgres psql -U inkspot_user -d inkspot < backup_file.sql
```

## 🚀 Production

### Recommandations
1. **Variables d'environnement** : Utiliser des secrets Docker
2. **Base de données** : Service PostgreSQL managé
3. **Redis** : Service Redis managé
4. **Monitoring** : Alertes Grafana configurées
5. **Backup** : Sauvegardes automatiques

### Déploiement
```bash
# Build production
npm run docker:build:prod

# Démarrage production
npm run docker:up:prod
```

## ✅ Vérification

### Checklist de Démarrage
- [ ] Docker installé et démarré
- [ ] Fichier `.env` configuré
- [ ] Variables d'environnement remplies
- [ ] Services démarrés : `npm run docker:status`
- [ ] Application accessible : http://localhost:3000
- [ ] Base de données connectée
- [ ] WebSocket fonctionnel
- [ ] Monitoring actif

### Tests
```bash
# Test de santé
npm run health:check

# Test des métriques
npm run metrics:test

# Test de la base de données
npm run db:verify
```

## 📚 Ressources

- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Guide complet
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/docker)

---

**🎉 Configuration Docker complète pour INKSPOT !**

Tous les services sont maintenant orchestrés avec Docker, incluant la base de données, le monitoring, les webhooks, et le serveur WebSocket. L'application est prête pour le développement et la production. 