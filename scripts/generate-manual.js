/*
  Inkspot Technical Manual Generator
  - Produces a .docx manual with:
    - Automatic Table of Contents
    - Times New Roman, 11 pt default
    - Mermaid diagrams as fenced code blocks
    - External images embedded by URL (fallbacks to URL text if fetch fails)
    - Explicit screenshot placeholders
  - Content is derived from the repository structure and key files
*/

const fs = require('fs')
const path = require('path')
const { Document, Packer, Paragraph, HeadingLevel, TextRun, TableOfContents, ImageRun, PageBreak } = require('docx')

// Node 18+ provides global fetch. If unavailable, attempt dynamic import of node-fetch.
async function ensureFetch() {
  if (typeof fetch === 'function') return fetch
  try {
    const mod = await import('node-fetch')
    // node-fetch v3 default export is fetch
    return mod.default
  } catch (e) {
    return null
  }
}

function readTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (e) {
    return ''
  }
}

function listFilesRecursive(dir) {
  const results = []
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true })
    for (const item of items) {
      const full = path.join(dir, item.name)
      if (item.isDirectory()) {
        results.push(...listFilesRecursive(full))
      } else {
        results.push(full)
      }
    }
  } catch (e) {
    // ignore
  }
  return results
}

function getApiRoutesSummary(apiRoot) {
  const files = listFilesRecursive(apiRoot)
  const routes = []
  for (const file of files) {
    if (file.endsWith('route.ts') || file.endsWith('route.js') || file.endsWith('route.tsx')) {
      const rel = file.replace(/\\/g, '/').split('/app/api/')[1]
      if (rel) {
        const routePath = '/' + rel.replace(/\/route\.(t|j)sx?$/, '')
        routes.push(routePath)
      }
    }
  }
  routes.sort()
  return routes
}

function extractPrismaModels(schemaContent) {
  const models = []
  const lines = schemaContent.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^model\s+(\w+)\s+\{/)
    if (m) {
      const modelName = m[1]
      models.push(modelName)
    }
  }
  return models
}

function kvTableParagraphs(title, obj) {
  const paras = []
  paras.push(new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text: title, bold: true })],
  }))
  const entries = Object.entries(obj || {})
  if (entries.length === 0) {
    paras.push(new Paragraph({ children: [new TextRun({ text: 'N/A' })] }))
    return paras
  }
  for (const [k, v] of entries) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${k}: `, bold: true }),
          new TextRun({ text: typeof v === 'string' ? v : JSON.stringify(v) }),
        ],
      })
    )
  }
  return paras
}

function codeBlock(text, opts = {}) {
  const font = opts.font || 'Courier New'
  const size = opts.size || 20 // ~10pt for code readability
  const lines = (text || '').split('\n')
  const blocks = []
  blocks.push(new Paragraph({ children: [new TextRun({ text: '```mermaid', font, size })] }))
  for (const line of lines) {
    blocks.push(new Paragraph({ children: [new TextRun({ text: line, font, size })] }))
  }
  blocks.push(new Paragraph({ children: [new TextRun({ text: '```', font, size })] }))
  return blocks
}

function monoBlock(text, opts = {}) {
  const font = opts.font || 'Courier New'
  const size = opts.size || 20
  const lines = (text || '').split('\n')
  const blocks = []
  for (const line of lines) {
    blocks.push(new Paragraph({ children: [new TextRun({ text: line, font, size })] }))
  }
  return blocks
}

function textParagraphs(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .flatMap((chunk, idx) => {
      const lines = chunk.split(/\n/)
      const runs = []
      for (let i = 0; i < lines.length; i++) {
        runs.push(new TextRun({ text: lines[i] }))
        if (i < lines.length - 1) {
          runs.push(new TextRun({ text: '\n' }))
        }
      }
      const p = new Paragraph({ children: runs })
      // Insert page break occasionally for structure
      if (idx > 0 && idx % 6 === 0) {
        return [new Paragraph({}), p, new Paragraph({ children: [new PageBreak()] })]
      }
      return [p]
    })
}

function screenPlaceholder(label) {
  return new Paragraph({
    children: [
      new TextRun({ text: '📌 Screen: ', bold: true }),
      new TextRun({ text: label })
    ]
  })
}

async function imageByUrl(url, width = 520) {
  try {
    const _fetch = await ensureFetch()
    if (!_fetch) throw new Error('fetch unavailable')
    const res = await _fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ab = await res.arrayBuffer()
    const buf = Buffer.from(ab)
    return new ImageRun({ data: buf, transformation: { width } })
  } catch (e) {
    return null
  }
}

async function imageParagraphOrLink(url, width) {
  const img = await imageByUrl(url, width)
  if (img) {
    return new Paragraph({ children: [img] })
  }
  return new Paragraph({ children: [
    new TextRun({ text: 'Image (URL): ', bold: true }),
    new TextRun({ text: url, underline: {} })
  ]})
}

