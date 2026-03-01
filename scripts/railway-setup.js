#!/usr/bin/env node

/**
 * Script de provisionnement Railway pour INKSPOT
 * Utilise les services gérés Railway (PostgreSQL, Redis plugins)
 *
 * Usage :
 *   node scripts/railway-setup.js --token TON_TOKEN
 *
 * Ou via variable d'environnement (fallback) :
 *   $env:RAILWAY_TOKEN="ton_token_ici"   (PowerShell)
 *   RAILWAY_TOKEN="ton_token_ici"        (bash/zsh)
 *   node scripts/railway-setup.js
 */

const https = require('https')
const readline = require('readline')
const crypto = require('crypto')

const RAILWAY_API = 'backboard.railway.app'
const RAILWAY_API_PATH = '/graphql/v2'
const GITHUB_REPO = 'antoine13330/INKSPOT-5z'
const PROJECT_NAME = 'inkspot-production'

// ─── Utilitaires ────────────────────────────────────────────────────────────

function log(msg) {
  process.stdout.write(`\n${msg}\n`)
}

function logStep(n, msg) {
  process.stdout.write(`\n[${n}] ${msg}\n`)
}

function logOk(msg) {
  process.stdout.write(`    ✓ ${msg}\n`)
}

function logErr(msg) {
  process.stderr.write(`    ✗ ${msg}\n`)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64')
}

function generateHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

// ─── API GraphQL Railway ─────────────────────────────────────────────────────

