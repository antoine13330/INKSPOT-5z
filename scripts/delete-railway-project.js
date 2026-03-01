#!/usr/bin/env node

const https = require('https')

const token = process.argv[2]
const projectId = process.argv[3]

if (!token || !projectId) {
  console.log('Usage: node delete-project.js TOKEN PROJECT_ID')
  process.exit(1)
}

const query = 'mutation { projectDelete(id: "' + projectId + '") }'
const body = JSON.stringify({ query })

const req = https.request({
  hostname: 'backboard.railway.app',
  path: '/graphql/v2',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': Buffer.byteLength(body),
  }
}, res => {
  let data = ''
  res.on('data', c => data += c)
  res.on('end', () => {
    const parsed = JSON.parse(data)
    if (parsed.errors) {
      console.error('Erreur:', parsed.errors[0].message)
      process.exit(1)
    } else {
      console.log('✓ Projet supprimé')
    }
  })
})

req.on('error', e => {
  console.error('Erreur:', e.message)
  process.exit(1)
})
req.write(body)
req.end()