async function build() {
  const root = process.cwd()
  const docsDir = path.join(root, 'docs')
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir)

  const pkgPath = path.join(root, 'package.json')
  const pkg = JSON.parse(readTextSafe(pkgPath) || '{}')
  const readme = readTextSafe(path.join(root, 'README.md'))
  const buildDoc = readTextSafe(path.join(root, 'docs', 'BUILD_AND_DEPLOYMENT.md'))
  const appointmentDoc = readTextSafe(path.join(root, 'docs', 'APPOINTMENT_SYSTEM_COMPLETE.md'))
  const prismaSchemaPath = path.join(root, 'prisma', 'schema.prisma')
  const prismaSchema = readTextSafe(prismaSchemaPath)
  const prismaModels = extractPrismaModels(prismaSchema)
  const apiRoot = path.join(root, 'app', 'api')
  const apiRoutes = getApiRoutesSummary(apiRoot)
  const prometheusYml = readTextSafe(path.join(root, 'monitoring', 'prometheus', 'prometheus.yml'))
  const grafanaOverview = readTextSafe(path.join(root, 'monitoring', 'grafana', 'dashboards', 'inkspot-overview.json'))

  // Narrative-heavy sections to expand textual content significantly
  const introNarrative = [
    'Inkspot est une application destinée aux professionnels qui souhaitent présenter leur travail, échanger avec des clients et gérer des rendez-vous avec un parcours de paiement intégré. L’objectif technique est double: offrir une expérience fluide côté utilisateur (navigation rapide, interactions en temps réel, sécurité par défaut) et fournir une plateforme d’exploitation robuste côté opérateurs (observabilité, déploiements reproductibles, résilience).',
    'Le système est construit sur Next.js (App Router), avec des routes d’API qui encapsulent toutes les fonctions critiques: authentification, gestion des utilisateurs, messagerie, rendez-vous, paiements Stripe, notifications, et export/visualisation de métrriques. Prisma orchestre l’accès à PostgreSQL avec un schéma riche en relations (utilisateurs, conversations, messages, rendez-vous, paiements, factures, notifications…). L’écosystème comprend Redis (cache et coordination légère), AWS S3 pour le stockage d’objets et un reverse proxy Nginx en frontal pour la terminaison TLS, la montée en charge horizontale et la gestion des websockets.',
    'Du point de vue de la sécurité, Inkspot applique un middleware spécialisé (limitation de débit, assainissement et en-têtes de protection) et une authentification via NextAuth (JWT) avec possibilité d’OAuth (Google). Les communications sensibles sont chiffrées en transit (HTTPS), et le modèle de données est conçu pour minimiser les surfaces d’attaque (ex: pas d’accès direct au stockage d’objets, politique de permissions côté API).',
    'Côté exploitation, une route "/api/metrics" expose des indicateurs métiers et techniques en format Prometheus. Un stack Prometheus + Grafana récupère ces métriques (récupérations applicatives, exporteurs système et base de données) afin d’alimenter des tableaux de bord et des alertes. Le tout est prévu pour tourner localement (Docker Compose dev) et en production (Docker Compose prod), en conservant des principes identiques: déclaratif, traçable et observable. Pour les détails exhaustifs et extraits de configuration, voir les annexes D, E et F.'
  ].join('\n\n')

  const stackNarrative = [
    'Côté développement, l’environnement recommandé repose sur Node.js 18+, npm/pnpm, Prisma (CLI) et Docker Desktop pour simuler les services dépendants (PostgreSQL, Redis, Prometheus, Grafana, MailHog). Les scripts npm permettent de lancer le serveur en mode développement, d’exécuter les tests, de pousser le schéma Prisma et de peupler la base. La convention est de regrouper les routes API sous "app/api/*" et de centraliser les services horizontaux (Stripe, monitoring, stockage) dans "lib/*".',
    'En production, l’application est conteneurisée. Un reverse proxy Nginx reçoit le trafic, gère TLS et relaie vers l’application (port 3000) et le service WebSocket (port 3001). Les variables d’environnement (ex: NEXTAUTH_SECRET, clés Stripe, identifiants SMTP, configuration S3) sont injectées côté conteneur. Les volumes assurent la persistance (ex: uploads) et les dépendances (PostgreSQL, Redis) tournent en services dédiés. Pour des raisons d’observabilité, l’application expose /api/metrics; les exporteurs système (Node Exporter) et base (Postgres Exporter) complètent la vue d’ensemble.',
    'Distinctions entre environnements: en local, priorité à la rapidité (hot reload, data de test, services dockérisés). En staging, on se rapproche de la prod (env vars réalistes, builds optimisés) pour vérifier les parcours complets. En prod, le focus est la sécurité, l’isolation et l’élasticité: secrets gérés par l’environnement, reverse proxy durci, monitoring actif et procédure de rollback disponible. Les écarts de configuration sont explicités dans la section Build & Déploiement et illustrés en Annexe D.'
  ].join('\n\n')

  const dependenciesNarrative = [
    'La gestion des dépendances se fait via npm (lockfile), avec un soin particulier apporté aux bibliothèques critiques: next, react, prisma, next-auth, stripe, @aws-sdk. Les mises à jour suivent le SemVer. Une politique pragmatique est recommandée: sécurités et correctifs en priorité (patch), nouvelles fonctionnalités par opportunité (minor), et upgrades majeurs (major) soigneusement planifiés (tests E2E, canary, rollback).',
    'Pour éviter la stagnation, exécuter régulièrement un "npm outdated" et qualifier l’impact sur l’application (breaking changes connus, notes de versions). Les dépendances transverses (UI, charting, états) doivent être stabilisées avant d’introduire d’autres briques. En particulier, Stripe, Prisma et NextAuth doivent rester proches de versions supportées, car elles structurent les flux de paiement, de données et d’accès.',
    'Les dépendances de développement (ESLint, TypeScript, Jest/Playwright) garantissent qualité et cohérence. Un budget de maintenance régulier est nécessaire pour maintenir l’outillage (linters, types) et conserver un feedback rapide pendant le cycle de dev. Les sections Maintenance/Évolution et l’Annexe E proposent des checklists concrètes.'
  ].join('\n\n')

  const monitoringNarrative = [
    'L’observabilité repose sur trois piliers: métriques, logs et (optionnellement) traces. Les métriques sont exposées en texte (Prometheus exposition format) par /api/metrics: compteurs métiers (utilisateurs, posts, réservations, paiements), indicateurs de performance (temps de réponse), et santé (mémoire, uptime, connectivité DB/Redis). Ces métriques alimentent Prometheus qui conserve des séries temporelles interrogeables par Grafana.',
    'Côté logs, on recommande PM2 pour capturer les journaux de l’application en production, et la journalisation Nginx côté reverse proxy. Pour isoler et résoudre des incidents, le couplage des métriques (alerte) et des logs (contexte) est déterminant. La mise en place de panels Grafana (disponibles dans "monitoring/grafana") aide à visualiser disponibilité, charge, latence et erreurs, et à repérer les régressions.',
    'Pour l’alerte, privilégier des seuils simples au début (availability, taux d’erreur, latence P95/P99) puis affiner par composant (DB, WebSocket, Webhooks Stripe). L’objectif est d’obtenir des alertes utiles (actionnables) sans bruit. Les représentations Mermaid de cette section illustrent le flux logique (détection → notification → intervention). Les détails de configuration sont fournis en Annexe D.'
  ].join('\n\n')

  const anomaliesNarrative = [
    'La gestion d’incident suit un cycle standard: détection → triage → diagnostic → remédiation → post-mortem. Le triage distingue rapidement l’impact (client vs interne), l’urgence (SLA, production vs staging) et le périmètre (paiements, auth, messagerie, rendez-vous, uploads). Chaque incident documenté doit aboutir à des mesures concrètes: correctif, test d’intégration, ou amélioration d’observabilité.',
    'Un exemple typique: échec du webhook Stripe. Symptômes: paiements en "pending" malgré un succès côté Stripe. Diagnostic: signature manquante, latence réseau ou parsing JSON. Remédiation: vérifier la variable STRIPE_WEBHOOK_SECRET, logs de /api/stripe/webhook, activer une alerte spécifique, et ajouter un test de non-régression (simulant l’événement). Post-mortem: checklist de déploiement, alerte dédiée, documentation opérateur.',
    'Pour les incidents de performance, s’appuyer sur les métriques P95/P99, la saturation DB (connections) et le monitoring des erreurs 5xx. Les arbres de décision fournis aident à garder un raisonnement simple: est-ce une panne externe (Stripe, S3), une contrainte interne (DB/Redis), ou une régression applicative? Voir Annexe E pour des procédures et scripts de vérification.'
  ].join('\n\n')

  const maintenanceNarrative = [
    'La maintenance régulière comprend: mises à jour de sécurité, rotation des secrets, nettoyage des logs, vérification des sauvegardes, réindexation ou migrations DB planifiées, et calibration des limites (rate limit, tailles d’upload). Côté front, il s’agit de maintenir la cohérence UI et d’éviter l’entropie (tokens de design, composants partagés).',
    'La montée en charge s’envisage horizontalement (plusieurs instances derrière Nginx); les états brefs (sessions, queues légères) sont externalisés (Redis), et les uploads vont sur S3. La base de données demeure le point de vérité, et les migrations doivent être atomiques et réversibles. L’Annexe D récapitule les artefacts de déploiement; l’Annexe E liste les checklists; l’Annexe F précise les captures d’écran à produire pour un runbook visuel.',
    'Évolutions futures: rationaliser le temps réel (pattern pub/sub), enrichir la télémétrie (business KPIs), formaliser un SLA par surface (auth, paiement, messagerie), et automatiser plus loin le CI/CD (tests de charge, smoke tests post-déploiement). La roadmap Mermaid illustre un séquencement réaliste et progressif.'
  ].join('\n\n')

  const ticketingNarrative = [
    'La gestion des demandes client et des tickets d’incident passe par un tableau Kanban (Jira, GitHub Issues). Chaque ticket doit inclure: contexte, pas de reproduction, impact utilisateur, hypothèse, plan de test, critères d’acceptation. Le flux standard: création → tri → affectation → développement → QA → validation → mise en production → suivi post-release.',
    'Côté communication, un accusé réception rapide clarifie la priorité et l’ETA; une mise à jour régulière réduit l’incertitude pour le client. Les tickets techniques (dette, migrations, refactoring) sont planifiés pour éviter l’effet tunnel. L’Annexe F propose une liste de captures d’écran pour documenter les parcours clés; l’Annexe G fournit un glossaire afin d’aligner les termes.'
  ].join('\n\n')

  const conclusionNarrative = [
    'Inkspot combine une base technique moderne (Next.js, Prisma, PostgreSQL) et des intégrations critiques (Stripe, S3), le tout encadré par une sécurité d’API et une observabilité de terrain (Prometheus/Grafana). Pour opérer au quotidien et faire évoluer la plateforme sereinement, deux principes guident la suite: visibilité (mesurer pour comprendre) et simplicité (privilégier des mécanismes clairs et auditables).',
    'Les annexes rassemblent les détails opérationnels et techniques. Dans le corps du manuel, nous privilégions une narration orientée usage et exploitation: démarrer vite, diagnostiquer aisément, déployer avec confiance. Les sections peuvent être lues indépendamment; le sommaire vous permettra d’aller directement au sujet utile.'
  ].join('\n\n')

  const commandsCheatsheet = [
    'Commandes utiles (Windows, macOS, Linux) — Administration, déploiement et diagnostic:',
    '',
    '1) Environnements & variables:',
    '  Windows PowerShell:',
    '    $env:NEXTAUTH_URL',
    '    [System.Environment]::GetEnvironmentVariable("NEXTAUTH_URL","Machine")',
    '    Get-ChildItem Env: | Sort-Object Name',
    '    Get-Content .env.local',
    '    setx NEXTAUTH_SECRET "<valeur>"   # Persiste pour nouvelles sessions',
    '  macOS/Linux (bash/zsh):',
    '    printenv NEXTAUTH_URL',
    '    env | sort',
    '    grep -v "^#" .env.local | xargs -L1 echo',
    '    export NEXTAUTH_SECRET=$(openssl rand -hex 32)',
    '  Node (server-side):',
    '    node -e "console.log(process.env.NEXTAUTH_URL)"',
    '  Next.js (client):',
    '    NEXT_PUBLIC_* seulement est accessible côté client (ne jamais exposer de secret).',
    '',
    '2) Générer des secrets:',
    '  macOS/Linux:',
    '    openssl rand -hex 32',
    '    uuidgen',
    '    python3 -c "import secrets; print(secrets.token_urlsafe(32))"',
    '  Windows PowerShell:',
    '    [guid]::NewGuid()',
    '    [Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Max 256}))',
    '',
    '3) Git & réseau:',
    '  git status && git log --oneline -n 10',
    '  Windows:  netstat -ano | findstr :3000',
    '  macOS:    lsof -i :3000',
    '  Linux:    ss -ltnp | grep 3000',
    '',
    '4) Node/Next.js:',
    '  npm run dev',
    '  npm run build && npm start',
    '  npm run type-check && npm run lint',
    '',
    '5) Prisma & PostgreSQL:',
    '  npx prisma db push',
    '  npx prisma db seed',
    '  npx prisma studio',
    '  psql "postgresql://user:pass@localhost:5432/inkspot" -c "\\dt"',
    '  pg_dump -h localhost -U user -d inkspot > backup.sql',
    '  psql -h localhost -U user -d inkspot < backup.sql',
    '',
    '6) Redis:',
    '  redis-cli -a <password> ping',
    '  redis-cli -a <password> info',
    '  redis-cli -a <password> keys "inkspot:*" | head',
    '',
    '7) Docker Compose (dev/prod):',
    '  docker compose -f docker-compose-dev.yml up -d',
    '  docker compose -f docker-compose-dev.yml ps',
    '  docker compose -f docker-compose-dev.yml logs -f postgres',
    '  docker compose -f docker-compose.prod.yml up -d',
    '  docker compose -f docker-compose.prod.yml exec app sh',
    '  docker compose -f docker-compose.prod.yml restart nginx',
    '',
    '8) Nginx (sur serveur):',
    '  nginx -T   # afficher la config effective',
    '  nginx -s reload',
    '  tail -f /var/log/nginx/error.log',
    '',
    '9) Stripe CLI (tests):',
    '  stripe login',
    '  stripe listen --forward-to localhost:3000/api/stripe/webhook',
    '  stripe trigger payment_intent.succeeded',
    '',
    '10) Health & Monitoring:',
    '  curl -i http://localhost:3000/api/health',
    '  curl -s http://localhost:3000/api/metrics | head -n 50',
    '  open http://localhost:9090   # Prometheus (macOS) | xdg-open (Linux)',
    '  open http://localhost:3001   # Grafana (macOS) | xdg-open (Linux)'
  ].join('\n')

  // Compose a much more verbose Build & Deployment guide with concrete steps by OS and environment
  const detailedBuild = [
    'Ce chapitre fournit une procédure pas-à-pas claire, avec explications simples, pour lancer Inkspot en local, puis le déployer en production. Les commandes sont données pour Windows (PowerShell), macOS et Linux. Pour les commandes Git, utilisez de préférence Git Bash [[Préférence utilisateur]].',
    '',
    '1) Pré-requis',
    '',
    '- Windows 10/11: installez Node.js 18+ (node -v), Docker Desktop, et (optionnel) WSL2 pour de meilleures performances Docker.',
    '- macOS: installez Homebrew, puis: brew install node; installez Docker Desktop for Mac.',
    '- Linux (Debian/Ubuntu): sudo apt-get update && sudo apt-get install -y curl build-essential; installez Node 18 LTS via nvm; installez Docker Engine + docker compose.',
    '',
    '2) Cloner le projet et installer les dépendances',
    '',
    'Windows PowerShell:',
    '  git clone <repo> && cd INKSPOT-5z',
    '  npm install',
    '',
    'macOS/Linux:',
    '  git clone <repo> && cd INKSPOT-5z',
    '  npm install',
    '',
    '3) Configurer les variables d’environnement (.env.local en développement)',
    '',
    'Créez un fichier .env.local à la racine et renseignez au minimum:',
    '  DATABASE_URL=postgresql://postgres:password@localhost:5432/inkspot',
    '  NEXTAUTH_SECRET=une_chaîne_aléatoire_longue',
    '  NEXTAUTH_URL=http://localhost:3000',
    '  NEXT_PUBLIC_APP_URL=http://localhost:3000',
    '  GOOGLE_CLIENT_ID=...',
    '  GOOGLE_CLIENT_SECRET=...',
    '  STRIPE_SECRET_KEY=sk_live_ou_test',
    '  STRIPE_PUBLISHABLE_KEY=pk_live_ou_test',
    '  STRIPE_WEBHOOK_SECRET=whsec_...',
    '  AWS_ACCESS_KEY_ID=...',
    '  AWS_SECRET_ACCESS_KEY=...',
    '  AWS_REGION=eu-west-1',
    '  AWS_S3_BUCKET=inkspot-assets',
    '  SMTP_HOST=smtp.votre_domaine',
    '  SMTP_PORT=587',
    '  SMTP_USER=...',
    '  SMTP_PASS=...',
    '  REDIS_URL=redis://localhost:6379',
    '',
    '4) Services locaux (PostgreSQL, Redis, Prometheus, Grafana) via Docker (optionnel mais recommandé)',
    '',
    'Le fichier docker-compose-dev.yml lance:',
    '  - Postgres (port 5432)',
    '  - Redis (port 6379)',
    '  - MailHog (port 8025) pour tester l’email',
    '  - Prometheus (port 9090) et Grafana (port 3001) pour le monitoring',
    '',
    'Commande unique:',
    '  docker compose -f docker-compose-dev.yml up -d',
    '',
    '5) Préparer la base de données avec Prisma',
    '',
    '  npx prisma db push   # crée les tables à partir de prisma/schema.prisma',
    '  npx prisma db seed   # remplit des données de démo si disponible',
    '',
    '6) Lancer l’application en développement',
    '',
    '  npm run dev',
    '  Ouvrez http://localhost:3000',
    '',
    'Vérifications utiles:',
    '  - http://localhost:3000/api/health doit répondre OK',
    '  - http://localhost:3000/api/metrics expose des métriques Prometheus (utilisées par Grafana)',
    '  - http://localhost:9090 (Prometheus) et http://localhost:3001 (Grafana) si lancés via compose',
    '',
    '7) Build de production local (sans Docker)',
    '',
    '  npm run build',
    '  npm start',
    '  # Le serveur écoute sur le port 3000 par défaut',
    '',
    '8) Déploiement production avec Docker Compose',
    '',
    'Le fichier docker-compose.prod.yml définit les services:',
    '  - app (Next.js) et websocket (port 3001) avec healthchecks',
    '  - postgres, redis',
    '  - nginx (reverse proxy) avec TLS',
    '  - grafana, prometheus (profil monitoring)',
    '',
    'Étapes:',
    '  a. Créez un fichier .env (ou .env.prod) avec toutes les variables (voir section 3).',
    '  b. Fournissez des certificats TLS dans nginx/ssl (cert.pem, key.pem). Pour Let’s Encrypt, utilisez certbot sur le serveur.',
    '  c. Démarrez: docker compose -f docker-compose.prod.yml up -d',
    '  d. Vérifiez la santé: docker compose -f docker-compose.prod.yml ps',
    '  e. Consultez les logs: docker compose -f docker-compose.prod.yml logs -f app nginx',
    '',
    '9) Nginx – ce que fait la configuration',
    '',
    '  - Redirige HTTP vers HTTPS',
    '  - Proxy / vers app:3000',
    '  - Proxy /socket.io/ vers websocket:3001 (temps réel)',
    '  - Applique du rate limiting sur /api et /api/auth',
    '  - Expose en interne Grafana (3002) et Prometheus (9090)',
    '',
    '10) WebSocket – vérification',
    '',
    '  - Assurez-vous que le service websocket écoute sur 3001',
    '  - Sous Nginx, /socket.io/ doit établir une connexion WebSocket (Upgrade)',
    '',
    '11) Monitoring – vérification',
    '',
    '  - curl http://<votre-domaine>/api/metrics renvoie des métriques custom (ex: inkspot_user_total)',
    '  - Prometheus scrape /api/metrics (voir monitoring/prometheus/prometheus.yml)',
    '  - Grafana lit Prometheus et affiche les dashboards fournis',
    '',
    '12) Dépannage (les plus fréquents)',
    '',
    '  - Erreur DB: vérifiez DATABASE_URL, réseau Docker, et que prisma db push a bien tourné.',
    '  - Erreur Stripe: clés invalides ou webhook_secret manquant; reconfigurez et redémarrez.',
    '  - 502 via Nginx: vérifiez que le conteneur app est healthy et écoute 3000; examinez logs Nginx.',
    '  - WebSocket ne se connecte pas: port 3001 exposé? Bloc /socket.io/ présent et Upgrade activé?',
    '  - Images/Uploads: configurez AWS S3 (clé, secret, bucket) et vérifiez les permissions.',
  ].join('\n')

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 22,
          },
          paragraph: {
            spacing: { after: 120 },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'CodeBlock',
          name: 'CodeBlock',
          basedOn: 'Normal',
          run: { font: 'Courier New', size: 20 },
          paragraph: { spacing: { before: 80, after: 80 } },
        },
      ],
    },
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [new TextRun({ text: 'Inkspot – Manuel d’utilisation technique', bold: true })],
          }),
          new Paragraph({ children: [new TextRun({ text: 'Version: 1.0' })] }),
          new Paragraph({ children: [new TextRun({ text: 'Généré automatiquement à partir du code source.' })] }),
          new Paragraph({ children: [new PageBreak()] }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: 'Sommaire', bold: true })],
          }),
          new TableOfContents('Table des matières', {
            hyperlink: true,
            headingStyleRange: '1-5',
          }),
          new Paragraph({ children: [new PageBreak()] }),

          // 1. Introduction
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '1. Introduction', bold: true })] }),
          ...textParagraphs(
            'Présentation technique d’Inkspot.\n\n' + introNarrative
          ),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Architecture globale de l’application', bold: true })] }),
          ...textParagraphs('Voir Diagramme D1 — Architecture globale (Annexe H). 🦊 Ajoutez un signet Word nommé D1 sur le diagramme en Annexe H et créez un lien depuis cette section si souhaité.'),
          await imageParagraphOrLink('https://miro.medium.com/v2/resize:fit:1400/1*WcXghWz8nRwl0FdrVv5f9g.png', 520),
          screenPlaceholder('Dashboard principal de l’app en local (http://localhost:3000) — page d’accueil ou tableau de bord PRO'),
          new Paragraph({ children: [new PageBreak()] }),

          // 2. Stack Technique
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '2. Stack Technique', bold: true })] }),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Stack locale (frameworks, libs, environnement dev)', bold: true })] }),
          ...kvTableParagraphs('Frameworks principaux', {
            Next: pkg?.dependencies?.next || 'N/A',
            React: pkg?.dependencies?.react || 'N/A',
            TypeScript: pkg?.devDependencies?.typescript || 'N/A',
            Prisma: pkg?.devDependencies?.prisma || pkg?.dependencies?.['@prisma/client'] || 'N/A',
          }),
          ...kvTableParagraphs('Librairies clés', {
            'next-auth': pkg?.dependencies?.['next-auth'] || 'N/A',
            stripe: pkg?.dependencies?.stripe || 'N/A',
            '@stripe/stripe-js': pkg?.dependencies?.['@stripe/stripe-js'] || 'N/A',
            '@aws-sdk/client-s3': pkg?.dependencies?.['@aws-sdk/client-s3'] || 'N/A',
            'web-push': pkg?.dependencies?.['web-push'] || 'N/A',
            zustand: pkg?.dependencies?.zustand || 'N/A',
          }),
          ...textParagraphs(stackNarrative),
          ...codeBlock(
            'graph LR\n' +
            '  Dev[Dev Local] -- push --> Repo[Git]\n' +
            '  Repo -- CI --> Build[CI Build + Tests]\n' +
            '  Build -- deploy --> Prod[Production]\n' +
            '  Prod -->|/api/metrics| Prometheus --> Grafana'
          ),
          ...codeBlock(
            'flowchart TD\n' +
            '  Commit --> CI[CI/CD Pipeline]\n' +
            '  CI --> Test[Unit/E2E]\n' +
            '  Test --> Build[Next build]\n' +
            '  Build --> Deploy[Deploy Docker/Vercel]\n' +
            '  Deploy --> Notify[Notifications]'
          ),
          ...codeBlock(
            'graph TD\n' +
            '  User --> LB[Reverse Proxy/Nginx]\n' +
            '  LB --> Next[Next.js Runtime]\n' +
            '  Next --> DB[(PostgreSQL)]\n' +
            '  Next --> S3[AWS S3]\n' +
            '  Next --> Stripe[Stripe]\n' +
            '  Next --> Metrics[/api/metrics/]'
          ),
          ...textParagraphs('🦊 Insérez en Annexe F une capture du pipeline CI/CD (ex: GitHub Actions/Vercel) et une capture de la base de données (Prisma Studio/pgAdmin). Créez des signets F1 (pipeline) et F2 (DB) et ajoutez des liens depuis cette section si nécessaire.'),
          new Paragraph({ children: [new PageBreak()] }),

          // 3. Dépendances
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '3. Dépendances', bold: true })] }),
          ...textParagraphs(dependenciesNarrative),
          ...textParagraphs('🦊 Ne pas coller ici le package.json. À la place, ajoutez en Annexe C une capture d’écran des sections scripts et dépendances de votre package.json (signets C1 pour scripts, C2 pour deps).'),
          ...codeBlock(
            'graph TD\n' +
            '  Next --> React\n' +
            '  Next --> NextAuth\n' +
            '  API --> Prisma\n' +
            '  API --> Stripe\n' +
            '  Uploads --> AWS_S3'
          ),
          await imageParagraphOrLink('https://raw.githubusercontent.com/semver/semver.org/master/static/img/semver.png', 480),
          screenPlaceholder('Résultat de la commande: npm outdated'),
          screenPlaceholder('Extrait du package.json (dépendances et scripts)'),
          new Paragraph({ children: [new PageBreak()] }),

          // 4. Monitoring
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '4. Monitoring', bold: true })] }),
          ...textParagraphs(monitoringNarrative),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Workflow Monitoring', bold: true })] }),
          ...codeBlock(
            'sequenceDiagram\n' +
            '  participant App as Inkspot API\n' +
            '  participant Prom as Prometheus\n' +
            '  participant Graf as Grafana\n' +
            '  App->>Prom: Expose /api/metrics\n' +
            '  Prom->>Graf: Alimente panneaux\n' +
            '  Graf-->>Ops: Alertes visuelles/notifications'
          ),
          ...codeBlock(
            'graph TD\n' +
            '  Error[Erreur App] --> Collect[Logs/Metrics]\n' +
            '  Collect --> Detect[Détection seuils]\n' +
            '  Detect --> Notify[Notification Slack/Email]\n' +
            '  Notify --> Respond[Intervention]' 
          ),
          ...textParagraphs('🦊 En Annexe F, ajoutez deux captures: Grafana (signet F3) et logs temps réel (signet F4). Reliez ces captures à cette section si nécessaire.'),
          ...textParagraphs('🦊 Cette section renvoie vers l’Annexe D (D2). Placez un signet D2 au bloc Prometheus et créez un lien depuis ici si souhaité.'),
          new Paragraph({ children: [new PageBreak()] }),

          // 5. Traitement des anomalies
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '5. Traitement des anomalies', bold: true })] }),
          ...textParagraphs(anomaliesNarrative),
          ...codeBlock(
            'flowchart LR\n' +
            '  Detect --> Triage --> Fix --> PostMortem\n' +
            '  Triage -->|Impact élevé| Critical\n' +
            '  Triage -->|Impact faible| Minor'
          ),
          ...codeBlock(
            'graph TD\n' +
            '  Start --> IsCritical{Impact/SLA Critique ?}\n' +
            '  IsCritical -- Oui --> Escalate[Escalade N2/N3]\n' +
            '  IsCritical -- Non --> NormalFlow[Résolution standard]\n' +
            '  Escalate --> RCA[Analyse cause racine]\n' +
            '  NormalFlow --> RCA\n' +
            '  RCA --> Lessons[Améliorations]' 
          ),
          ...textParagraphs('🦊 En Annexe F, ajoutez une capture d’un ticket d’incident résolu (signet F5) avec statut, timeline et résumé de résolution.'),
          new Paragraph({ children: [new PageBreak()] }),

          // 6. Maintenance et évolution
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '6. Maintenance et évolution', bold: true })] }),
          ...textParagraphs(maintenanceNarrative),
          ...codeBlock(
            'gantt\n' +
            '  title Plan de maintenance et releases\n' +
            '  dateFormat  YYYY-MM-DD\n' +
            '  section Maintenance\n' +
            '  Mises à jour deps     :active,  des1, 2025-01-01, 7d\n' +
            '  Migration DB          :         des2, 2025-01-10, 5d\n' +
            '  section Releases\n' +
            '  v1.1                  :         rel1, 2025-01-20, 3d\n' +
            '  v1.2                  :         rel2, 2025-02-05, 3d'
          ),
          ...codeBlock(
            'graph TD\n' +
            '  Roadmap[Roadmap technique]\n' +
            '  Roadmap --> Perf[Optimisations perfs]\n' +
            '  Roadmap --> Obs[Observabilité avancée]\n' +
            '  Roadmap --> Features[Nouvelles fonctionnalités]'
          ),
          ...textParagraphs('🦊 En Annexe F, insérez: un planning de maintenance (Trello/Jira) — signet F6, et un plan de migration DB (schéma, étapes) — signet F7.'),
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: 'Build & Déploiement — Guide pas-à-pas (détaillé)', bold: true })] }),
          ...textParagraphs(detailedBuild),
          new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: 'Extraits utiles', bold: true })] }),
          ...textParagraphs('Annexe D (signets D1 à D4):\n - D1: Diagramme architecture globale (Mermaid)\n - D2: Prometheus scrape\n - D3: Nginx (proxy, WebSocket)\n - D4: Docker Compose prod (services applicatifs)'),
          new Paragraph({ children: [new PageBreak()] }),

          // 7. Ticketing et report client
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '7. Ticketing et report client', bold: true })] }),
          ...textParagraphs(ticketingNarrative),
          ...codeBlock(
            'flowchart LR\n' +
            '  Client --> Support --> Ticket[Ticketing]\n' +
            '  Ticket --> Dev[Dev] --> QA[QA] --> Done[Validé]' 
          ),
          ...codeBlock(
            'sequenceDiagram\n' +
            '  participant U as Client\n' +
            '  participant S as Support\n' +
            '  participant D as Dev\n' +
            '  U->>S: Ouvre un ticket\n' +
            '  S->>D: Tri et attribution\n' +
            '  D-->>U: Fix livré & feedback'
          ),
          await imageParagraphOrLink('https://www.atlassian.com/dam/jcr:7ac79c1f-ea54-4c8e-860d-b6c3c48fc4e8/Service-Level-Agreements-SLAs-hero.svg', 520),
          screenPlaceholder('Tableau Kanban des tickets'),
          screenPlaceholder('Ticket priorisé avec checklist'),
          new Paragraph({ children: [new PageBreak()] }),

          // 8. Conclusion
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '8. Conclusion', bold: true })] }),
          ...textParagraphs(conclusionNarrative),
          ...codeBlock(
            'graph TD\n' +
            '  Stack[Stack] --> Monitoring[Monitoring]\n' +
            '  Monitoring --> Client[Qualité de service]\n' +
            '  Client --> Feedback[Feedback Produit]\n' +
            '  Feedback --> Stack'
          ),
          screenPlaceholder('Roadmap produit globale (vue marketing/produit)'),

          // Cheatsheet & Annexes pour référencer les détails sans alourdir le corps du texte
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Cheatsheet — Commandes utiles', bold: true })] }),
          ...textParagraphs(commandsCheatsheet),
          new Paragraph({ children: [new PageBreak()] }),
          // Annexes enrichissantes
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Annexe A — API Routes (inventaire)', bold: true })] }),
          ...textParagraphs(apiRoutes.map(r => `- ${r}`).join('\n')),
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Annexe B — Modèles Prisma', bold: true })] }),
          ...textParagraphs(prismaModels.map(m => `- ${m}`).join('\n')),
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Annexe C — Documentation existante (extraits)', bold: true })] }),
          ...textParagraphs(readme || ''),
          ...textParagraphs(appointmentDoc || ''),
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Annexe D — Extraits de configuration (Prometheus, Nginx, Docker Compose)', bold: true })] }),
          ...textParagraphs('Prometheus scrape (monitoring/prometheus/prometheus.yml):'),
          ...monoBlock(prometheusYml),
          ...textParagraphs('Nginx (nginx/nginx.conf) – sections clés proxy et WebSocket:'),
          ...monoBlock(readTextSafe(path.join(root, 'nginx', 'nginx.conf')).split('\n').slice(80, 170).join('\n')),
          ...textParagraphs('Docker Compose (docker-compose.prod.yml) – services applicatifs:'),
          ...monoBlock(readTextSafe(path.join(root, 'docker-compose.prod.yml')).split('\n').slice(44, 200).join('\n')),
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Annexe E — Procédures & Checklists opérateur', bold: true })] }),
          ...textParagraphs([
            'Checklist pré-déploiement: variables d’environnement présentes, secrets valides, DB migrée, Stripe webhook configuré, Nginx rechargé sans erreur, monitoring OK.',
            'Runbook incident (paiements): vérifier Stripe status, logs webhook, retenter idempotent, notifier si SLA menacé.',
            'Runbook incident (DB): vérifier connexions actives, lenteurs, index manquant; escalader si contention.',
            'Rollback: image précédente + migrations réversibles + smoke tests.',
          ].join('\n\n')),
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Annexe F — Screens à capturer (guide)', bold: true })] }),
          ...textParagraphs([
            'Accueil local (http://localhost:3000), Prisma Studio (tables clés), Stripe Dashboard (webhooks), Grafana: panels principaux, Prometheus: targets, Nginx: test SSL (qualys), Postman: collections d’API, Pages clés: login, profil, création de post, messagerie.',
          ].join('\n')),
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Annexe G — Glossaire', bold: true })] }),
          ...textParagraphs([
            'SLA: Accord de niveau de service — objectif de disponibilité/latence.',
            'SLO: Objectif de niveau de service — mesure chiffrée par métriques.',
            'Idempotence: même requête répétée donne le même résultat (pas de double paiement).',
            'P95/P99: percentiles de latence; 95%/99% des requêtes sous ce seuil.',
          ].join('\n')),
        ],
      },
    ],
  })

  const outPath = path.join(docsDir, 'Inkspot_Technical_Manual.docx')
  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(outPath, buffer)
  console.log('Manual generated at', outPath)
}

build().catch((err) => {
  console.error('Failed to generate manual:', err)
  process.exit(1)
})


