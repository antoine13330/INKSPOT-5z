#!/bin/bash

# INKSPOT Pull Request Creation Script
# This script creates Pull Requests for all feature and fix branches

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# GitHub configuration
REPO_OWNER="antoine13330"
REPO_NAME="INKSPOT-5z"
BASE_BRANCH="dev"

# Array of branches to create PRs for
BRANCHES=(
    "fix/docker-build-issues"
    "fix/api-routes-stripe-s3"
    "fix/grafana-dashboard-json-structure"
    "feature/docker-cleanup-ngrok-replacement"
    "feature/monitoring-stack-setup"
    "feature/scripts-and-documentation"
    "feature/ui-components-and-hooks"
    "feature/pages-and-api-routes"
)

# Function to create a Pull Request
create_pull_request() {
    local branch=$1
    local title=""
    local body=""
    
    case $branch in
        "fix/docker-build-issues")
            title="🔧 Fix: Resolve Docker build issues and optimize build process"
            body="## 🔧 Fix: Docker Build Issues

### **Problème résolu**
- Erreurs de build Docker avec Stripe/S3
- Optimisation du processus de build
- Correction des imports WebSocket

### **Fichiers modifiés**
- \`Dockerfile\` - Optimisation du build multi-stage
- \`Dockerfile.websocket\` - Correction des imports CommonJS
- \`.dockerignore\` - Exclusion des fichiers inutiles

### **Corrections apportées**
- ✅ Initialisation conditionnelle des clients Stripe/S3
- ✅ Variables ENV factices pour le build
- ✅ Optimisation de l'installation des dépendances
- ✅ Correction des imports WebSocket (CommonJS)
- ✅ Suppression de \`npx prisma db push\` du build

### **Résultat**
- Build Docker optimisé et fiable
- Temps de build réduit
- Gestion gracieuse des variables d'environnement manquantes

**Closes:** Docker build issues"
            ;;
        "fix/api-routes-stripe-s3")
            title="🔧 Fix: Resolve API routes and Stripe/S3 integration issues"
            body="## 🔧 Fix: API Routes and Stripe/S3 Integration

### **Problème résolu**
- Erreurs d'API et intégration Stripe/S3
- Gestion des variables d'environnement manquantes

### **Fichiers modifiés**
- \`lib/stripe.ts\` - Gestion gracieuse des clés manquantes
- \`lib/s3.ts\` - Gestion gracieuse des credentials manquants
- \`app/api/upload/route.ts\` - Correction des appels de fonctions
- \`app/api/bookings/route.ts\` - Utilisation des helpers Stripe
- \`app/api/stripe/webhook/route.ts\` - Vérifications de nullité

### **Corrections apportées**
- ✅ Gestion gracieuse des variables d'environnement manquantes
- ✅ Correction des appels de fonctions (\`generateS3Key\`, \`refundPayment\`)
- ✅ Vérifications de nullité pour les clients Stripe/S3
- ✅ Amélioration de la gestion d'erreurs

### **Résultat**
- API routes robustes
- Gestion d'erreurs améliorée
- Compatibilité avec le build Docker

**Closes:** API integration issues"
            ;;
        "fix/grafana-dashboard-json-structure")
            title="🔧 Fix: Correct Grafana dashboard JSON structure"
            body="## 🔧 Fix: Grafana Dashboard JSON Structure

### **Problème résolu**
- Erreurs de provisioning Grafana
- \"Dashboard title cannot be empty\" error

### **Fichiers modifiés**
- \`monitoring/grafana/dashboards/inkspot-overview.json\`
- \`monitoring/grafana/dashboards/inkspot-business.json\`
- \`monitoring/grafana/dashboards/inkspot-technical.json\`
- \`monitoring/grafana/dashboards/inkspot-realtime.json\`

### **Corrections apportées**
- ✅ Suppression du wrapper \`\"dashboard\": {}\`
- ✅ Placement des propriétés directement à la racine
- ✅ Correction de l'erreur \"Dashboard title cannot be empty\"

### **Résultat**
- Dashboards Grafana fonctionnels
- Provisioning automatique réussi
- Monitoring stack opérationnel

**Closes:** Grafana dashboard errors"
            ;;
        "feature/docker-cleanup-ngrok-replacement")
            title="🚀 Feature: Replace ngrok with LocalTunnel for webhook tunneling"
            body="## 🚀 Feature: LocalTunnel Integration

### **Fonctionnalité ajoutée**
- Remplacement de ngrok par LocalTunnel
- Solution aux problèmes de session simultanée

### **Fichiers modifiés**
- \`docker-compose.yml\` - Suppression ngrok, ajout LocalTunnel
- \`env.example\` - Nettoyage des variables ngrok
- \`scripts/start-docker.sh\` - Script de démarrage simplifié

### **Améliorations apportées**
- ✅ Suppression complète de ngrok et Cloudflare
- ✅ Ajout de LocalTunnel pour les webhooks
- ✅ URL webhook : \`https://inkspot-webhook.loca.lt\`
- ✅ Script de démarrage simplifié

### **Résultat**
- Webhooks Stripe fonctionnels
- Pas de limite de session
- Configuration simplifiée

**Closes:** ngrok session limits"
            ;;
        "feature/monitoring-stack-setup")
            title="🚀 Feature: Add comprehensive monitoring stack"
            body="## 🚀 Feature: Monitoring Stack Setup

### **Fonctionnalité ajoutée**
- Stack de monitoring complet
- Observabilité de l'application

### **Composants ajoutés**
- **Grafana** - Dashboards de visualisation
- **Prometheus** - Collecte de métriques
- **Node Exporter** - Métriques système
- **Postgres Exporter** - Métriques base de données

### **Dashboards créés**
- \`inkspot-business.json\` - Métriques business
- \`inkspot-technical.json\` - Métriques techniques
- \`inkspot-realtime.json\` - Monitoring temps réel
- \`inkspot-overview.json\` - Vue d'ensemble

### **Fonctionnalités**
- ✅ Métriques business (revenue, bookings, users)
- ✅ Métriques techniques (performance, errors, resources)
- ✅ Monitoring temps réel
- ✅ Collecte automatique de métriques système et DB

### **Résultat**
- Observabilité complète de l'application
- Monitoring en temps réel
- Alertes et notifications

**Closes:** monitoring requirements"
            ;;
        "feature/scripts-and-documentation")
            title="🚀 Feature: Add comprehensive scripts and documentation"
            body="## 🚀 Feature: Scripts and Documentation

### **Fonctionnalité ajoutée**
- Scripts automatisés et documentation complète
- Workflow de développement optimisé

### **Scripts ajoutés**
- \`start-docker.sh\` - Gestion Docker Compose avec LocalTunnel
- \`backup.sh\` - Sauvegarde automatique
- \`build.sh\` - Build de production
- \`reset-database.ts\` - Reset de base de données
- \`verify-database.ts\` - Vérification de base de données

### **Documentation ajoutée**
- \`ENVIRONMENT_SETUP.md\` - Guide de setup environnement
- \`DOCKER_SETUP.md\` - Guide de setup Docker
- \`MODULAR_ARCHITECTURE.md\` - Architecture modulaire
- \`DESIGN_SYSTEM_GUIDE.md\` - Guide du système de design
- \`DATABASE_RESET_SUMMARY.md\` - Résumé des resets DB

### **Fonctionnalités**
- ✅ Workflow de développement automatisé
- ✅ Documentation complète du projet
- ✅ Scripts de maintenance et backup
- ✅ Guides de setup et configuration

### **Résultat**
- Workflow de développement optimisé
- Documentation complète et maintenable
- Scripts de maintenance automatisés

**Closes:** documentation and automation requirements"
            ;;
        "feature/ui-components-and-hooks")
            title="🚀 Feature: Add comprehensive UI components and custom hooks"
            body="## 🚀 Feature: UI Components and Custom Hooks

### **Fonctionnalité ajoutée**
- Composants UI modernes et hooks personnalisés
- Interface utilisateur améliorée

### **Composants ajoutés**
- **Chat Interface** - Messagerie temps réel
- **Conversation Management** - Gestion des conversations
- **User Menu** - Menu utilisateur et navigation
- **Typing Indicators** - Indicateurs de frappe
- **Message Bubbles** - Bulles de messages

### **Hooks personnalisés**
- \`useApi\` - Gestion des requêtes API
- \`useLocalStorage\` - Utilitaires de stockage local
- \`useRecommendations\` - Système de recommandations

### **Types TypeScript**
- Extensions NextAuth
- Types de réponses API
- Types de props de composants

### **Fonctionnalités**
- ✅ Interface de chat en temps réel
- ✅ Gestion des conversations
- ✅ Menu utilisateur et navigation
- ✅ Indicateurs de frappe
- ✅ Hooks réutilisables

### **Résultat**
- Interface utilisateur moderne
- Composants réutilisables
- Expérience utilisateur améliorée

**Closes:** UI/UX requirements"
            ;;
        "feature/pages-and-api-routes")
            title="🚀 Feature: Add comprehensive pages and API routes"
            body="## 🚀 Feature: Pages and API Routes

### **Fonctionnalité ajoutée**
- Pages et routes API complètes
- Fonctionnalités d'application complètes

### **Pages ajoutées**
- **Authentication** - Login, register, reset password
- **Conversations** - Messagerie temps réel
- **Profile** - Gestion du profil utilisateur
- **Search** - Recherche et recommandations
- **Admin Dashboard** - Dashboard administrateur

### **API Routes ajoutées**
- **Authentication** - Endpoints d'authentification
- **Bookings** - Gestion des réservations
- **Health Checks** - Monitoring et health checks
- **File Upload** - Upload de fichiers
- **WebSocket** - Connexions temps réel

### **Fonctionnalités**
- ✅ Authentification avec NextAuth
- ✅ Messagerie temps réel avec WebSocket
- ✅ Upload de fichiers avec S3
- ✅ Système de recherche et recommandations
- ✅ Gestion des réservations et paiements

### **Résultat**
- Application fonctionnelle complète
- API robuste et sécurisée
- Expérience utilisateur complète

**Closes:** core application requirements"
            ;;
        *)
            title="🔄 Update: $branch"
            body="## 🔄 Update: $branch

This is an automated Pull Request for the branch \`$branch\`.

Please review the changes and provide feedback."
            ;;
    esac
    
    print_status "Creating PR for $branch..."
    
    # Create PR using GitHub CLI (if available)
    if command -v gh &> /dev/null; then
        gh pr create \
            --repo "$REPO_OWNER/$REPO_NAME" \
            --base "$BASE_BRANCH" \
            --head "$branch" \
            --title "$title" \
            --body "$body" \
            --draft
        print_success "PR created for $branch using GitHub CLI"
    else
        print_warning "GitHub CLI not found. Please create PR manually:"
        print_status "https://github.com/$REPO_OWNER/$REPO_NAME/pull/new/$branch"
        print_status "Title: $title"
        print_status "Body: $body"
    fi
}

# Main script
main() {
    print_status "Starting Pull Request creation for INKSPOT project..."
    
    for branch in "${BRANCHES[@]}"; do
        print_status "Processing branch: $branch"
        create_pull_request "$branch"
        echo ""
    done
    
    print_success "All Pull Requests have been processed!"
    print_status "Please review and merge the PRs as needed."
}

# Run main function
main "$@" 