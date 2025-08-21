#!/usr/bin/env node

/**
 * Script de démarrage de production pour Docker
 * Gère différents modes de démarrage et vérifications
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting INKSPOT production server...');

// Vérifier l'environnement
console.log('🔍 Environment check:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PORT: ${process.env.PORT || 3000}`);
console.log(`- HOSTNAME: ${process.env.HOSTNAME || '0.0.0.0'}`);

// Vérifier les fichiers nécessaires
const requiredFiles = [
    'package.json',
    '.next',
    'node_modules'
];

console.log('📋 Checking required files:');
requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`- ${file}: ${exists ? '✅' : '❌'}`);
    if (!exists) {
        console.error(`❌ Required file/directory missing: ${file}`);
        process.exit(1);
    }
});

// Vérifier Next.js
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const nextVersion = packageJson.dependencies?.next;
    console.log(`📦 Next.js version: ${nextVersion || 'Not found'}`);
    
    if (!nextVersion) {
        console.error('❌ Next.js not found in dependencies');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Error reading package.json:', error.message);
    process.exit(1);
}

// Essayer de démarrer le serveur
console.log('🚀 Attempting to start server...');

// Méthode 1: Essayer next start directement
try {
    console.log('🔄 Method 1: Direct next start...');
    const nextStart = spawn('npx', ['next', 'start'], {
        stdio: 'inherit',
        env: process.env
    });
    
    nextStart.on('error', (error) => {
        console.error('❌ Method 1 failed:', error.message);
        console.log('🔄 Trying Method 2: npm start...');
        
        // Méthode 2: npm start
        const npmStart = spawn('npm', ['start'], {
            stdio: 'inherit',
            env: process.env
        });
        
        npmStart.on('error', (error2) => {
            console.error('❌ Method 2 failed:', error2.message);
            console.log('🔄 Trying Method 3: node server.js...');
            
            // Méthode 3: Vérifier si standalone existe
            if (fs.existsSync('server.js')) {
                const nodeServer = spawn('node', ['server.js'], {
                    stdio: 'inherit',
                    env: process.env
                });
                
                nodeServer.on('error', (error3) => {
                    console.error('❌ All startup methods failed');
                    console.error('Error 1:', error.message);
                    console.error('Error 2:', error2.message);
                    console.error('Error 3:', error3.message);
                    process.exit(1);
                });
            } else {
                console.error('❌ No startup method available');
                process.exit(1);
            }
        });
    });
    
} catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
}
