#!/bin/bash

# Script pour créer automatiquement tous les tickets GitHub pour INKSPOT-5z
# Assurez-vous d'avoir un token GitHub avec les permissions appropriées

set -e

REPO="antoine13330/INKSPOT-5z"
ASSIGNEE="antoine13330"

echo "🚀 Création des milestones, labels et issues pour INKSPOT-5z..."

# Création des milestones
echo "📍 Création des milestones..."
gh api repos/$REPO/milestones -X POST -f title="v1.0 - Core Features" -f description="Fonctionnalités principales de l'application" -f due_on="2025-03-31T23:59:59Z" || echo "Milestone v1.0 existe déjà"
gh api repos/$REPO/milestones -X POST -f title="v1.1 - Enhancements" -f description="Améliorations et fonctionnalités avancées" -f due_on="2025-05-31T23:59:59Z" || echo "Milestone v1.1 existe déjà"
gh api repos/$REPO/milestones -X POST -f title="v1.2 - Optimization" -f description="Optimisations et performance" -f due_on="2025-07-31T23:59:59Z" || echo "Milestone v1.2 existe déjà"

# Création des labels
echo "🏷️ Création des labels..."
gh label create "auth" --description "Authentification et sécurité" --color "e11d21" --force || true
gh label create "backend" --description "Développement backend" --color "0052cc" --force || true
gh label create "frontend" --description "Développement frontend" --color "1d76db" --force || true
gh label create "payments" --description "Système de paiement" --color "f9d71c" --force || true
gh label create "messaging" --description "Système de messagerie" --color "5319e7" --force || true
gh label create "booking" --description "Système de réservation" --color "0e8a16" --force || true
gh label create "search" --description "Recherche et recommandations" --color "fbca04" --force || true
gh label create "ui/ux" --description "Interface utilisateur" --color "d4c5f9" --force || true
gh label create "testing" --description "Tests et qualité" --color "c2e0c6" --force || true
gh label create "performance" --description "Performance et optimisation" --color "b60205" --force || true
gh label create "admin" --description "Administration" --color "0075ca" --force || true
gh label create "infrastructure" --description "Infrastructure et configuration" --color "c5def5" --force || true

# Récupération des IDs des milestones
echo "📊 Récupération des milestones..."
MILESTONE_V1_0=$(gh api repos/$REPO/milestones | jq -r '.[] | select(.title == "v1.0 - Core Features") | .number')
MILESTONE_V1_1=$(gh api repos/$REPO/milestones | jq -r '.[] | select(.title == "v1.1 - Enhancements") | .number')
MILESTONE_V1_2=$(gh api repos/$REPO/milestones | jq -r '.[] | select(.title == "v1.2 - Optimization") | .number')

echo "📝 Création des issues..."

# 1. Infrastructure & Configuration
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

**Priorité:** Haute
**Estimation:** 6 heures
**Statut:** ✅ TERMINÉ - Infrastructure de base en place

**Fichiers concernés:**
- package.json
- next.config.mjs
- tailwind.config.ts
- tsconfig.json
- prisma/schema.prisma" \
--assignee $ASSIGNEE \
--label "infrastructure,enhancement" \
--milestone $MILESTONE_V1_0

# 2. Authentification
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

**Priorité:** Haute
**Estimation:** 12 heures
**Statut:** 🚧 EN COURS - Base fonctionnelle, améliorations à venir

**Fichiers concernés:**
- lib/auth.ts
- app/api/auth/
- middleware.ts
- app/auth/" \
--assignee $ASSIGNEE \
--label "auth,backend,enhancement" \
--milestone $MILESTONE_V1_0

# 3. Gestion des utilisateurs
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

**Priorité:** Haute
**Estimation:** 16 heures
**Statut:** 🚧 EN COURS - CRUD de base implémenté

**Fichiers concernés:**
- prisma/schema.prisma (User model)
- app/api/users/
- app/profile/
- app/pro/" \
--assignee $ASSIGNEE \
--label "backend,frontend,enhancement" \
--milestone $MILESTONE_V1_0

# 4. Système de posts
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

**Priorité:** Haute
**Estimation:** 14 heures
**Statut:** ✅ FONCTIONNEL - Fonctionnalités de base complètes

**Fichiers concernés:**
- app/api/posts/
- app/posts/
- components/ui/image-upload.tsx" \
--assignee $ASSIGNEE \
--label "backend,frontend,enhancement" \
--milestone $MILESTONE_V1_0

