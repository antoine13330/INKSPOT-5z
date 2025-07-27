#!/bin/bash

# Script pour configurer GitHub CLI avec token et créer toutes les issues INKSPOT-5z
# Usage: ./setup-github-with-token.sh YOUR_GITHUB_TOKEN

set -e

# Vérifier si le token est fourni
if [ -z "$1" ]; then
    echo "❌ Erreur: Token GitHub requis"
    echo "Usage: $0 YOUR_GITHUB_TOKEN"
    echo ""
    echo "Pour obtenir un token:"
    echo "1. Aller sur https://github.com/settings/tokens"
    echo "2. Créer un 'classic token' avec permissions 'repo' et 'workflow'"
    echo "3. Exécuter: $0 ghp_xxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

GITHUB_TOKEN="$1"
REPO="antoine13330/INKSPOT-5z"
ASSIGNEE="antoine13330"

echo "🔐 Configuration de GitHub CLI avec le token..."

# S'authentifier avec GitHub CLI
echo "$GITHUB_TOKEN" | gh auth login --with-token

# Vérifier l'authentification
echo "✅ Vérification de l'authentification..."
gh auth status

echo "🚀 Début de la création des milestones, labels et issues..."

# Installer jq si pas présent
if ! command -v jq &> /dev/null; then
    echo "📦 Installation de jq..."
    apt-get update && apt-get install -y jq
fi

# Création des milestones
echo "📍 Création des milestones..."
gh api repos/$REPO/milestones -X POST \
    -f title="v1.0 - Core Features" \
    -f description="Fonctionnalités principales de l'application" \
    -f due_on="2025-03-31T23:59:59Z" || echo "⚠️ Milestone v1.0 existe déjà"

gh api repos/$REPO/milestones -X POST \
    -f title="v1.1 - Enhancements" \
    -f description="Améliorations et fonctionnalités avancées" \
    -f due_on="2025-05-31T23:59:59Z" || echo "⚠️ Milestone v1.1 existe déjà"

gh api repos/$REPO/milestones -X POST \
    -f title="v1.2 - Optimization" \
    -f description="Optimisations et performance" \
    -f due_on="2025-07-31T23:59:59Z" || echo "⚠️ Milestone v1.2 existe déjà"

# Création des labels
echo "🏷️ Création des labels..."
declare -A LABELS=(
    ["auth"]="Authentification et sécurité|e11d21"
    ["backend"]="Développement backend|0052cc"
    ["frontend"]="Développement frontend|1d76db"
    ["payments"]="Système de paiement|f9d71c"
    ["messaging"]="Système de messagerie|5319e7"
    ["booking"]="Système de réservation|0e8a16"
    ["search"]="Recherche et recommandations|fbca04"
    ["ui/ux"]="Interface utilisateur|d4c5f9"
    ["testing"]="Tests et qualité|c2e0c6"
    ["performance"]="Performance et optimisation|b60205"
    ["admin"]="Administration|0075ca"
    ["infrastructure"]="Infrastructure et configuration|c5def5"
)

for label in "${!LABELS[@]}"; do
    IFS='|' read -r description color <<< "${LABELS[$label]}"
    gh label create "$label" --description "$description" --color "$color" --force || true
done

# Récupération des IDs des milestones
echo "📊 Récupération des milestones..."
MILESTONE_V1_0=$(gh api repos/$REPO/milestones | jq -r '.[] | select(.title == "v1.0 - Core Features") | .number')
MILESTONE_V1_1=$(gh api repos/$REPO/milestones | jq -r '.[] | select(.title == "v1.1 - Enhancements") | .number')
MILESTONE_V1_2=$(gh api repos/$REPO/milestones | jq -r '.[] | select(.title == "v1.2 - Optimization") | .number')

echo "📝 Création des issues..."

# Issue 1: Infrastructure
gh issue create --title "🏗️ Configuration infrastructure projet" \
--body "**Description:**
Configuration complète de l'infrastructure du projet INKSPOT-5z.

**Tâches:**
- [x] Configuration Next.js 14 avec App Router
- [x] Configuration Prisma avec PostgreSQL
- [x] Configuration Tailwind CSS + shadcn/ui
- [x] Configuration TypeScript
- [x] Structure des dossiers
- [ ] Configuration CI/CD
- [ ] Configuration Docker
- [ ] Variables d'environnement de production

