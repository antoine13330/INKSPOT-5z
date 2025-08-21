#!/usr/bin/env node

/**
 * Script pour générer les clés VAPID pour les notifications push (version Docker)
 * Usage: node scripts/generate-vapid-keys-docker.js
 */

const webpush = require('web-push');

// Générer une nouvelle paire de clés VAPID
const vapidKeys = webpush.generateVAPIDKeys();

// Output formaté pour Docker build
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
