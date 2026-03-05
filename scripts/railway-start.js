#!/usr/bin/env node
/**
 * Script de démarrage Railway : sanitize DATABASE_URL, résout les migrations
 * échouées, applique les migrations, puis démarre le serveur.
 */

const { execSync, spawn } = require('child_process')
const path = require('path')

// 1. Sanitize DATABASE_URL — évite l'erreur "string contains embedded null" (P3018)
const cleanEnv = { ...process.env }
if (cleanEnv.DATABASE_URL && typeof cleanEnv.DATABASE_URL === 'string') {
  const before = cleanEnv.DATABASE_URL
  cleanEnv.DATABASE_URL = before.replace(/\0/g, '')
  if (before !== cleanEnv.DATABASE_URL) {
    console.log('⚠️  Stripped null bytes from DATABASE_URL')
  }
}

// 2. Résout une migration échouée si nécessaire (P3009) — ignoré si pas applicable
const INIT_MIGRATION = '20260228212539_init'
try {
  execSync(`npx prisma migrate resolve --rolled-back "${INIT_MIGRATION}"`, {
    stdio: 'pipe',
    env: cleanEnv
  })
  console.log(`✅ Migration "${INIT_MIGRATION}" marquée comme rolled-back.`)
} catch {
  // Pas de migration échouée à résoudre, on continue
}

// 3. Applique les migrations (env explicite pour garantir DATABASE_URL nettoyée)
console.log('🗄️  Running prisma migrate deploy...')
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: cleanEnv })
} catch (err) {
  console.warn('⚠️  migrate deploy failed. Fallback: prisma db push...')
  try {
    execSync('npx prisma db push', { stdio: 'inherit', env: cleanEnv })
    console.log('✅ db push OK (schema synced without migration history)')
  } catch (pushErr) {
    console.error('❌ db push also failed')
    throw err
  }
}

// 4. Démarre le serveur
const serverPath = path.join(process.cwd(), 'server.js')
console.log('▶️  Starting server...')
spawn('node', [serverPath], { stdio: 'inherit', env: cleanEnv }).on('exit', (code) => {
  process.exit(code ?? 1)
})
