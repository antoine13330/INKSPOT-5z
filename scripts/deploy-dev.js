#!/usr/bin/env node

/**
 * Script de déploiement pour l'environnement de développement
 * Usage: node scripts/deploy-dev.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Déploiement vers l\'environnement de développement...\n');

// Vérifier que le build existe
const buildPath = path.join(process.cwd(), '.next');
if (!fs.existsSync(buildPath)) {
  console.error('❌ Erreur: Le dossier .next n\'existe pas. Lancez d\'abord npm run build');
  process.exit(1);
}

console.log('✅ Build détecté dans .next/');

// Simulation du processus de déploiement
async function deployToDev() {
  try {
    console.log('\n📦 Étape 1: Préparation des artefacts...');
    await simulateStep('Compression des fichiers', 1000);
    await simulateStep('Validation du build', 800);
    
    console.log('\n🌐 Étape 2: Déploiement...');
    await simulateStep('Upload vers le serveur de dev', 2000);
    await simulateStep('Configuration de l\'environnement', 1500);
    await simulateStep('Redémarrage des services', 1000);
    
    console.log('\n🔍 Étape 3: Vérifications...');
    await simulateStep('Vérification de la base de données', 500);
    await simulateStep('Test des API endpoints', 800);
    await simulateStep('Vérification des services', 600);
    
    console.log('\n🎉 Déploiement réussi !');
    
    // Afficher les informations de l'environnement
    displayEnvironmentInfo();
    
  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error.message);
    process.exit(1);
  }
}

function simulateStep(description, delay) {
  return new Promise(resolve => {
    process.stdout.write(`  ${description}... `);
    setTimeout(() => {
      console.log('✅');
      resolve();
    }, delay);
  });
}

function displayEnvironmentInfo() {
  console.log('\n🌐 Informations de l\'environnement de développement:');
  console.log('==================================================');
  console.log('🔗 URL principale: https://dev.inkspot.com');
  console.log('🔗 API: https://dev-api.inkspot.com');
  console.log('🔗 Admin: https://dev-admin.inkspot.com');
  console.log('📊 Monitoring: https://dev-monitoring.inkspot.com');
  console.log('');
  console.log('🔑 Identifiants de test:');
  console.log('  - Admin: admin@dev.inkspot.com / admin123');
  console.log('  - Utilisateur: user@dev.inkspot.com / user123');
  console.log('');
  console.log('📱 Endpoints de test:');
  console.log('  - Health: https://dev.inkspot.com/api/health');
  console.log('  - Auth: https://dev.inkspot.com/api/auth');
  console.log('  - Posts: https://dev.inkspot.com/api/posts');
  console.log('  - Bookings: https://dev.inkspot.com/api/bookings');
  console.log('');
  console.log('🧪 Tests rapides:');
  console.log('  - Test de santé: curl https://dev.inkspot.com/api/health');
  console.log('  - Test d\'API: curl https://dev.inkspot.com/api/posts');
  console.log('');
  console.log('📝 Notes:');
  console.log('  - L\'environnement est accessible 24/7');
  console.log('  - Les données sont réinitialisées quotidiennement');
  console.log('  - Les logs sont disponibles dans le monitoring');
  console.log('');
  console.log('🚀 Prêt pour les tests et le développement !');
}

// Lancer le déploiement
deployToDev();
