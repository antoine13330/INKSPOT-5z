#!/usr/bin/env node

/**
 * Script de configuration automatique pour CI/CD
 * Génère les clés VAPID et configure l'environnement
 * Usage: node scripts/ci-setup.js
 */

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configuration automatique CI/CD...\n');

// Vérifier si on est en mode CI
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const isProduction = process.env.NODE_ENV === 'production';

if (isCI) {
  console.log('✅ Mode CI/CD détecté');
} else if (isProduction) {
  console.log('⚠️  Mode production détecté - vérification des clés VAPID');
} else {
  console.log('🔧 Mode développement détecté');
}

// Générer les clés VAPID si elles n'existent pas
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log('🔑 Génération des clés VAPID...');
  
  const vapidKeys = webpush.generateVAPIDKeys();
  
  // Définir les variables d'environnement
  process.env.VAPID_PUBLIC_KEY = vapidKeys.publicKey;
  process.env.VAPID_PRIVATE_KEY = vapidKeys.privateKey;
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = vapidKeys.publicKey;
  
  console.log('✅ Clés VAPID générées et configurées');
  
  // En mode CI, créer un fichier .env temporaire
  if (isCI) {
    const envContent = `# Configuration automatique CI/CD
VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
EMAIL_FROM=noreply@inkspot-ci.com
NODE_ENV=production
CI=true
`;
    
    fs.writeFileSync('.env.ci', envContent);
    console.log('📁 Fichier .env.ci créé pour le CI/CD');
  }
} else {
  console.log('✅ Clés VAPID déjà configurées');
}

// Vérifier les autres variables critiques
const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('\n⚠️  Variables manquantes détectées:');
  missingVars.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  
  if (isCI) {
    console.log('\n🔧 Configuration des variables par défaut pour CI/CD...');
    
    // Variables par défaut pour CI/CD
    const defaultVars = {
      'DATABASE_URL': 'postgresql://test:test@localhost:5432/inkspot_test',
      'NEXTAUTH_SECRET': 'ci-secret-key-for-testing-only',
      'NEXTAUTH_URL': 'http://localhost:3000'
    };
    
    missingVars.forEach(varName => {
      if (defaultVars[varName]) {
        process.env[varName] = defaultVars[varName];
        console.log(`  ✅ ${varName} = ${defaultVars[varName]}`);
      }
    });
  } else {
    console.log('\n❌ Variables requises manquantes. Arrêt du script.');
    process.exit(1);
  }
}

// Vérification finale
console.log('\n🔍 Vérification de la configuration...');
console.log(`  ✅ VAPID_PUBLIC_KEY: ${process.env.VAPID_PUBLIC_KEY ? 'Configuré' : 'Manquant'}`);
console.log(`  ✅ VAPID_PRIVATE_KEY: ${process.env.VAPID_PRIVATE_KEY ? 'Configuré' : 'Manquant'}`);
console.log(`  ✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY: ${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'Configuré' : 'Manquant'}`);
console.log(`  ✅ DATABASE_URL: ${process.env.DATABASE_URL ? 'Configuré' : 'Manquant'}`);
console.log(`  ✅ NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'Configuré' : 'Manquant'}`);
console.log(`  ✅ NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ? 'Configuré' : 'Manquant'}`);

console.log('\n🎉 Configuration CI/CD terminée avec succès !');
console.log('📝 Les clés VAPID sont maintenant disponibles pour le build.');

if (isCI) {
  console.log('\n📋 Pour utiliser ces clés dans votre workflow:');
  console.log('1. Les clés sont automatiquement disponibles dans process.env');
  console.log('2. Le fichier .env.ci a été créé avec la configuration');
  console.log('3. Le build peut maintenant se lancer sans erreur VAPID');
}
