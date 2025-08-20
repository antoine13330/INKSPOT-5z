#!/usr/bin/env node

/**
 * Script pour générer les clés VAPID pour les notifications push
 * Usage: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

console.log('🔑 Génération des clés VAPID pour les notifications push...\n');

// Générer une nouvelle paire de clés VAPID
const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ Clés VAPID générées avec succès !\n');

console.log('📋 Ajoutez ces variables à votre fichier .env :\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n`);

console.log('📝 Note: NEXT_PUBLIC_VAPID_PUBLIC_KEY est nécessaire côté client pour s\'abonner aux notifications.');
console.log('🔒 VAPID_PRIVATE_KEY doit rester secret et ne jamais être exposé côté client.\n');

console.log('🚀 Après avoir ajouté ces variables, redémarrez votre serveur de développement.');