# 5. Système de messagerie
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

**Priorité:** Haute
**Estimation:** 20 heures
**Statut:** 🚧 EN COURS - API de base implémentée

**Fichiers concernés:**
- app/api/messages/
- app/api/conversations/
- app/conversations/" \
--assignee $ASSIGNEE \
--label "messaging,backend,frontend" \
--milestone $MILESTONE_V1_0

# 6. Système de réservation
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

**Priorité:** Haute
**Estimation:** 18 heures
**Statut:** 🚧 EN COURS - Backend fonctionnel, UI à améliorer

**Fichiers concernés:**
- app/api/bookings/
- app/booking/
- components/booking-form.tsx" \
--assignee $ASSIGNEE \
--label "booking,backend,frontend" \
--milestone $MILESTONE_V1_0

# 7. Système de paiement
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

**Priorité:** Haute
**Estimation:** 16 heures
**Statut:** 🚧 EN COURS - Intégration de base implémentée

**Fichiers concernés:**
- lib/stripe.ts
- app/api/payments/
- app/api/stripe/" \
--assignee $ASSIGNEE \
--label "payments,backend" \
--milestone $MILESTONE_V1_0

# 8. Recherche et recommandations
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

**Priorité:** Moyenne
**Estimation:** 14 heures
**Statut:** 🚧 EN COURS - Recherche de base fonctionnelle

**Fichiers concernés:**
- app/api/search/
- app/api/posts/search/
- lib/recommendations.ts
- app/search/" \
--assignee $ASSIGNEE \
--label "search,backend,frontend" \
--milestone $MILESTONE_V1_1

# 9. Interface utilisateur
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

**Priorité:** Haute
**Estimation:** 24 heures
**Statut:** 🚧 EN COURS - UI de base fonctionnelle

**Fichiers concernés:**
- components/ui/
- components/
- app/globals.css
- tailwind.config.ts" \
--assignee $ASSIGNEE \
--label "ui/ux,frontend" \
--milestone $MILESTONE_V1_0

# 10. Système de notifications
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

**Priorité:** Moyenne
**Estimation:** 12 heures
**Statut:** 🚧 EN COURS - Structure de base implémentée

**Fichiers concernés:**
- app/api/notifications/
- lib/notifications.ts
- lib/email.ts
- components/notifications-panel.tsx" \
--assignee $ASSIGNEE \
--label "backend,frontend" \
--milestone $MILESTONE_V1_1

# 11. Administration
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

**Priorité:** Moyenne
**Estimation:** 16 heures
**Statut:** 🚧 EN COURS - API de base implémentée

**Fichiers concernés:**
- app/admin/
- app/api/admin/" \
--assignee $ASSIGNEE \
--label "admin,backend,frontend" \
--milestone $MILESTONE_V1_1

# 12. Tests et qualité
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

**Priorité:** Haute
**Estimation:** 20 heures
**Statut:** 🚧 EN COURS - Foundation en place

**Fichiers concernés:**
- __tests__/
- jest.config.js
- jest.setup.js" \
--assignee $ASSIGNEE \
--label "testing,enhancement" \
--milestone $MILESTONE_V1_0

# 13. Performance et optimisation
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

**Priorité:** Basse
**Estimation:** 16 heures
**Statut:** 📋 À PLANIFIER

**Objectifs:**
- Temps de chargement < 2s
- Core Web Vitals optimisés
- Réduction de la taille du bundle" \
--assignee $ASSIGNEE \
--label "performance,enhancement" \
--milestone $MILESTONE_V1_2

# 14. Sécurité
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

**Priorité:** Haute
**Estimation:** 12 heures
**Statut:** 🚧 EN COURS - Sécurité de base implémentée" \
--assignee $ASSIGNEE \
--label "auth,backend,enhancement" \
--milestone $MILESTONE_V1_1

# 15. Documentation
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

**Priorité:** Moyenne
**Estimation:** 10 heures
**Statut:** 📋 À PLANIFIER" \
--assignee $ASSIGNEE \
--label "documentation,enhancement" \
--milestone $MILESTONE_V1_1

echo "✅ Toutes les issues ont été créées avec succès!"
echo "📊 Total: 15 issues principales créées"
echo "🎯 Milestones: v1.0 (8 issues), v1.1 (6 issues), v1.2 (1 issue)"
echo ""
echo "Pour voir toutes les issues: gh issue list"
echo "Pour voir un milestone: gh issue list --milestone 'v1.0 - Core Features'"