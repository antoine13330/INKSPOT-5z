#!/usr/bin/env node

/**
 * Script de configuration Railway pour un projet existant
 * Cible le projet 'humorous-healing' et configure les variables d'environnement
 *
 * Usage :
 *   node scripts/railway-configure.js --token TON_TOKEN
 *   node scripts/railway-configure.js --token TON_TOKEN --project humorous-healing
 */

const https = require('https')
const readline = require('readline')
const crypto = require('crypto')

const RAILWAY_API = 'backboard.railway.app'
const RAILWAY_API_PATH = '/graphql/v2'
const DEFAULT_PROJECT_NAME = 'humorous-healing'

// ─── Utilitaires ────────────────────────────────────────────────────────────

function log(msg)      { process.stdout.write(`\n${msg}\n`) }
function logStep(n, m) { process.stdout.write(`\n[${n}] ${m}\n`) }
function logOk(m)      { process.stdout.write(`    ✓ ${m}\n`) }
function logWarn(m)    { process.stdout.write(`    ⚠ ${m}\n`) }
function logErr(m)     { process.stderr.write(`    ✗ ${m}\n`) }
function sleep(ms)     { return new Promise(r => setTimeout(r, ms)) }

function generateSecret(bytes = 32) { return crypto.randomBytes(bytes).toString('base64') }
function generateHex(bytes = 32)    { return crypto.randomBytes(bytes).toString('hex') }

// ─── API GraphQL Railway ─────────────────────────────────────────────────────

