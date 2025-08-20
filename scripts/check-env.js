#!/usr/bin/env node

/**
 * Script de vérification des variables d'environnement
 * Usage: node scripts/check-env.js
 */

require('dotenv').config();

const requiredVars = {
  // Base de données
  'DATABASE_URL': 'Connexion à la base de données PostgreSQL',
  
  // Authentification
  'NEXTAUTH_SECRET': 'Clé secrète pour NextAuth.js',
  'NEXTAUTH_URL': 'URL de l\'application pour NextAuth.js',
  
  // Notifications push (VAPID)
  'VAPID_PUBLIC_KEY': 'Clé publique VAPID pour les notifications push',
  'VAPID_PRIVATE_KEY': 'Clé privée VAPID pour les notifications push',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY': 'Clé publique VAPID accessible côté client',
  
  // AWS S3
  'AWS_ACCESS_KEY_ID': 'Clé d\'accès AWS S3',
  'AWS_SECRET_ACCESS_KEY': 'Clé secrète AWS S3',
  'AWS_REGION': 'Région AWS',
  'AWS_S3_BUCKET': 'Nom du bucket S3',
  
  // Stripe
  'STRIPE_SECRET_KEY': 'Clé secrète Stripe',
  'STRIPE_PUBLISHABLE_KEY': 'Clé publique Stripe',
  'STRIPE_WEBHOOK_SECRET': 'Secret webhook Stripe',
  
  // Email
  'EMAIL_FROM': 'Adresse email d\'expédition',
};

const optionalVars = {
  'EMAIL_SERVER_HOST': 'Serveur SMTP (optionnel)',
  'EMAIL_SERVER_PORT': 'Port SMTP (optionnel)',
  'EMAIL_SERVER_USER': 'Utilisateur SMTP (optionnel)',
  'EMAIL_SERVER_PASSWORD': 'Mot de passe SMTP (optionnel)',
  'REDIS_URL': 'URL Redis (optionnel)',
  'LOG_LEVEL': 'Niveau de log (optionnel)',
};

console.log('🔍 Vérification de la configuration de l\'environnement...\n');

let missingRequired = [];
let missingOptional = [];
let allGood = true;

// Vérifier les variables requises
console.log('📋 Variables requises:');
for (const [varName, description] of Object.entries(requiredVars)) {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: ${description}`);
  } else {
    console.log(`  ❌ ${varName}: ${description} - MANQUANTE`);
    missingRequired.push(varName);
    allGood = false;
  }
}

console.log('\n📋 Variables optionnelles:');
for (const [varName, description] of Object.entries(optionalVars)) {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}: ${description}`);
  } else {
    console.log(`  ⚠️  ${varName}: ${description} - Non configurée`);
    missingOptional.push(varName);
  }
}

console.log('\n' + '='.repeat(60));

if (missingRequired.length > 0) {
  console.log('\n❌ ERREUR: Variables requises manquantes:');
  missingRequired.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  
  console.log('\n🔧 Solutions:');
  console.log('1. Créez un fichier .env à la racine du projet');
  console.log('2. Ajoutez les variables manquantes');
  console.log('3. Pour les clés VAPID: node scripts/generate-vapid-keys.js');
  console.log('4. Redémarrez votre serveur');
  
  process.exit(1);
} else {
  console.log('\n✅ Toutes les variables requises sont configurées !');
  
  if (missingOptional.length > 0) {
    console.log(`\n⚠️  ${missingOptional.length} variable(s) optionnelle(s) non configurée(s)`);
    console.log('L\'application fonctionnera mais certaines fonctionnalités pourraient être limitées.');
  }
  
  console.log('\n🚀 Votre environnement est prêt !');
}

console.log('\n📚 Documentation: docs/environment-setup.md');
