#!/bin/bash

# Script d'installation conditionnelle de SWC selon la plateforme
echo "🔍 Détection de la plateforme..."

# Détecter l'OS et l'architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

echo "📱 Plateforme détectée: $OS $ARCH"
echo "🔧 Architecture détaillée: $(uname -a)"
echo "📦 Vérification des packages SWC disponibles..."
npm list @next/swc* 2>/dev/null || echo "Aucun package SWC installé"

# Installer le bon SWC selon la plateforme
if [[ "$OS" == "darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        echo "🍎 macOS ARM64 détecté - Installation de @next/swc-darwin-arm64"
        npm install @next/swc-darwin-arm64
    elif [[ "$ARCH" == "x64" ]] || [[ "$ARCH" == "x86_64" ]]; then
        echo "🍎 macOS x64/x86_64 détecté - Installation de @next/swc-darwin-x64"
        npm install @next/swc-darwin-x64
    else
        echo "❌ Architecture macOS non supportée: $ARCH"
        exit 1
    fi
elif [[ "$OS" == "linux" ]]; then
    if [[ "$ARCH" == "x86_64" ]] || [[ "$ARCH" == "x64" ]]; then
        echo "🐧 Linux x86_64/x64 détecté - Installation de @next/swc-linux-x64-gnu"
        npm install @next/swc-linux-x64-gnu
    elif [[ "$ARCH" == "arm64" ]] || [[ "$ARCH" == "aarch64" ]]; then
        echo "🐧 Linux ARM64 détecté - Installation de @next/swc-linux-arm64-gnu"
        npm install @next/swc-linux-arm64-gnu
    else
        echo "⚠️  Architecture Linux non supportée: $ARCH"
        echo "📝 Tentative d'installation du package générique..."
        npm install @next/swc-linux-x64-gnu || echo "⚠️  Installation SWC échouée, mais on continue..."
    fi
else
    echo "⚠️  OS non supporté: $OS"
    echo "📝 Tentative d'installation du package générique..."
    npm install @next/swc-linux-x64-gnu || echo "⚠️  Installation SWC échouée, mais on continue..."
fi

echo "✅ SWC installé avec succès pour $OS $ARCH"

# Vérification de l'installation
if npm list @next/swc* >/dev/null 2>&1; then
    echo "✅ Vérification réussie: SWC est installé"
else
    echo "⚠️  SWC n'est pas installé, mais on continue..."
    echo "📝 Note: Next.js utilisera le compilateur par défaut"
fi