function railwayQuery(token, query, variables = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables })
    const req = https.request({
      hostname: RAILWAY_API,
      path: RAILWAY_API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.errors) reject(new Error(parsed.errors.map(e => e.message).join(', ')))
          else resolve(parsed.data)
        } catch (e) {
          reject(new Error(`Parse error: ${data.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Prompt interactif ───────────────────────────────────────────────────────

function createPrompt() {
  return readline.createInterface({ input: process.stdin, output: process.stdout })
}

function ask(rl, question) {
  return new Promise(r => rl.question(question, a => r(a.trim())))
}

async function askRequired(rl, label, envKey, autoGenFn = null) {
  const existing = process.env[envKey]
  if (existing) { logOk(`${envKey} trouvé dans l'environnement`); return existing }

  if (autoGenFn) {
    const answer = await ask(rl, `  ${label} [Entrée pour générer automatiquement] : `)
    if (!answer) { const v = autoGenFn(); logOk(`${envKey} généré`); return v }
    return answer
  }

  let value = ''
  while (!value) {
    value = await ask(rl, `  ${label} (obligatoire) : `)
    if (!value) process.stdout.write('    Cette valeur est obligatoire.\n')
  }
  return value
}

async function askOptional(rl, label, envKey) {
  const existing = process.env[envKey]
  if (existing) return existing
  const answer = await ask(rl, `  ${label} [Entrée pour ignorer] : `)
  return answer || null
}

// ─── Étapes Railway ──────────────────────────────────────────────────────────

async function validateToken(token) {
  const data = await railwayQuery(token, `
    query {
      me { id name email workspaces { id name } }
    }
  `)
  return data.me
}

async function findProject(token, workspaceId, projectName) {
  const data = await railwayQuery(token, `
    query GetProjects($workspaceId: String!) {
      projects(workspaceId: $workspaceId, first: 100) {
        edges {
          node {
            id
            name
            environments {
              edges { node { id name } }
            }
            services {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  `, { workspaceId })

  const edge = data.projects?.edges?.find(e =>
    e.node.name.toLowerCase() === projectName.toLowerCase()
  )
  return edge?.node || null
}

async function getExistingVariables(token, projectId, environmentId, serviceId) {
  const data = await railwayQuery(token, `
    query GetVariables($projectId: String!, $environmentId: String!, $serviceId: String!) {
      variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
    }
  `, { projectId, environmentId, serviceId })
  return data.variables || {}
}

async function upsertVariable(token, projectId, environmentId, serviceId, name, value) {
  await railwayQuery(token, `
    mutation UpsertVariable($input: VariableUpsertInput!) {
      variableUpsert(input: $input)
    }
  `, { input: { projectId, environmentId, serviceId, name, value } })
}

async function upsertVariables(token, projectId, environmentId, serviceId, vars) {
  const entries = Object.entries(vars).filter(([, v]) => v !== null && v !== undefined && v !== '')
  for (const [name, value] of entries) {
    await upsertVariable(token, projectId, environmentId, serviceId, name, String(value))
    logOk(`Variable configurée : ${name}`)
  }
}

async function getOrGenerateDomain(token, serviceId, environmentId) {
  // Récupérer les domaines existants
  try {
    const data = await railwayQuery(token, `
      query GetDomains($serviceId: String!, $environmentId: String!) {
        domains(serviceId: $serviceId, environmentId: $environmentId) {
          serviceDomains { domain }
          customDomains { domain }
        }
      }
    `, { serviceId, environmentId })

    const domains = [
      ...(data.domains?.serviceDomains || []),
      ...(data.domains?.customDomains || []),
    ]
    if (domains.length > 0) {
      logOk(`Domaine existant : ${domains[0].domain}`)
      return domains[0].domain
    }
  } catch (e) {
    logWarn(`Impossible de récupérer les domaines : ${e.message}`)
  }

  // Générer un nouveau domaine
  try {
    const data = await railwayQuery(token, `
      mutation GenerateDomain($serviceId: String!, $environmentId: String!) {
        serviceDomainCreate(serviceId: $serviceId, environmentId: $environmentId) {
          domain
        }
      }
    `, { serviceId, environmentId })
    const domain = data.serviceDomainCreate?.domain
    if (domain) { logOk(`Domaine généré : ${domain}`); return domain }
  } catch (e) {
    logWarn(`Impossible de générer un domaine : ${e.message}`)
  }

  return null
}

// ─── Programme principal ─────────────────────────────────────────────────────

async function main() {
  log('================================================')
  log('  INKSPOT — Railway Configure (projet existant)')
  log('================================================')

  const args = process.argv.slice(2)
  const tokenIdx = args.indexOf('--token')
  const projectIdx = args.indexOf('--project')
  const token = tokenIdx !== -1 ? args[tokenIdx + 1] : process.env.RAILWAY_TOKEN
  const projectName = projectIdx !== -1 ? args[projectIdx + 1] : DEFAULT_PROJECT_NAME

  if (!token) {
    logErr('Token Railway manquant.')
    logErr('Usage : node scripts/railway-configure.js --token TON_TOKEN')
    process.exit(1)
  }

  // 1. Valider le token
  logStep(1, 'Validation du token Railway...')
  let me
  try {
    me = await validateToken(token)
    logOk(`Connecté : ${me.name} (${me.email})`)
  } catch (err) {
    logErr(`Token invalide : ${err.message}`)
    process.exit(1)
  }

  // 2. Sélectionner le workspace
  const workspaces = me.workspaces || []
  let workspaceId
  if (workspaces.length === 0) { logErr('Aucun workspace.'); process.exit(1) }
  if (workspaces.length === 1) {
    workspaceId = workspaces[0].id
    logOk(`Workspace : ${workspaces[0].name}`)
  } else {
    log('  Workspaces disponibles :')
    workspaces.forEach((w, i) => log(`    [${i}] ${w.name}`))
    const rlTmp = createPrompt()
    const idx = await ask(rlTmp, '  Numéro du workspace : ')
    rlTmp.close()
    const chosen = workspaces[parseInt(idx, 10)]
    if (!chosen) { logErr('Choix invalide.'); process.exit(1) }
    workspaceId = chosen.id
    logOk(`Workspace : ${chosen.name}`)
  }

  // 3. Trouver le projet
  logStep(2, `Recherche du projet "${projectName}"...`)
  const project = await findProject(token, workspaceId, projectName)
  if (!project) {
    logErr(`Projet "${projectName}" introuvable.`)
    logErr('Vérifiez le nom ou utilisez --project AUTRE_NOM')
    process.exit(1)
  }
  logOk(`Projet trouvé : ${project.id}`)

  const projectId = project.id

  // 4. Sélectionner l'environnement
  const envEdges = project.environments?.edges || []
  if (envEdges.length === 0) { logErr('Aucun environnement.'); process.exit(1) }
  const prodEnv = envEdges.find(e => e.node.name === 'production') || envEdges[0]
  const environmentId = prodEnv.node.id
  logOk(`Environnement : ${prodEnv.node.name} (${environmentId})`)

  // 5. Identifier le service app
  logStep(3, 'Identification des services...')
  const services = project.services?.edges || []
  if (services.length === 0) { logErr('Aucun service trouvé dans ce projet.'); process.exit(1) }

  log('  Services disponibles :')
  services.forEach((s, i) => log(`    [${i}] ${s.node.name} (${s.node.id})`))

  let appServiceId
  const rl = createPrompt()

  if (services.length === 1) {
    appServiceId = services[0].node.id
    logOk(`Service sélectionné : ${services[0].node.name}`)
  } else {
    // Chercher un service qui ressemble à l'app (pas postgres/redis)
    const appService = services.find(s => {
      const name = s.node.name.toLowerCase()
      return !name.includes('postgres') && !name.includes('redis') &&
             !name.includes('grafana') && !name.includes('prometheus') &&
             !name.includes('loki') && !name.includes('tempo')
    })
    if (appService) {
      const confirm = await ask(rl, `  Service app détecté : "${appService.node.name}". Confirmer ? [O/n] : `)
      if (!confirm || confirm.toLowerCase() === 'o' || confirm.toLowerCase() === 'y') {
        appServiceId = appService.node.id
        logOk(`Service : ${appService.node.name}`)
      }
    }
    if (!appServiceId) {
      const idx = await ask(rl, '  Entrez le numéro du service app : ')
      const chosen = services[parseInt(idx, 10)]
      if (!chosen) { logErr('Choix invalide.'); rl.close(); process.exit(1) }
      appServiceId = chosen.node.id
      logOk(`Service : ${chosen.node.name}`)
    }
  }

  // 6. Récupérer les variables existantes
  logStep(4, 'Récupération des variables existantes...')
  let existingVars = {}
  try {
    existingVars = await getExistingVariables(token, projectId, environmentId, appServiceId)
    const count = Object.keys(existingVars).length
    logOk(`${count} variable(s) déjà configurée(s)`)
    if (count > 0) {
      log('  Variables existantes : ' + Object.keys(existingVars).join(', '))
    }
  } catch (e) {
    logWarn(`Impossible de lire les variables : ${e.message}`)
  }

  // 7. Domaine
  logStep(5, 'Récupération/génération du domaine...')
  const domain = await getOrGenerateDomain(token, appServiceId, environmentId)
  const appUrl = domain ? `https://${domain}` : null
  if (appUrl) logOk(`URL app : ${appUrl}`)
  else logWarn('Domaine non disponible — NEXTAUTH_URL à configurer manuellement')

  // 8. Collecter les variables
  logStep(6, 'Configuration des variables d\'environnement...')
  log('  Les valeurs existantes seront écrasées.')
  log('  Appuyez sur Entrée pour générer automatiquement les secrets.')

  // DATABASE_URL et REDIS_URL depuis les variables existantes ou saisie
  let databaseUrl = existingVars['DATABASE_URL']
  let redisUrl = existingVars['REDIS_URL']

  if (databaseUrl) {
    logOk('DATABASE_URL déjà configurée')
  } else {
    databaseUrl = await ask(rl, '  DATABASE_URL (depuis Railway Postgres) : ')
    if (!databaseUrl) { logErr('DATABASE_URL obligatoire'); rl.close(); process.exit(1) }
  }

  if (redisUrl) {
    logOk('REDIS_URL déjà configurée')
  } else {
    redisUrl = await ask(rl, '  REDIS_URL (depuis Railway Redis) : ')
    if (!redisUrl) { logWarn('REDIS_URL non fournie — certaines features seront désactivées') }
  }

  log('\n  -- Authentification --')
  const nextauthSecret = await askRequired(rl, 'NEXTAUTH_SECRET', 'NEXTAUTH_SECRET', () => generateSecret(32))

  log('\n  -- Google OAuth (optionnel) --')
  const googleClientId     = await askOptional(rl, 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_ID')
  const googleClientSecret = await askOptional(rl, 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET')

  log('\n  -- Stripe --')
  const stripeSecretKey                  = await askOptional(rl, 'STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')
  const stripePublishableKey             = await askOptional(rl, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
  const stripeWebhookSecret              = await askOptional(rl, 'STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET')
  const stripeWebhookAppointmentsSecret  = await askOptional(rl, 'STRIPE_WEBHOOK_APPOINTMENTS_SECRET', 'STRIPE_WEBHOOK_APPOINTMENTS_SECRET')

  log('\n  -- AWS S3 (optionnel) --')
  const awsRegion         = await askOptional(rl, 'AWS_REGION', 'AWS_REGION')
  const awsAccessKeyId    = await askOptional(rl, 'AWS_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID')
  const awsSecretAccessKey = await askOptional(rl, 'AWS_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY')
  const awsS3Bucket       = await askOptional(rl, 'AWS_S3_BUCKET', 'AWS_S3_BUCKET')

  log('\n  -- Email SMTP (optionnel) --')
  const emailHost     = await askOptional(rl, 'EMAIL_SERVER_HOST', 'EMAIL_SERVER_HOST')
  const emailPort     = await askOptional(rl, 'EMAIL_SERVER_PORT', 'EMAIL_SERVER_PORT')
  const emailUser     = await askOptional(rl, 'EMAIL_SERVER_USER', 'EMAIL_SERVER_USER')
  const emailPassword = await askOptional(rl, 'EMAIL_SERVER_PASSWORD', 'EMAIL_SERVER_PASSWORD')
  const emailFrom     = await askOptional(rl, 'EMAIL_FROM', 'EMAIL_FROM')

  log('\n  -- Push Notifications VAPID (optionnel) --')
  const vapidPublicKey  = await askOptional(rl, 'VAPID_PUBLIC_KEY', 'VAPID_PUBLIC_KEY')
  const vapidPrivateKey = await askOptional(rl, 'VAPID_PRIVATE_KEY', 'VAPID_PRIVATE_KEY')

  log('\n  -- Sécurité --')
  const encryptionKey = await askRequired(rl, 'ENCRYPTION_KEY', 'ENCRYPTION_KEY', () => generateHex(32))

  // 9. Pousser les variables
  logStep(7, 'Envoi des variables vers Railway...')

  const allVars = {
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    HOSTNAME: '0.0.0.0',
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
    NEXTAUTH_URL: appUrl || existingVars['NEXTAUTH_URL'],
    NEXTAUTH_SECRET: nextauthSecret,
    NEXT_PUBLIC_APP_URL: appUrl || existingVars['NEXT_PUBLIC_APP_URL'],
    GOOGLE_CLIENT_ID: googleClientId,
    GOOGLE_CLIENT_SECRET: googleClientSecret,
    STRIPE_SECRET_KEY: stripeSecretKey,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stripePublishableKey,
    STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
    STRIPE_WEBHOOK_APPOINTMENTS_SECRET: stripeWebhookAppointmentsSecret,
    AWS_REGION: awsRegion,
    AWS_ACCESS_KEY_ID: awsAccessKeyId,
    AWS_SECRET_ACCESS_KEY: awsSecretAccessKey,
    AWS_S3_BUCKET: awsS3Bucket,
    EMAIL_SERVER_HOST: emailHost,
    EMAIL_SERVER_PORT: emailPort,
    EMAIL_SERVER_USER: emailUser,
    EMAIL_SERVER_PASSWORD: emailPassword,
    EMAIL_FROM: emailFrom,
    VAPID_PUBLIC_KEY: vapidPublicKey,
    VAPID_PRIVATE_KEY: vapidPrivateKey,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: vapidPublicKey,
    ENCRYPTION_KEY: encryptionKey,
  }

  try {
    await upsertVariables(token, projectId, environmentId, appServiceId, allVars)
    logOk('Toutes les variables configurées')
  } catch (err) {
    logErr(`Erreur variables : ${err.message}`)
    rl.close()
    process.exit(1)
  }

  rl.close()

  // 10. Résumé
  log('\n================================================')
  log('  CONFIGURATION TERMINÉE')
  log('================================================')
  if (appUrl) log(`  URL       : ${appUrl}`)
  log(`  Projet    : ${projectId}`)
  log(`  Service   : ${appServiceId}`)
  log(`  Env       : ${prodEnv.node.name}`)

  log('\n  ÉTAPES MANUELLES RESTANTES :')

  if (googleClientId) {
    log('\n  1. Google OAuth — Ajouter URI de redirection :')
    log(`     ${appUrl}/api/auth/callback/google`)
    log('     -> https://console.developers.google.com/')
  }

  if (stripeSecretKey) {
    log('\n  2. Stripe — Créer les webhooks :')
    log(`     Paiements    : ${appUrl}/api/stripe/webhook`)
    log(`     Rendez-vous  : ${appUrl}/api/webhooks/stripe-appointments`)
    log('     -> https://dashboard.stripe.com/webhooks')
  }

  if (awsS3Bucket) {
    log('\n  3. AWS S3 — Configurer CORS pour autoriser :')
    log(`     ${appUrl}`)
  }

  log('\n  4. Migrations Prisma — Depuis Railway CLI ou en activant dans railway.json :')
  log('     npx prisma migrate deploy')

  log('\n  5. Suivre le déploiement :')
  log('     -> https://railway.app/dashboard')

  log('\n================================================\n')
}

main().catch(err => {
  logErr(`Erreur fatale : ${err.message}`)
  process.exit(1)
})
