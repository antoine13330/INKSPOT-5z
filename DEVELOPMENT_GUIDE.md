# Guide de Développement INKSPOT

## 🚀 Démarrage Rapide

### Prérequis
- Docker et Docker Compose installés
- Node.js 18+ (pour les scripts locaux)

### Démarrage de l'environnement de développement

```bash
# Démarrer l'environnement de développement
./scripts/start-dev.sh

# Démarrer avec nettoyage des volumes (recommandé pour la première fois)
./scripts/start-dev.sh --clean
```

### Arrêt de l'environnement

```bash
# Arrêter l'environnement de développement
./scripts/stop-dev.sh
```

## 🔄 Hot Reload

L'environnement de développement est configuré pour activer le **hot reload** automatique :

- **Modifications de code** : Le navigateur se rafraîchit automatiquement
- **Modifications de composants** : Mise à jour instantanée sans rechargement
- **Modifications de styles** : Application immédiate des changements CSS

## 🏗️ Architecture de Développement

### Services Disponibles

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **App Next.js** | 3000 | http://localhost:3000 | Application principale avec hot reload |
| **WebSocket** | 3001 | ws://localhost:3001 | Serveur WebSocket temps réel |
| **PostgreSQL** | 5432 | - | Base de données principale |
| **Redis** | 6379 | - | Cache et sessions |
| **Mailhog** | 8025 | http://localhost:8025 | Interface email de test |
| **Prisma Studio** | 5555 | http://localhost:5555 | Gestionnaire de base de données |

### Volumes Docker

```yaml
volumes:
  - .:/app                    # Code source (hot reload)
  - /app/node_modules         # Dependencies (optimisé)
  - /app/.next               # Build Next.js (optimisé)
  - ./public/uploads:/app/public/uploads  # Uploads statiques
```

## 🛠️ Commandes Utiles

### Voir les logs en temps réel

```bash
# Logs de l'application
docker-compose -f docker-compose.dev.yml logs -f app

# Logs du WebSocket
docker-compose -f docker-compose.dev.yml logs -f websocket

# Logs de tous les services
docker-compose -f docker-compose.dev.yml logs -f
```

### Reconstruire un service

```bash
# Reconstruire l'application
docker-compose -f docker-compose.dev.yml build app

# Reconstruire et redémarrer
docker-compose -f docker-compose.dev.yml up -d --build app
```

### Accéder au shell d'un conteneur

```bash
# Shell de l'application
docker exec -it inkspot_app_dev sh

# Shell de la base de données
docker exec -it inkspot_postgres_dev psql -U inkspot_user -d inkspot_dev
```

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env.local` pour vos variables de développement :

```bash
# Base de données
DATABASE_URL=postgresql://inkspot_user:inkspot_password@localhost:5432/inkspot_dev

# Redis
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-dev-secret-key

# Autres services...
```

### Base de Données

La base de données de développement utilise :
- **Nom** : `inkspot_dev`
- **Utilisateur** : `inkspot_user`
- **Mot de passe** : `inkspot_password`

## 🐛 Dépannage

### Problème de Hot Reload

Si le hot reload ne fonctionne pas :

1. **Vérifiez les volumes** :
   ```bash
   docker-compose -f docker-compose.dev.yml exec app ls -la /app
   ```

2. **Redémarrez le service** :
   ```bash
   docker-compose -f docker-compose.dev.yml restart app
   ```

3. **Vérifiez les logs** :
   ```bash
   docker-compose -f docker-compose.dev.yml logs app
   ```

### Problème de Ports

Si un port est déjà utilisé :

1. **Arrêtez le service local** qui utilise le port
2. **Modifiez le port** dans `docker-compose.dev.yml`
3. **Redémarrez** l'environnement

### Problème de Base de Données

Si la base de données ne démarre pas :

1. **Nettoyez les volumes** :
   ```bash
   ./scripts/start-dev.sh --clean
   ```

2. **Vérifiez les logs PostgreSQL** :
   ```bash
   docker-compose -f docker-compose.dev.yml logs postgres
   ```

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Docker](https://docs.docker.com/)
- [Documentation Prisma](https://www.prisma.io/docs/)

## 🤝 Support

Pour toute question ou problème :
1. Vérifiez ce guide
2. Consultez les logs Docker
3. Vérifiez la documentation des outils utilisés
4. Créez une issue sur GitHub si nécessaire