function railwayQuery(token, query, variables = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables })
    const options = {
      hostname: RAILWAY_API,
      path: RAILWAY_API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.errors) {
            reject(new Error(parsed.errors.map(e => e.message).join(', ')))
          } else {
            resolve(parsed.data)
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`))
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
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
}

function ask(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()))
  })
}

async function askRequired(rl, label, envKey, autoGenFn = null) {
  const existing = process.env[envKey]
  if (existing) {
    logOk(`${envKey} trouvé dans l'environnement`)
    return existing
  }

  if (autoGenFn) {
    const answer = await ask(rl, `  ${label} [Entrée pour générer] : `)
    if (!answer) {
      const generated = autoGenFn()
      logOk(`${envKey} généré automatiquement`)
      return generated
    }
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
      me {
        id
        name
        email
        workspaces {
          id
          name
        }
      }
    }
  `)
  return data.me
}

async function getOrCreateProject(token, workspaceId) {
  // Chercher si le projet existe déjà
  const projectsData = await railwayQuery(token, `
    query GetProjects($workspaceId: String!) {
      projects(workspaceId: $workspaceId, first: 100) {
        edges {
          node {
            id
            name
            environments {
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

  const existing = projectsData.projects?.edges?.find(e => e.node.name === PROJECT_NAME)
  if (existing) {
    logOk(`Projet existant trouvé : ${existing.node.id}`)
    logStep('delete', `Suppression du projet existant "${PROJECT_NAME}"...`)
    try {
      await railwayQuery(token, `
        mutation DeleteProject($projectId: String!) {
          projectDelete(id: $projectId)
        }
      `, { projectId: existing.node.id })
      logOk(`Projet supprimé`)
    } catch (err) {
      logErr(`Impossible de supprimer le projet : ${err.message}`)
      logErr('Continuons en créant un nouveau projet...')
    }
    // Attendre un peu avant de créer le nouveau projet
    await sleep(2000)
  }

  // Créer le nouveau projet
  const createData = await railwayQuery(token, `
    mutation CreateProject($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        id
        name
        environments {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  `, {
    input: {
      name: PROJECT_NAME,
      description: 'INKSPOT - Plateforme sociale pour tatoueurs et clients',
      workspaceId,
    }
  })
  logOk(`Nouveau projet créé : ${createData.projectCreate.id}`)
  return createData.projectCreate
}



async function createManagedPostgres(token, projectId, environmentId) {
  const data = await railwayQuery(token, `
    mutation CreatePlugin($input: PluginCreateInput!) {
      pluginCreate(input: $input) {
        id
        name
      }
    }
  `, {
    input: {
      projectId,
      environmentId,
      type: 'POSTGRESQL',
    }
  })
  logOk(`PostgreSQL (géré) créé : ${data.pluginCreate.id}`)
  return data.pluginCreate.id
}

async function createManagedRedis(token, projectId, environmentId) {
  const data = await railwayQuery(token, `
    mutation CreatePlugin($input: PluginCreateInput!) {
      pluginCreate(input: $input) {
        id
        name
      }
    }
  `, {
    input: {
      projectId,
      environmentId,
      type: 'REDIS',
    }
  })
  logOk(`Redis (géré) créé : ${data.pluginCreate.id}`)
  return data.pluginCreate.id
}

async function createAppService(token, projectId) {
  const data = await railwayQuery(token, `
    mutation CreateService($input: ServiceCreateInput!) {
      serviceCreate(input: $input) {
        id
        name
      }
    }
  `, {
    input: {
      projectId,
      name: 'inkspot-app',
      source: {
        repo: GITHUB_REPO,
      },
    }
  })
  logOk(`Service App créé : ${data.serviceCreate.id}`)
  return data.serviceCreate.id
}

async function getServiceVariables(token, projectId, environmentId, serviceId) {
  const data = await railwayQuery(token, `
    query GetVariables($projectId: String!, $environmentId: String!, $serviceId: String!) {
      variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
    }
  `, { projectId, environmentId, serviceId })
  return data.variables || {}
}

async function pollForVariables(token, projectId, environmentId, serviceId, varNames, maxAttempts = 40) {
  const found = {}
  const missing = new Set(varNames)

  for (let i = 0; i < maxAttempts; i++) {
    const vars = await getServiceVariables(token, projectId, environmentId, serviceId)
    
    for (const name of missing) {
      if (vars[name]) {
        found[name] = vars[name]
        missing.delete(name)
        logOk(`Variable trouvée : ${name}`)
      }
    }

    if (missing.size === 0) break

    process.stdout.write(`    Attente de ${Array.from(missing).join(', ')}... (${i + 1}/${maxAttempts})\r`)
    await sleep(3000)
  }

  if (missing.size > 0) {
    throw new Error(`Variables manquantes après ${maxAttempts} tentatives : ${Array.from(missing).join(', ')}`)
  }

  return found
}

async function upsertVariable(token, projectId, environmentId, serviceId, name, value) {
  await railwayQuery(token, `
    mutation UpsertVariable($input: VariableUpsertInput!) {
      variableUpsert(input: $input)
    }
  `, {
    input: {
      projectId,
      environmentId,
      serviceId,
      name,
      value,
    }
  })
}

async function upsertVariables(token, projectId, environmentId, serviceId, vars) {
  const entries = Object.entries(vars).filter(([, v]) => v !== null && v !== undefined && v !== '')
  for (const [name, value] of entries) {
    await upsertVariable(token, projectId, environmentId, serviceId, name, String(value))
    logOk(`Variable configurée : ${name}`)
  }
}

async function generateDomain(token, serviceId, environmentId) {
  const data = await railwayQuery(token, `
    mutation GenerateDomain($serviceId: String!, $environmentId: String!) {
      serviceInstanceDomainCreate(serviceId: $serviceId, environmentId: $environmentId) {
        domain
      }
    }
  `, { serviceId, environmentId })
  return data.serviceInstanceDomainCreate?.domain
}

async function triggerDeploy(token, serviceId, environmentId) {
  await railwayQuery(token, `
    mutation Deploy($serviceId: String!, $environmentId: String!) {
      serviceInstanceDeploy(serviceId: $serviceId, environmentId: $environmentId)
    }
  `, { serviceId, environmentId })
}

// ─── Programme principal ─────────────────────────────────────────────────────

async function main() {
  log('================================================')
  log('  INKSPOT — Railway Setup (Services Gérés)')
  log('================================================')

  // Récupérer le token
  const args = process.argv.slice(2)
  const tokenArgIndex = args.indexOf('--token')
  const tokenFromArg = tokenArgIndex !== -1 ? args[tokenArgIndex + 1] : null
  const token = tokenFromArg || process.env.RAILWAY_TOKEN

  if (!token) {
    logErr('Token Railway manquant.')
    logErr('Usage : node scripts/railway-setup.js --token TON_TOKEN')
    process.exit(1)
  }

  logStep(1, 'Validation du token Railway...')
  let me
  try {
    me = await validateToken(token)
    logOk(`Connecté en tant que : ${me.name} (${me.email})`)
  } catch (err) {
    logErr(`Token invalide : ${err.message}`)
    process.exit(1)
  }

  // Récupérer le workspaceId
  const workspaces = me.workspaces || []
  let workspaceId = null
  if (workspaces.length === 1) {
    workspaceId = workspaces[0].id
    logOk(`Workspace : ${workspaces[0].name}`)
  } else if (workspaces.length > 1) {
    log('  Plusieurs workspaces :')
    workspaces.forEach((w, i) => log(`    [${i}] ${w.name}`))
    const rlTmp = createPrompt()
    const idx = await ask(rlTmp, '  Entrez le numéro : ')
    rlTmp.close()
    const chosen = workspaces[parseInt(idx, 10)]
    if (!chosen) { logErr('Choix invalide.'); process.exit(1) }
    workspaceId = chosen.id
    logOk(`Workspace sélectionné : ${chosen.name}`)
  } else {
    logErr('Aucun workspace trouvé.')
    process.exit(1)
  }

  const rl = createPrompt()

  try {
    logStep(2, `Suppression/création du projet "${PROJECT_NAME}"...`)
    let project
    try {
      project = await getOrCreateProject(token, workspaceId)
    } catch (err) {
      logErr(`Erreur : ${err.message}`)
      process.exit(1)
    }

    const projectId = project.id
    const environmentEdge = project.environments?.edges?.find(e => e.node.name === 'production')
      || project.environments?.edges?.[0]
    if (!environmentEdge) {
      logErr('Aucun environnement trouvé.')
      process.exit(1)
    }
    const environmentId = environmentEdge.node.id
    logOk(`Environnement : ${environmentEdge.node.name}`)

    // Créer les services gérés
    logStep(3, 'Création de PostgreSQL (géré)...')
    logOk('Ignoré — à créer manuellement sur le dashboard Railway')

    logStep(4, 'Création de Redis (géré)...')
    logOk('Ignoré — à créer manuellement sur le dashboard Railway')

    logStep(5, `Création du service App depuis ${GITHUB_REPO}...`)
    let appServiceId
    try {
      appServiceId = await createAppService(token, projectId)
    } catch (err) {
      logErr(`Erreur App : ${err.message}`)
      process.exit(1)
    }

    logStep(6, 'Génération du domaine public...')
    let publicDomain
    try {
      publicDomain = await generateDomain(token, appServiceId, environmentId)
      logOk(`Domaine : https://${publicDomain}`)
    } catch (err) {
      logErr(`Erreur domaine : ${err.message}`)
      publicDomain = 'TON-SERVICE.up.railway.app'
    }

    const appUrl = `https://${publicDomain}`

    logStep(7, 'Récupération de DATABASE_URL et REDIS_URL...')
    let databaseUrl, redisUrl
    
    databaseUrl = await ask(rl, '  DATABASE_URL (depuis Railway Dashboard) : ')
    if (!databaseUrl) {
      logErr('DATABASE_URL obligatoire')
      process.exit(1)
    }

    redisUrl = await ask(rl, '  REDIS_URL (depuis Railway Dashboard) : ')
    if (!redisUrl) {
      logErr('REDIS_URL obligatoire')
      process.exit(1)
    }

    // Collecter les variables
    logStep(8, 'Configuration des variables d\'environnement...')
    log('  Répondez aux questions. Appuyez sur Entrée pour générer automatiquement.')

    log('\n  -- Authentification --')
    const nextauthSecret = await askRequired(rl, 'NEXTAUTH_SECRET', 'NEXTAUTH_SECRET', () => generateSecret(32))

    log('\n  -- Google OAuth --')
    const googleClientId = await askRequired(rl, 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_ID')
    const googleClientSecret = await askRequired(rl, 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET')

    log('\n  -- Stripe --')
    const stripeSecretKey = await askRequired(rl, 'STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY')
    const stripePublishableKey = await askRequired(rl, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
    const stripeWebhookSecret = await askRequired(rl, 'STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET')
    const stripeWebhookAppointmentsSecret = await askRequired(rl, 'STRIPE_WEBHOOK_APPOINTMENTS_SECRET', 'STRIPE_WEBHOOK_APPOINTMENTS_SECRET')

    log('\n  -- AWS S3 --')
    const awsRegion = await askRequired(rl, 'AWS_REGION', 'AWS_REGION')
    const awsAccessKeyId = await askRequired(rl, 'AWS_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID')
    const awsSecretAccessKey = await askRequired(rl, 'AWS_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY')
    const awsS3Bucket = await askRequired(rl, 'AWS_S3_BUCKET', 'AWS_S3_BUCKET')

    log('\n  -- Email SMTP --')
    const emailHost = await askRequired(rl, 'EMAIL_SERVER_HOST', 'EMAIL_SERVER_HOST')
    const emailPort = await askRequired(rl, 'EMAIL_SERVER_PORT', 'EMAIL_SERVER_PORT')
    const emailUser = await askRequired(rl, 'EMAIL_SERVER_USER', 'EMAIL_SERVER_USER')
    const emailPassword = await askRequired(rl, 'EMAIL_SERVER_PASSWORD', 'EMAIL_SERVER_PASSWORD')
    const emailFrom = await askRequired(rl, 'EMAIL_FROM', 'EMAIL_FROM')

    log('\n  -- Push Notifications VAPID --')
    const vapidPublicKey = await askRequired(rl, 'VAPID_PUBLIC_KEY', 'VAPID_PUBLIC_KEY')
    const vapidPrivateKey = await askRequired(rl, 'VAPID_PRIVATE_KEY', 'VAPID_PRIVATE_KEY')

    log('\n  -- Sécurité --')
    const encryptionKey = await askRequired(rl, 'ENCRYPTION_KEY', 'ENCRYPTION_KEY', () => generateHex(32))

    log('\n  -- Optionnels --')
    const supabaseUrl = await askOptional(rl, 'SUPABASE_URL', 'SUPABASE_URL')
    const supabaseAnonKey = await askOptional(rl, 'SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY')

    // Pousser les variables
    logStep(9, 'Envoi des variables d\'environnement vers Railway...')

    const allVars = {
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      PORT: '3000',
      HOSTNAME: '0.0.0.0',
      DATABASE_URL: databaseUrl,
      REDIS_URL: redisUrl,
      NEXTAUTH_URL: appUrl,
      NEXTAUTH_SECRET: nextauthSecret,
      NEXT_PUBLIC_APP_URL: appUrl,
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
      SUPABASE_URL: supabaseUrl,
      SUPABASE_ANON_KEY: supabaseAnonKey,
    }

    try {
      await upsertVariables(token, projectId, environmentId, appServiceId, allVars)
      logOk('Variables configurées')
    } catch (err) {
      logErr(`Erreur variables : ${err.message}`)
      process.exit(1)
    }

    logStep(9, 'Déclenchement du déploiement...')
    try {
      await triggerDeploy(token, appServiceId, environmentId)
      logOk('Déploiement déclenché')
    } catch (err) {
      logErr(`Erreur déploiement : ${err.message}`)
    }

    // Résumé
    log('\n================================================')
    log('  SETUP TERMINE')
    log('================================================')
    log(`  URL : ${appUrl}`)
    log(`  Projet : ${projectId}`)
    log(`  Service App : ${appServiceId}`)

    log('\n  ETAPES MANUELLES :')
    log('\n  1. Google OAuth — Ajouter URI de redirection :')
    log(`     ${appUrl}/api/auth/callback/google`)
    log('     -> https://console.developers.google.com/')

    log('\n  2. Stripe — Créer webhooks :')
    log(`     Paiements : ${appUrl}/api/stripe/webhook`)
    log(`     Rendez-vous : ${appUrl}/api/webhooks/stripe-appointments`)
    log('     -> https://dashboard.stripe.com/webhooks')

    log('\n  3. AWS S3 — Configurer CORS :')
    log(`     Autoriser : ${appUrl}`)

    log('\n  4. Suivre le déploiement :')
    log('     -> https://railway.app/dashboard')

    log('\n================================================\n')

  } finally {
    rl.close()
  }
}

main().catch(err => {
  logErr(`Erreur : ${err.message}`)
  process.exit(1)
})
