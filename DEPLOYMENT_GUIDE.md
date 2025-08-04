# 🚀 Guide de Déploiement Continu - INKSPOT

## 📋 **Vue d'ensemble**

Ce guide décrit la mise en place d'un pipeline de déploiement continu (CI/CD) pour l'application INKSPOT utilisant Docker, GitHub Actions, et des environnements de staging et production.

## 🏗️ **Architecture du Pipeline**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Code Push     │───▶│  GitHub Actions │───▶│   Docker Build  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Tests & Lint  │    │  Image Registry │
                       └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Security Scan   │    │   Deployment    │
                       └─────────────────┘    └─────────────────┘
```

## 🔧 **Configuration GitHub Actions**

### **Workflow Principal** : `.github/workflows/ci-cd.yml`

Le workflow automatise :
- ✅ **Tests et Build** : Linting, type checking, tests unitaires
- ✅ **Build Docker** : Construction des images Docker
- ✅ **Security Scan** : Scan de vulnérabilités avec Trivy
- ✅ **Deployment** : Déploiement automatique selon la branche

### **Environnements**
- **Staging** : Déploiement automatique depuis `dev`
- **Production** : Déploiement automatique depuis `main`

## 🐳 **Configuration Docker**

### **Images Docker**
- **Application principale** : `ghcr.io/antoine13330/inkspot-5z:latest`
- **WebSocket server** : `ghcr.io/antoine13330/inkspot-5z-websocket:latest`

### **Profils Docker Compose**
- **Staging** : `docker-compose --profile staging up -d`
- **Production** : `docker-compose --profile production up -d`
- **Monitoring** : `docker-compose --profile monitoring up -d`

## 🚀 **Déploiement**

### **1. Déploiement Staging**

```bash
# Déploiement automatique via GitHub Actions
git push origin dev

# Ou déploiement manuel
./scripts/deploy.sh staging
```

### **2. Déploiement Production**

```bash
# Déploiement automatique via GitHub Actions
git push origin main

# Ou déploiement manuel
./scripts/deploy.sh production --tag v1.0.0
```

### **3. Scripts de Déploiement**

#### **Script Principal** : `scripts/deploy.sh`

```bash
# Déploiement staging
./scripts/deploy.sh staging

# Déploiement production avec tag spécifique
./scripts/deploy.sh production --tag v1.0.0

# Déploiement avec registry personnalisé
./scripts/deploy.sh production --registry my-registry.com
```

## 🔒 **Sécurité**

### **Security Scanning**
- **Trivy** : Scan de vulnérabilités des images Docker
- **GitHub Security** : Intégration avec GitHub Security tab
- **Rate Limiting** : Protection contre les attaques DDoS

### **SSL/TLS**
- **Certificats SSL** : Configuration automatique via Nginx
- **HSTS** : Headers de sécurité HTTP
- **CSP** : Content Security Policy

## 📊 **Monitoring**

### **Stack de Monitoring**
- **Grafana** : Dashboards de visualisation
- **Prometheus** : Collecte de métriques
- **Node Exporter** : Métriques système
- **Postgres Exporter** : Métriques base de données

### **Health Checks**
```bash
# Vérifier l'état des services
docker-compose ps

# Voir les logs
docker-compose logs -f

# Health check de l'application
curl -f http://localhost:3000/api/health
```

## 🔄 **Rollback**

### **Automatique**
Le pipeline inclut un rollback automatique en cas d'échec de déploiement.

### **Manuel**
```bash
# Rollback vers la version précédente
./scripts/deploy.sh rollback

# Restaurer depuis un backup
./scripts/backup.sh restore
```

## 📝 **Variables d'Environnement**

### **Production** : `.env.production`
```bash
# Database
POSTGRES_DB=inkspot
POSTGRES_USER=inkspot_user
POSTGRES_PASSWORD=your-secure-password

# Application
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret
NODE_ENV=production

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Email
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# Monitoring
GRAFANA_PASSWORD=your-grafana-password
```

## 🛠️ **Configuration Serveur**

### **Prérequis**
```bash
# Installer Docker et Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### **Configuration SSL**
```bash
# Créer les certificats SSL
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

## 📈 **Métriques et Alertes**

### **Métriques Collectées**
- **Application** : Temps de réponse, erreurs, utilisateurs actifs
- **Système** : CPU, mémoire, disque, réseau
- **Base de données** : Connexions, requêtes, performance
- **Business** : Revenue, bookings, conversions

### **Alertes**
- **Seuils critiques** : CPU > 80%, mémoire > 90%
- **Erreurs** : 5xx errors > 1%
- **Disponibilité** : Health check failures
- **Business** : Revenue drops, booking failures

## 🔧 **Maintenance**

### **Backup Automatique**
```bash
# Backup quotidien
0 2 * * * /path/to/scripts/backup.sh

# Backup avant déploiement
./scripts/backup.sh before-deploy
```

### **Mise à Jour**
```bash
# Mise à jour des images
docker-compose pull

# Redémarrage des services
docker-compose up -d

# Vérification
./scripts/deploy.sh health-check
```

## 🚨 **Dépannage**

### **Problèmes Courants**

#### **1. Déploiement échoue**
```bash
# Vérifier les logs
docker-compose logs -f

# Vérifier les health checks
docker-compose ps

# Rollback automatique
./scripts/deploy.sh rollback
```

#### **2. Performance dégradée**
```bash
# Vérifier les métriques
curl http://localhost:3002  # Grafana
curl http://localhost:9090  # Prometheus

# Vérifier les ressources
docker stats
```

#### **3. Base de données**
```bash
# Vérifier la connexion
docker-compose exec postgres pg_isready

# Vérifier les logs
docker-compose logs postgres
```

## 📚 **Commandes Utiles**

### **Déploiement**
```bash
# Déploiement complet
./scripts/deploy.sh production

# Déploiement avec tag spécifique
./scripts/deploy.sh production --tag v1.0.0

# Vérification de santé
./scripts/deploy.sh health-check
```

### **Monitoring**
```bash
# Voir les métriques
docker-compose --profile monitoring up -d

# Accéder à Grafana
open http://localhost:3002

# Accéder à Prometheus
open http://localhost:9090
```

### **Maintenance**
```bash
# Backup
./scripts/backup.sh

# Restore
./scripts/backup.sh restore

# Logs
docker-compose logs -f
```

## ✅ **Checklist de Déploiement**

### **Avant Déploiement**
- [ ] Tests passent localement
- [ ] Variables d'environnement configurées
- [ ] Certificats SSL en place
- [ ] Backup de la base de données
- [ ] Monitoring configuré

### **Après Déploiement**
- [ ] Health checks passent
- [ ] Application accessible
- [ ] WebSocket fonctionne
- [ ] Monitoring opérationnel
- [ ] Logs sans erreurs

## 🎯 **Prochaines Étapes**

1. **Configurer les environnements** sur votre serveur
2. **Ajouter les secrets** dans GitHub
3. **Configurer les certificats SSL**
4. **Tester le pipeline** avec un déploiement staging
5. **Configurer les alertes** de monitoring

**🎉 Votre pipeline de déploiement continu est prêt !** 