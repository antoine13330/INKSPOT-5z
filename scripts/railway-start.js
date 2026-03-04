#!/usr/bin/env node
/**
 * Script de démarrage Railway : sanitize DATABASE_URL, résout les migrations
 * échouées, applique les migrations, puis démarre le serveur.
 */

const { execSync, spawn } = require('child_process')
const path = require('path')

// 1. Sanitize DATABASE_URL — évite l'erreur "string contains embedded null" (P3018)
if (process.env.DATABASE_URL && typeof process.env.DATABASE_URL === 'string') {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/\0/g, '')
}

// 2. Résout une migration échouée si nécessaire (P3009) — ignoré si pas applicable
const INIT_MIGRATION = '20260228212539_init'
try {
  execSync(`npx prisma migrate resolve --rolled-back "${INIT_MIGRATION}"`, {
    stdio: 'pipe'
  })
  console.log(`✅ Migration "${INIT_MIGRATION}" marquée comme rolled-back.`)
} catch {
  // Pas de migration échouée à résoudre, on continue
}

// 3. Applique les migrations
console.log('🗄️  Running prisma migrate deploy...')
execSync('npx prisma migrate deploy', { stdio: 'inherit' })

// 4. Démarre le serveur
const serverPath = path.join(process.cwd(), 'server.js')
console.log('▶️  Starting server...')
spawn('node', [serverPath], { stdio: 'inherit' }).on('exit', (code) => {
  process.exit(code ?? 1)
})
