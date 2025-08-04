# 🐳 INKSPOT Docker Setup

Ce guide vous explique comment déployer et exécuter INKSPOT avec Docker, incluant tous les services nécessaires.

## 📋 Prérequis

- Docker et Docker Compose installés
- Compte Ngrok (pour les webhooks)
- Compte Stripe (pour les paiements)
- Compte AWS (pour S3)
- Compte Google OAuth (optionnel)

## 🚀 Démarrage Rapide

### 1. Configuration de l'environnement

```bash
# Copier le fichier d'environnement
cp env.example .env

# Éditer les variables d'environnement
nano .env
```

### 2. Démarrage des services

```bash
# Démarrage simple
./scripts/start.sh start

# Démarrage avec Prisma Studio (développement)
./scripts/start.sh start --dev
```

### 3. Vérification

```bash
# Vérifier le statut des services
./scripts/start.sh status

# Voir les logs
./scripts/start.sh logs
```

## 🏗️ Architecture des Services

### Services Principaux

| Service | Port | Description |
|---------|------|-------------|
| **App** | 3000 | Application Next.js principale |
| **WebSocket** | 3001 | Serveur WebSocket pour les conversations |
| **PostgreSQL** | 5432 | Base de données principale |
| **Redis** | 6379 | Cache et sessions |

### Services de Monitoring

| Service | Port | Description |
|---------|------|-------------|
| **Grafana** | 3002 | Tableaux de bord de monitoring |
| **Prometheus** | 9090 | Collecte de métriques |
| **Node Exporter** | 9100 | Métriques système |
| **Postgres Exporter** | 9187 | Métriques base de données |

### Services de Développement

| Service | Port | Description |
|---------|------|-------------|
| **Ngrok** | 4040 | Tunnel pour les webhooks |
| **Mailhog** | 8025 | Serveur email de test |
| **Prisma Studio** | 5555 | Interface de gestion de base de données |

## 🔧 Configuration Détaillée

### Variables d'Environnement

#### Base de données
```env
DATABASE_URL="postgresql://inkspot_user:inkspot_password@postgres:5432/inkspot"
REDIS_URL="redis://redis:6379"
```

#### Authentification
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### Stripe
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

#### AWS S3
```env
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

#### Ngrok
```env
NGROK_AUTHTOKEN="your-ngrok-token"
```

## 📊 Monitoring

### Accès aux Services

- **Grafana**: http://localhost:3002 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Mailhog**: http://localhost:8025
- **Ngrok UI**: http://localhost:4040

### Dashboards Grafana

Les dashboards suivants sont automatiquement configurés :

1. **INKSPOT Overview** - Vue d'ensemble générale
2. **INKSPOT Business** - Métriques métier
3. **INKSPOT Technical** - Métriques techniques
4. **INKSPOT Realtime** - Données en temps réel

## 🔄 Commandes Utiles

### Gestion des Services

```bash
# Démarrer tous les services
./scripts/start.sh start

# Démarrer avec Prisma Studio
./scripts/start.sh start --dev

# Arrêter tous les services
./scripts/start.sh stop

# Redémarrer les services
./scripts/start.sh restart

# Voir le statut
./scripts/start.sh status
```

### Logs et Debugging

```bash
# Voir tous les logs
./scripts/start.sh logs

# Voir les logs d'un service spécifique
./scripts/start.sh logs app
./scripts/start.sh logs postgres
./scripts/start.sh logs websocket
```

### Base de Données

```bash
# Réinitialiser la base de données
./scripts/start.sh reset-db

# Accéder à Prisma Studio
# Ouvrir http://localhost:5555 (en mode dev)
```

## 🐛 Dépannage

### Problèmes Courants

#### 1. Services ne démarrent pas

```bash
# Vérifier les logs
./scripts/start.sh logs

# Vérifier le statut Docker
docker ps -a

# Redémarrer Docker
sudo systemctl restart docker
```

#### 2. Base de données non accessible

```bash
# Vérifier la connexion PostgreSQL
docker-compose exec postgres psql -U inkspot_user -d inkspot

# Réinitialiser la base
./scripts/start.sh reset-db
```

#### 3. WebSocket non connecté

```bash
# Vérifier les logs WebSocket
./scripts/start.sh logs websocket

# Redémarrer le service WebSocket
docker-compose restart websocket
```

#### 4. Ngrok ne fonctionne pas

```bash
# Vérifier le token Ngrok
docker-compose logs ngrok

# Mettre à jour le token dans .env
NGROK_AUTHTOKEN="your-new-token"
docker-compose restart ngrok
```

### Nettoyage

```bash
# Arrêter et supprimer tous les conteneurs
docker-compose down

# Supprimer les volumes (ATTENTION: supprime les données)
docker-compose down -v

# Supprimer les images
docker-compose down --rmi all
```

## 🔒 Sécurité

### Variables Sensibles

- Ne jamais commiter le fichier `.env`
- Utiliser des secrets Docker en production
- Changer les mots de passe par défaut

### Réseau

- Tous les services sont isolés dans le réseau `inkspot_network`
- Seuls les ports nécessaires sont exposés
- Les healthchecks vérifient l'état des services

## 🚀 Production

### Recommandations

1. **Variables d'environnement** : Utiliser des secrets Docker
2. **Base de données** : Utiliser un service PostgreSQL managé
3. **Redis** : Utiliser un service Redis managé
4. **Monitoring** : Configurer des alertes Grafana
5. **Backup** : Mettre en place des sauvegardes automatiques

### Déploiement

```bash
# Build des images
docker-compose build

# Démarrage en production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📚 Ressources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [Prisma Docker Guide](https://www.prisma.io/docs/guides/deployment/docker)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)

## 🤝 Support

Pour toute question ou problème :

1. Vérifier les logs : `./scripts/start.sh logs`
2. Consulter la documentation
3. Ouvrir une issue sur GitHub 