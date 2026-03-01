#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const PORT = process.env.PORT || 3000
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0'

console.log('🚀 Starting INKSPOT production server...')
console.log(`   NODE_ENV : ${process.env.NODE_ENV}`)
console.log(`   PORT     : ${PORT}`)
console.log(`   HOSTNAME : ${HOSTNAME}`)

// Migrations Prisma
if (process.env.DATABASE_URL) {
  console.log('🗄️  Running database migrations...')
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('✅ Migrations complete.')
  } catch (err) {
    console.error('⚠️  Migration failed (non-fatal):', err.message)
  }
} else {
  console.warn('⚠️  DATABASE_URL not set — skipping migrations.')
}

// Utiliser le serveur standalone si disponible (output: 'standalone' dans next.config)
const standaloneServer = path.join(process.cwd(), '.next', 'standalone', 'server.js')
const useStandalone = fs.existsSync(standaloneServer)

if (useStandalone) {
  console.log('▶️  Starting Next.js standalone server...')
  process.env.PORT = String(PORT)
  process.env.HOSTNAME = HOSTNAME
  require(standaloneServer)
} else {
  console.log('▶️  Starting Next.js via next start...')
  const server = spawn(
    'node',
    ['node_modules/.bin/next', 'start', '--port', String(PORT), '--hostname', HOSTNAME],
    { stdio: 'inherit', env: process.env }
  )
  server.on('error', (err) => {
    console.error('❌ Failed to start Next.js:', err.message)
    process.exit(1)
  })
  server.on('exit', (code) => {
    process.exit(code ?? 1)
  })
}
