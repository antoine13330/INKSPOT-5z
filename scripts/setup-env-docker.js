#!/usr/bin/env node

/**
 * Script pour configurer l'environnement Docker avec des valeurs par défaut
 * Usage: node scripts/setup-env-docker.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Docker environment...');

// Vérifier si .env existe
const envPath = path.join(process.cwd(), '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ .env file found, checking for missing variables...');
} else {
    console.log('📝 Creating new .env file...');
}

// Variables essentielles avec valeurs par défaut pour Docker
const requiredVars = {
    'NODE_ENV': 'production',
    'NEXT_TELEMETRY_DISABLED': '1',
    'PORT': '3000',
    'HOSTNAME': '0.0.0.0'
};

// Variables optionnelles avec valeurs par défaut
const optionalVars = {
    'NEXTAUTH_URL': 'http://localhost:3000',
    'NEXTAUTH_SECRET': 'docker-build-secret-change-in-production',
    'DATABASE_URL': 'postgresql://postgres:password@localhost:5432/inkspot',
    'GOOGLE_CLIENT_ID': 'docker-client-id',
    'GOOGLE_CLIENT_SECRET': 'docker-client-secret',
    'STRIPE_SECRET_KEY': 'sk_test_docker_key',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'pk_test_docker_key',
    'AWS_ACCESS_KEY_ID': 'docker-access-key',
    'AWS_SECRET_ACCESS_KEY': 'docker-secret-key',
    'AWS_REGION': 'us-east-1',
    'AWS_S3_BUCKET': 'docker-bucket',
    'EMAIL_SERVER_HOST': 'smtp.gmail.com',
    'EMAIL_SERVER_PORT': '587',
    'EMAIL_SERVER_USER': 'docker@example.com',
    'EMAIL_SERVER_PASSWORD': 'docker-password',
    'EMAIL_FROM': 'docker@example.com'
};

// Fonction pour ajouter une variable si elle n'existe pas
function addVarIfMissing(key, value) {
    if (!envContent.includes(`${key}=`)) {
        envContent += `\n${key}=${value}`;
        console.log(`➕ Added ${key}=${value}`);
        return true;
    }
    return false;
}

// Ajouter les variables essentielles
console.log('\n📋 Adding essential variables...');
Object.entries(requiredVars).forEach(([key, value]) => {
    addVarIfMissing(key, value);
});

// Ajouter les variables optionnelles
console.log('\n📋 Adding optional variables with defaults...');
Object.entries(optionalVars).forEach(([key, value]) => {
    addVarIfMissing(key, value);
});

// Écrire le fichier .env
fs.writeFileSync(envPath, envContent.trim() + '\n');

console.log('\n✅ Environment setup complete!');
console.log('📝 Note: Please update these values in Railway dashboard for production use.');
console.log('🔑 VAPID keys will be generated automatically during build if not present.');
