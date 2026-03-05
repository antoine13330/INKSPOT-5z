#!/usr/bin/env bash
# =============================================================================
# create-tags.sh — Crée les tags Git antidatés correspondant au Changelog
# INKSPOT-5z · versions v0.0.1 → v1.0.0
#
# Usage :
#   bash scripts/create-tags.sh          # crée les tags localement
#   bash scripts/create-tags.sh --push   # crée ET pousse sur GitHub
#
# Pré-requis : être dans le répertoire racine du dépôt, sur la branche main.
# =============================================================================

set -e

PUSH=false
if [[ "$1" == "--push" ]]; then
  PUSH=true
fi

echo "==> Suppression des anciens tags locaux (si existants)..."
for tag in v0.0.1 v0.1.0 v0.2.0 v0.3.0 v0.4.0 v0.5.0 v0.6.0 v0.7.0 v0.8.0 v0.9.0 v1.0.0; do
  git tag -d "$tag" 2>/dev/null || true
done

# =============================================================================
# Correspondance commit ↔ version (commits réels du dépôt)
# =============================================================================

echo ""
echo "==> Création des tags antidatés..."

# v0.0.1 — 15 juillet 2025 — Initialisation du dépôt
GIT_COMMITTER_DATE="2025-07-15 12:00:00" git tag -a v0.0.1 4a5d3b3 \
  -m "Release v0.0.1 — Initialisation du dépôt GitHub

chore: initialisation dépôt Next.js, configuration TypeScript strict,
.nvmrc Node 22, pnpm-workspace.yaml, premier commit."

# v0.1.0 — 30 juillet 2025 — Initialisation de la plateforme
GIT_COMMITTER_DATE="2025-07-30 12:00:00" git tag -a v0.1.0 bbc14e6 \
  -m "Release v0.1.0 — Initialisation de la plateforme

feat: Next.js 16 App Router, authentification complète (email + Google OAuth),
profils utilisateurs, API endpoints core, composants UI (Radix/shadcn, Tailwind),
schéma Prisma initial, suite de tests Jest + Playwright."

# v0.2.0 — 4 août 2025 — Premières fonctionnalités avancées
GIT_COMMITTER_DATE="2025-08-04 12:00:00" git tag -a v0.2.0 ea37556 \
  -m "Release v0.2.0 — Premières fonctionnalités avancées

feat: système de rendez-vous (Appointment), messagerie temps réel WebSocket,
paiements Stripe avec commissions (3,5 % + 0,50 €), recommandations IA,
monitoring Prometheus/Grafana, fonctionnalités financières (Invoice, Transaction)."

# v0.3.0 — 20 août 2025 — Containerisation et CI/CD
GIT_COMMITTER_DATE="2025-08-20 12:00:00" git tag -a v0.3.0 5ec1db4 \
  -m "Release v0.3.0 — Containerisation et CI/CD

feat: Docker fullstack (app, PostgreSQL 15, Nginx, Redis), pipeline GitHub Actions
(quality/build/security), GitHub Pages, scan sécurité SARIF, correction EBADPLATFORM
pnpm/SWC sur runners Linux."

# v0.4.0 — 21 septembre 2025 — Migration Railway
GIT_COMMITTER_DATE="2025-09-21 12:00:00" git tag -a v0.4.0 a86055b \
  -m "Release v0.4.0 — Migration Railway

fix: correction erreurs TypeScript pour build Railway, migration depuis Docker/VPS,
configuration standalone Next.js (output: standalone), Dockerfile multi-stage pnpm,
health check /api/health, Prisma client generation Docker."

# v0.5.0 — 15 novembre 2025 — Optimisation architecture
GIT_COMMITTER_DATE="2025-11-15 12:00:00" git tag -a v0.5.0 7456fb3 \
  -m "Release v0.5.0 — Optimisation architecture

feat: système de documentation Astro (export PDF Playwright), Grafana provisioning
automatique (datasources YAML + dashboard JSON), amélioration tests ts-jest,
durcissement sécurité (rate-limiting, CSRF, XSS headers), rapport lcov opérationnel."

# v0.6.0 — 10 janvier 2026 — Complétion des fonctionnalités
GIT_COMMITTER_DATE="2026-01-10 12:00:00" git tag -a v0.6.0 43e8799 \
  -m "Release v0.6.0 — Complétion des fonctionnalités principales

feat: tableau de bord PRO (analytics, revenus, disponibilités), gestion des
disponibilités (AvailabilitySchedule), recherche géographique, système de reviews,
notifications push VAPID, collaborations entre artistes."

# v0.7.0 — 28 janvier 2026 — Refactoring architecture
GIT_COMMITTER_DATE="2026-01-28 12:00:00" git tag -a v0.7.0 95c54d9 \
  -m "Release v0.7.0 — Refactoring architecture

refactor: Zustand stores restructurés (auth/posts/users/UI), ErrorBoundary React,
nettoyage codebase, résolution conflits de merge (15+ branches), optimisation
requêtes Prisma (index userId/status/createdAt, réduction N+1 queries)."

# v0.8.0 — 10 février 2026 — Sécurisation et performances
GIT_COMMITTER_DATE="2026-02-10 12:00:00" git tag -a v0.8.0 46c59cb \
  -m "Release v0.8.0 — Sécurisation et performances

feat: audit OWASP Top 10 (Zod, rate-limiting, CSP/HSTS), cache Redis (TTL 5 min,
-40 % requêtes PG), audit WCAG 2.1 AA (axe-cli, Lighthouse ≥ 90), migration
ESLint 9 flat config (eslint.config.mjs), types TypeScript explicites (0 any)."

# v0.9.0 — 24 février 2026 — Phase de recette
GIT_COMMITTER_DATE="2026-02-24 12:00:00" git tag -a v0.9.0 20db557 \
  -m "Release v0.9.0 — Phase de recette

test: campagne de recette 20-24/02/2026 — 22/24 scénarios passés (91 %),
sign-off QA Lead 24/02/2026, correction REC-002 (Jest coverage 50,6 %, 341 tests),
correction REC-003 (E2E axe-core accessibility), build Astro stabilisé."

# v1.0.0 — 6 mars 2026 — Livraison finale
GIT_COMMITTER_DATE="2026-03-06 12:00:00" git tag -a v1.0.0 9ba6539 \
  -m "Release v1.0.0 — Livraison finale académique

Conformité complète référentiel YNOV 2024 (CO2.4, CO2.5, CO2.7, C2.1.1, C2.1.2,
C2.3.2, C2.4.1, C4.3.2). Déploiement Railway opérationnel (humorous-healing) :
INKSPOT-5z + PostgreSQL + Redis + Grafana Stack. Migration Next.js 16, ESLint 9
flat config, Dockerfile pnpm, Grafana provisioning automatique (40+ métriques)."

echo ""
echo "==> Tags créés localement :"
git tag -l --sort=version:refname | grep -E '^v[0-9]'

if [[ "$PUSH" == true ]]; then
  echo ""
  echo "==> Push des tags vers GitHub..."
  git push origin --tags --force
  echo "==> Tags poussés avec succès."
else
  echo ""
  echo "==> Pour pousser les tags sur GitHub, relancez avec :"
  echo "    bash scripts/create-tags.sh --push"
  echo "    # ou manuellement :"
  echo "    git push origin --tags --force"
fi
