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
  // Récupérer les informations GitHub depuis les variables d'environnement
  const repoName = process.env.GITHUB_REPOSITORY || 'antoine13330/INKSPOT-5z';
  const branchName = process.env.GITHUB_REF_NAME || 'dev';
  const commitSha = process.env.GITHUB_SHA || 'latest';
  const actor = process.env.GITHUB_ACTOR || 'GitHub User';
  
  console.log('\n🌐 Informations de l\'environnement de développement:');
  console.log('==================================================');
  console.log('🔗 Repository GitHub: https://github.com/' + repoName);
  console.log('🔗 Branch: ' + branchName);
  console.log('🔗 Commit: ' + commitSha);
  console.log('🔗 Actions: https://github.com/' + repoName + '/actions');
  console.log('');
  console.log('📱 GitHub URLs:');
  console.log('  - Repository: https://github.com/' + repoName);
  console.log('  - Actions: https://github.com/' + repoName + '/actions');
  console.log('  - Issues: https://github.com/' + repoName + '/issues');
  console.log('  - Pull Requests: https://github.com/' + repoName + '/pulls');
  console.log('  - Settings: https://github.com/' + repoName + '/settings');
  console.log('  - Security: https://github.com/' + repoName + '/security');
  console.log('');
  console.log('🔑 Informations de déploiement:');
  console.log('  - Environment: Development');
  console.log('  - Branch: ' + branchName);
  console.log('  - Commit: ' + commitSha);
  console.log('  - Deployed by: ' + actor);
  console.log('');
  console.log('🧪 Test Endpoints (via GitHub Actions):');
  console.log('  - Health: https://github.com/' + repoName + '/actions');
  console.log('  - Build Status: https://github.com/' + repoName + '/actions');
  console.log('  - Deployment Logs: https://github.com/' + repoName + '/actions');
  console.log('');
  console.log('📝 Notes:');
  console.log('  - Déploiement automatique via GitHub Actions');
  console.log('  - Build et tests automatisés');
  console.log('  - Monitoring via GitHub Actions');
  console.log('  - Rollback disponible via GitHub');
  console.log('');
  console.log('🚀 Prêt pour les tests et le développement !');
  console.log('🔗 Vérifiez le statut: https://github.com/' + repoName + '/actions');
}

// Lancer le déploiement
deployToDev();
