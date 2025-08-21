#!/usr/bin/env node

/**
 * Script pour vérifier que Prisma est correctement configuré
 * Usage: node scripts/verify-prisma.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Prisma configuration...');

// Vérifier que les dossiers Prisma existent
const prismaDirs = [
    'node_modules/.prisma',
    'node_modules/@prisma/client'
];

console.log('📋 Checking Prisma directories:');
prismaDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    console.log(`- ${dir}: ${exists ? '✅' : '❌'}`);
    
    if (exists) {
        try {
            const files = fs.readdirSync(dir);
            console.log(`  📁 Contents: ${files.length} files`);
            if (files.length > 0) {
                console.log(`  📄 Sample files: ${files.slice(0, 3).join(', ')}`);
            }
        } catch (error) {
            console.log(`  ❌ Error reading directory: ${error.message}`);
        }
    }
});

// Vérifier que le schéma Prisma existe
const schemaPath = 'prisma/schema.prisma';
console.log(`\n📋 Checking Prisma schema: ${schemaPath}`);
if (fs.existsSync(schemaPath)) {
    console.log('✅ Prisma schema found');
    try {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        const hasDatasource = schemaContent.includes('datasource db');
        const hasGenerator = schemaContent.includes('generator client');
        console.log(`- Datasource: ${hasDatasource ? '✅' : '❌'}`);
        console.log(`- Generator: ${hasGenerator ? '✅' : '❌'}`);
    } catch (error) {
        console.log(`❌ Error reading schema: ${error.message}`);
    }
} else {
    console.log('❌ Prisma schema not found');
}

// Vérifier les variables d'environnement
console.log('\n📋 Checking environment variables:');
const requiredEnvVars = [
    'DATABASE_URL',
    'NODE_ENV'
];

requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        if (varName === 'DATABASE_URL') {
            // Masquer l'URL de la base de données pour la sécurité
            const masked = value.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
            console.log(`- ${varName}: ✅ ${masked}`);
        } else {
            console.log(`- ${varName}: ✅ ${value}`);
        }
    } else {
        console.log(`- ${varName}: ❌ Not set`);
    }
});

// Essayer d'importer Prisma
console.log('\n🚀 Testing Prisma import...');
try {
    const { PrismaClient } = require('@prisma/client');
    console.log('✅ PrismaClient imported successfully');
    
    // Essayer de créer une instance
    const prisma = new PrismaClient();
    console.log('✅ PrismaClient instance created');
    
    // Essayer de se connecter à la base de données
    console.log('🔌 Testing database connection...');
    prisma.$connect()
        .then(() => {
            console.log('✅ Database connection successful');
            return prisma.$disconnect();
        })
        .then(() => {
            console.log('✅ Database connection closed');
        })
        .catch((error) => {
            console.error('❌ Database connection failed:', error.message);
        });
        
} catch (error) {
    console.error('❌ Failed to import PrismaClient:', error.message);
    console.error('💡 Make sure to run: npx prisma generate');
}

console.log('\n✅ Prisma verification complete!');
