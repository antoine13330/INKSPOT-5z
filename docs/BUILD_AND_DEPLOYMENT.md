# Build et Déploiement - Système WebSocket INKSPOT

## Vue d'ensemble

Ce document décrit les étapes de build et de déploiement pour le nouveau système de statut en ligne WebSocket.

## Prérequis

### Environnement de développement

```bash
# Node.js 18+ requis
node --version

# pnpm recommandé
npm install -g pnpm

# Dépendances
pnpm install
```

### Variables d'environnement

```env
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Pour la production
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## Build

### Build de développement

```bash
# Build avec hot reload
pnpm dev

# Build de production local
pnpm build
pnpm start
```

### Build de production

```bash
# Build optimisé
pnpm build

# Vérifier le build
pnpm build:analyze

# Test du build
pnpm test:build
```

## Tests

### Tests unitaires

```bash
# Tous les tests
pnpm test

# Tests spécifiques
pnpm test -- --testPathPattern=websocket
pnpm test -- --testPathPattern=conversation

# Tests avec coverage
pnpm test:coverage
```

### Tests d'intégration

```bash
# Tests E2E
pnpm test:e2e

# Tests spécifiques
pnpm test:e2e -- --spec="websocket-status.spec.ts"
```

### Tests de performance

```bash
# Lighthouse
pnpm lighthouse

# Bundle analyzer
pnpm build:analyze
```

## Déploiement

### Docker

```bash
# Build de l'image
docker build -t inkspot-app .

# Test local
docker run -p 3000:3000 inkspot-app

# Avec docker-compose
docker-compose up -d
```

### Vercel

```bash
# Déploiement automatique
vercel --prod

# Variables d'environnement
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXT_PUBLIC_APP_URL
```

### AWS/EC2

```bash
# Build sur le serveur
git pull origin main
pnpm install
pnpm build

# PM2 pour la gestion des processus
pm2 start ecosystem.config.js
pm2 save
```

## Configuration WebSocket

### Serveur de production

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['socket.io']
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  }
}
```

### Nginx (reverse proxy)

```nginx
# /etc/nginx/sites-available/inkspot
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/websocket {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### PM2 Ecosystem

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'inkspot-app',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

## Monitoring

### Logs

```bash
# Logs de l'application
pm2 logs inkspot-app

# Logs WebSocket
grep "WebSocket" /var/log/nginx/access.log

# Logs d'erreur
tail -f /var/log/nginx/error.log
```

### Métriques

```bash
# Statut des processus
pm2 status

# Utilisation des ressources
pm2 monit

# Connexions WebSocket actives
curl http://localhost:3000/api/websocket/status
```

### Alertes

```bash
# Script de monitoring
#!/bin/bash
# check-websocket.sh

if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "INKSPOT app is down!" | mail -s "Alert: INKSPOT Down" admin@yourdomain.com
fi
```

## Sécurité

### Firewall

```bash
# UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### SSL/TLS

```bash
# Certbot pour Let's Encrypt
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
0 12 * * * /usr/bin/certbot renew --quiet
```

### Rate Limiting

```nginx
# Nginx rate limiting
http {
    limit_req_zone $binary_remote_addr zone=websocket:10m rate=10r/s;
    
    location /api/websocket {
        limit_req zone=websocket burst=20 nodelay;
        # ... autres configurations
    }
}
```

## Sauvegarde

### Base de données

```bash
# Sauvegarde PostgreSQL
pg_dump -h localhost -U username -d inkspot > backup_$(date +%Y%m%d_%H%M%S).sql

# Restauration
psql -h localhost -U username -d inkspot < backup_file.sql
```

### Fichiers

```bash
# Sauvegarde des uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/

# Sauvegarde de la configuration
cp .env.local backup_env_$(date +%Y%m%d)
```

## Récupération

### Rollback

```bash
# Revenir à la version précédente
git checkout HEAD~1
pnpm install
pnpm build
pm2 restart inkspot-app
```

### Restauration complète

```bash
# Restaurer la base de données
psql -h localhost -U username -d inkspot < backup_file.sql

# Restaurer les fichiers
tar -xzf uploads_backup_file.tar.gz

# Redémarrer l'application
pm2 restart inkspot-app
```

## Maintenance

### Mises à jour

```bash
# Mise à jour du code
git pull origin main
pnpm install
pnpm build

# Redémarrage sans interruption
pm2 reload inkspot-app
```

### Nettoyage

```bash
# Nettoyer les logs
pm2 flush

# Nettoyer les builds
rm -rf .next
rm -rf node_modules/.cache

# Nettoyer Docker
docker system prune -f
```

## Support

### En cas de problème

1. **Vérifier les logs** : `pm2 logs inkspot-app`
2. **Vérifier le statut** : `pm2 status`
3. **Vérifier les ressources** : `htop` ou `top`
4. **Vérifier les connexions** : `netstat -tulpn | grep :3000`

### Contacts

- **Développeur** : [Votre nom]
- **DevOps** : [Nom DevOps]
- **Support** : support@yourdomain.com

### Documentation

- **Code** : Commentaires dans le code source
- **API** : `/docs/ONLINE_STATUS_SYSTEM.md`
- **Déploiement** : Ce fichier