**Priorité:** Haute | **Estimation:** 6 heures | **Statut:** ✅ TERMINÉ

**Fichiers concernés:**
- package.json, next.config.mjs, tailwind.config.ts, tsconfig.json, prisma/schema.prisma" \
--assignee $ASSIGNEE --label "infrastructure,enhancement" --milestone $MILESTONE_V1_0

# Issue 2: Authentification
gh issue create --title "🔐 Système d'authentification NextAuth" \
--body "**Description:**
Implémentation complète du système d'authentification avec NextAuth.

**Tâches:**
- [x] Configuration NextAuth
- [x] OAuth Google et Apple
- [x] Gestion des rôles (CLIENT, PRO, ADMIN)
- [x] Middleware de protection des routes
- [x] API d'inscription/connexion
- [ ] Authentification à deux facteurs (2FA)
- [ ] Limitation des tentatives de connexion
- [ ] Récupération de mot de passe
- [ ] Vérification email

**Priorité:** Haute | **Estimation:** 12 heures | **Statut:** 🚧 EN COURS

**Fichiers concernés:**
- lib/auth.ts, app/api/auth/, middleware.ts, app/auth/" \
--assignee $ASSIGNEE --label "auth,backend,enhancement" --milestone $MILESTONE_V1_0

# Issue 3: Gestion utilisateurs
gh issue create --title "👥 Gestion complète des utilisateurs" \
--body "**Description:**
Système complet de gestion des profils utilisateurs avec différenciation CLIENT/PRO.

**Tâches:**
- [x] Modèle User avec rôles
- [x] Profils utilisateurs basiques
- [x] API de gestion des utilisateurs
- [x] Système de suivi des interactions
- [ ] Profils personnalisables pour PROs
- [ ] Système de vérification des comptes PRO
- [ ] Gestion des portfolios
- [ ] Système de notation/avis
- [ ] Géolocalisation des PROs

**Priorité:** Haute | **Estimation:** 16 heures | **Statut:** 🚧 EN COURS

**Fichiers concernés:**
- prisma/schema.prisma, app/api/users/, app/profile/, app/pro/" \
--assignee $ASSIGNEE --label "backend,frontend,enhancement" --milestone $MILESTONE_V1_0

# Issue 4: Posts et interactions
gh issue create --title "📝 Système de posts et interactions" \
--body "**Description:**
Fonctionnalités complètes de création, partage et interaction avec les posts.

**Tâches:**
- [x] Modèle Post avec images
- [x] API CRUD posts
- [x] Système de likes
- [x] Système de commentaires
- [x] Upload d'images
- [x] Gestion des hashtags
- [ ] Système de partage
- [ ] Posts épinglés
- [ ] Brouillons
- [ ] Programmation de posts
- [ ] Statistiques des posts

**Priorité:** Haute | **Estimation:** 14 heures | **Statut:** ✅ FONCTIONNEL

**Fichiers concernés:**
- app/api/posts/, app/posts/, components/ui/image-upload.tsx" \
--assignee $ASSIGNEE --label "backend,frontend,enhancement" --milestone $MILESTONE_V1_0

# Issue 5: Messagerie
gh issue create --title "💬 Système de messagerie en temps réel" \
--body "**Description:**
Implémentation d'un système de messagerie complet avec conversations individuelles et de groupe.

**Tâches:**
- [x] Modèles Conversation, Message
- [x] API de messagerie
- [x] Conversations privées
- [ ] Messagerie temps réel (WebSockets)
- [ ] Conversations de groupe
- [ ] Partage de fichiers/images
- [ ] Messages vocaux
- [ ] Statuts de lecture
- [ ] Recherche dans les messages

**Priorité:** Haute | **Estimation:** 20 heures | **Statut:** 🚧 EN COURS

**Fichiers concernés:**
- app/api/messages/, app/api/conversations/, app/conversations/" \
--assignee $ASSIGNEE --label "messaging,backend,frontend" --milestone $MILESTONE_V1_0

# Issue 6: Réservations
gh issue create --title "📅 Système de réservation PRO" \
--body "**Description:**
Système complet de réservation entre clients et professionnels.

