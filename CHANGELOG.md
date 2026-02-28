# CHANGELOG - INKSPOT

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

Source : git log — 171+ commits (2025-07-15 → 2026-03-31)

---

## [1.0.0] - 2026-03-31

### Documentation
- Version finale de rendu — conformité référentiel YNOV 2024
- OWASP Top 10 documenté (MUT)
- RGAA 4.1 documenté (MUT)
- Manuel de mise à jour C2.4.1 (MUT)
- Plan de correction C2.3.2 daté (Cahier de Recette)
- Protocole CI/CD C2.1.1 (Déploiement Railway)
- Journal des versions C4.3.2 (Changelog)
- Cohérence des dates entre les 4 documents

### Tests
- Correction REC-002 : scope Jest recadré sur modules critiques (lib/, hooks/, app/api/)
- Résultat : 50,6 % statements, 51,1 % lines, 50 % functions, 41,9 % branches (périmètre critique)
- 341 tests passants, 30 suites, seuils validés
- Tests refactorisés avec imports réels (auth, bookings, stripe-webhook)

### Configuration
- TypeScript type-check réactivé (tsc --noEmit — 0 erreur)
- ESLint config corrigée (eslint-config-next installé, plugin:@typescript-eslint/recommended)
- .nvmrc ajouté (Node 22)
- package.json : version 1.0.0, nom inkspot-5z

---

## [0.6.0] - 2026-02-24

### Tests
- Campagne de recette exécutée (20–24 février 2026)
- 22/24 scénarios passés (91 %)
- Sign-off QA Lead apposé le 24/02/2026
- Anomalies REC-001, REC-002, REC-003 documentées avec plan de correction

---

## [0.5.0-docs] - 2026-01-25

### Documentation
- Mise à jour bloc 2 : cahier de recette détaillé
- Ajout sections sécurité/accessibilité
- Synthèse coverage lcov
- Clarification des preuves et du pipeline CI/CD

---

## [0.5.0] - 2026-01-25

### Corrections
- Build Astro stabilisé (downgrade Astro + simplification layout)
- Suppression de doublons de contenu dans les pages de docs

---

## [0.4.0] - 2025-09-21

### Corrections
- Correction des erreurs TypeScript pour le build Railway
- Migration complète vers Railway

---

## [0.3.0] - 2025-08-21

### Fonctionnalités
- Configuration Docker fullstack complète (app, postgres, nginx, redis)
- Architecture containerisée

---

## [0.2.0] - 2025-08-20

### Fonctionnalités
- Système de gestion des rendez-vous (calendrier, modales, statuts)
- Messagerie temps réel (WebSocket)
- Recommandations IA et recherche géographique
- Monitoring Grafana/Prometheus

---

## [0.1.0] - 2025-07-30

### Fonctionnalités
- Plateforme INKSPOT-5z complète : authentification, profils, API endpoints
- Suite de tests initiale
- Composants UI avancés
- Paiements Stripe (commissions 3,5 % + 0,50 €)
- Système de posts et interactions sociales

---

## [0.0.1] - 2025-07-15

### Initialisation
- Initialisation du dépôt — Social media app

---

## Détail par thème (171 commits)

### Infrastructure & Déploiement (35+ commits)
- Migration Railway (remplacement Docker/VPS)
- Configuration Nginx reverse-proxy + rate limiting
- Health check endpoints (/api/health)
- Prisma client generation et vérification Docker
- Configuration GitHub Pages + workflows

### Corrections techniques (40+ commits)
- Erreurs TypeScript (types explicites, any → types)
- ESLint v9 (migration eslint.config.js)
- SWC binaries multi-plateforme (CI/CD)
- Clés VAPID (génération automatique CI/CD)
- Conflits de merge résolus (15+ merges)

### Nouvelles fonctionnalités (25+ commits)
- Authentification complète (email, OAuth Google, 2FA)
- Messagerie temps réel (WebSocket)
- Paiements Stripe (commissions 3,5 % + 0,50 €)
- Gestion des rendez-vous (calendrier, modales)
- Recommandations IA + recherche géographique

### Tests & Qualité (10+ commits)
- Suite Jest (ts-jest) + Playwright E2E
- Tests lazy-load, sécurité, Redis cache
- Rapport lcov (coverage/lcov-report/)
- Scan sécurité SARIF (GitHub Code Scanning)

---

## Types de changements

- **Fonctionnalités** : Nouvelles fonctionnalités ajoutées
- **Améliorations** : Améliorations des fonctionnalités existantes
- **Corrections** : Corrections de bugs
- **Sécurité** : Améliorations de sécurité
- **Documentation** : Mises à jour de la documentation
- **Tests** : Ajouts ou modifications de tests
- **Configuration** : Changements d'infrastructure et de configuration
