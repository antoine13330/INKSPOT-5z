#!/bin/bash

# Script de déploiement Docker pour INKSPOT
# Usage: ./scripts/deploy-docker.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
APP_NAME="inkspot"
DOCKER_REGISTRY="your-registry.com"  # Changez par votre registry
VPS_HOST="your-vps-ip.com"           # Changez par votre VPS
VPS_USER="root"                       # Changez par votre utilisateur VPS

echo "🚀 Déploiement INKSPOT sur $ENVIRONMENT..."

# 1. Build de l'image Docker
echo "📦 Building Docker image..."
docker build -t $APP_NAME:$ENVIRONMENT .

# 2. Tag et push vers le registry (optionnel)
if [ ! -z "$DOCKER_REGISTRY" ]; then
    echo "📤 Pushing to registry..."
    docker tag $APP_NAME:$ENVIRONMENT $DOCKER_REGISTRY/$APP_NAME:$ENVIRONMENT
    docker push $DOCKER_REGISTRY/$APP_NAME:$ENVIRONMENT
fi

# 3. Déploiement sur le VPS
echo "🌐 Deploying to VPS..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
    # Arrêter les containers existants
    echo "🛑 Stopping existing containers..."
    docker-compose down || true
    
    # Pull la dernière image (si registry)
    if [ ! -z "$DOCKER_REGISTRY" ]; then
        docker pull $DOCKER_REGISTRY/$APP_NAME:$ENVIRONMENT
    fi
    
    # Démarrer les nouveaux containers
    echo "🚀 Starting new containers..."
    docker-compose up -d
    
    # Vérifier le statut
    echo "🔍 Checking status..."
    docker-compose ps
    
    # Health check
    echo "🏥 Health check..."
    sleep 10
    curl -f http://localhost/health || echo "❌ Health check failed"
    
    echo "✅ Deployment completed!"
EOF

echo "🎉 Déploiement terminé !"
echo "🌐 Votre app est accessible sur: http://$VPS_HOST"
echo "📊 Status: docker-compose ps sur $VPS_HOST"