**Tâches:**
- [x] Modèle Booking
- [x] API de réservation
- [x] Gestion des créneaux
- [x] Calcul automatique des acomptes (25%)
- [x] Vérification des conflits
- [ ] Calendrier interactif
- [ ] Notifications de rappel
- [ ] Gestion des annulations
- [ ] Politique de remboursement
- [ ] Récurrence de réservations

**Priorité:** Haute | **Estimation:** 18 heures | **Statut:** 🚧 EN COURS

**Fichiers concernés:**
- app/api/bookings/, app/booking/, components/booking-form.tsx" \
--assignee $ASSIGNEE --label "booking,backend,frontend" --milestone $MILESTONE_V1_0

# Issue 7: Paiements
gh issue create --title "💳 Intégration Stripe et gestion des paiements" \
--body "**Description:**
Système complet de paiements avec Stripe Connect pour les professionnels.

**Tâches:**
- [x] Configuration Stripe
- [x] Modèles Payment, Transaction, Invoice
- [x] API de paiement
- [x] Stripe Connect pour PROs
- [ ] Webhooks Stripe complets
- [ ] Gestion des remboursements
- [ ] Facturation automatique
- [ ] Rapports financiers
- [ ] Gestion TVA/SIRET
- [ ] Virements automatiques

**Priorité:** Haute | **Estimation:** 16 heures | **Statut:** 🚧 EN COURS

**Fichiers concernés:**
- lib/stripe.ts, app/api/payments/, app/api/stripe/" \
--assignee $ASSIGNEE --label "payments,backend" --milestone $MILESTONE_V1_0

# Issue 8: Interface utilisateur
gh issue create --title "🎨 Interface utilisateur et UX" \
--body "**Description:**
Développement d'une interface moderne et responsive avec une excellente UX.

**Tâches:**
- [x] Configuration shadcn/ui
- [x] Composants de base (Button, Card, etc.)
- [x] Navigation bottom pour mobile
- [x] Pages principales (Home, Profile, Search)
- [x] Système de thèmes
- [ ] Design system complet
- [ ] Animations et transitions
- [ ] Mode sombre
- [ ] Accessibilité (WCAG)
- [ ] Progressive Web App (PWA)
- [ ] Optimisation mobile

**Priorité:** Haute | **Estimation:** 24 heures | **Statut:** 🚧 EN COURS

**Fichiers concernés:**
- components/ui/, components/, app/globals.css, tailwind.config.ts" \
--assignee $ASSIGNEE --label "ui/ux,frontend" --milestone $MILESTONE_V1_0

# Issue 9: Tests
gh issue create --title "🧪 Suite de tests complète" \
--body "**Description:**
Implémentation d'une suite de tests complète pour assurer la qualité du code.

**Tâches:**
- [x] Configuration Jest
- [x] Tests unitaires de base (9 fichiers)
- [x] Tests API
- [x] Tests composants React
- [ ] Tests d'intégration
- [ ] Tests E2E (Playwright)
- [ ] Coverage reports
- [ ] Tests de performance
- [ ] Tests de sécurité

**Priorité:** Haute | **Estimation:** 20 heures | **Statut:** 🚧 EN COURS

**Fichiers concernés:**
- __tests__/, jest.config.js, jest.setup.js" \
--assignee $ASSIGNEE --label "testing,enhancement" --milestone $MILESTONE_V1_0

# Issue 10: Recherche
gh issue create --title "🔍 Moteur de recherche et recommandations" \
--body "**Description:**
Système intelligent de recherche et recommandations basé sur l'IA.

**Tâches:**
- [x] API de recherche posts
- [x] API de recherche utilisateurs
- [x] Recherche par hashtags
- [x] Historique de recherche
- [x] Système de recommandations basique
- [ ] Recherche avancée avec filtres
- [ ] Recommandations ML/AI
- [ ] Recherche géographique
- [ ] Suggestions auto-complètes
- [ ] Analytics de recherche

**Priorité:** Moyenne | **Estimation:** 14 heures | **Statut:** 🚧 EN COURS

**Fichiers concernés:**
- app/api/search/, app/api/posts/search/, lib/recommendations.ts, app/search/" \
--assignee $ASSIGNEE --label "search,backend,frontend" --milestone $MILESTONE_V1_1

# Issue 11: Notifications
gh issue create --title "🔔 Système de notifications push" \
--body "**Description:**
Implémentation d'un système complet de notifications push et email.

**Tâches:**
- [x] Modèle Notification
- [x] API de notifications
- [ ] Notifications push web
- [ ] Notifications email
- [ ] Préférences de notifications
- [ ] Notifications temps réel
- [ ] Templates de notifications
- [ ] Notifications programmées

**Priorité:** Moyenne | **Estimation:** 12 heures | **Statut:** 🚧 EN COURS

**Fichiers concernés:**
- app/api/notifications/, lib/notifications.ts, lib/email.ts, components/notifications-panel.tsx" \
--assignee $ASSIGNEE --label "backend,frontend" --milestone $MILESTONE_V1_1

# Issue 12: Administration
gh issue create --title "🛠️ Panel d'administration" \
--body "**Description:**
Interface d'administration complète pour la gestion de la plateforme.

**Tâches:**
- [x] API admin de base
- [x] Gestion des utilisateurs
- [ ] Dashboard avec statistiques
- [ ] Modération des contenus
- [ ] Gestion des signalements
- [ ] Analytics et rapports
- [ ] Configuration de la plateforme
- [ ] Logs et monitoring

**Priorité:** Moyenne | **Estimation:** 16 heures | **Statut:** 🚧 EN COURS

**Fichiers concernés:**
- app/admin/, app/api/admin/" \
--assignee $ASSIGNEE --label "admin,backend,frontend" --milestone $MILESTONE_V1_1

# Issue 13: Sécurité
gh issue create --title "🛡️ Sécurisation de l'application" \
--body "**Description:**
Implémentation de mesures de sécurité complètes.

**Tâches:**
- [x] Hachage des mots de passe (bcrypt)
- [x] Protection CSRF (NextAuth)
- [x] Validation des entrées (Zod)
- [ ] Rate limiting
- [ ] Audit de sécurité
- [ ] HTTPS forcé
- [ ] Headers de sécurité
- [ ] Validation côté serveur stricte
- [ ] Sanitisation des données
- [ ] Logs de sécurité

**Priorité:** Haute | **Estimation:** 12 heures | **Statut:** 🚧 EN COURS" \
--assignee $ASSIGNEE --label "auth,backend,enhancement" --milestone $MILESTONE_V1_1

# Issue 14: Documentation
gh issue create --title "📚 Documentation technique complète" \
--body "**Description:**
Création d'une documentation technique complète du projet.

**Tâches:**
- [ ] Documentation API (OpenAPI/Swagger)
- [ ] Guide de déploiement
- [ ] Guide de contribution
- [ ] Architecture documentation
- [ ] Database schema documentation
- [ ] Component library documentation
- [ ] User guide
- [ ] Troubleshooting guide

**Priorité:** Moyenne | **Estimation:** 10 heures | **Statut:** 📋 À PLANIFIER" \
--assignee $ASSIGNEE --label "documentation,enhancement" --milestone $MILESTONE_V1_1

# Issue 15: Performance
gh issue create --title "⚡ Optimisations de performance" \
--body "**Description:**
Optimisations complètes pour améliorer les performances de l'application.

**Tâches:**
- [ ] Optimisation des requêtes Prisma
- [ ] Cache Redis
- [ ] Optimisation des images (Next.js Image)
- [ ] Lazy loading des composants
- [ ] Bundle analysis et tree shaking
- [ ] CDN pour les assets
- [ ] Service Workers
- [ ] Monitoring des performances

**Priorité:** Basse | **Estimation:** 16 heures | **Statut:** 📋 À PLANIFIER

**Objectifs:**
- Temps de chargement < 2s
- Core Web Vitals optimisés
- Réduction de la taille du bundle" \
--assignee $ASSIGNEE --label "performance,enhancement" --milestone $MILESTONE_V1_2

echo ""
echo "✅ Création terminée avec succès!"
echo ""
echo "📊 Résumé:"
echo "- 3 milestones créés"
echo "- 12 labels créés"
echo "- 15 issues créées et assignées"
echo ""
echo "🔗 Liens utiles:"
echo "- Issues: https://github.com/$REPO/issues"
echo "- Milestones: https://github.com/$REPO/milestones"
echo "- Tableau de bord: https://github.com/$REPO/projects"
echo ""
echo "📋 Commandes de vérification:"
echo "gh issue list"
echo "gh milestone list"
echo "gh issue list --milestone 'v1.0 - Core Features'"