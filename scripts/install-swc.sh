#!/bin/bash

# Script d'installation conditionnelle de SWC selon la plateforme
echo "🔍 Détection de la plateforme..."

# Détecter l'OS et l'architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

echo "📱 Plateforme détectée: $OS $ARCH"

# Installer le bon SWC selon la plateforme
if [[ "$OS" == "darwin" ]]; then
    if [[ "$ARCH" == "arm64" ]]; then
        echo "🍎 macOS ARM64 détecté - Installation de @next/swc-darwin-arm64"
        npm install @next/swc-darwin-arm64
    elif [[ "$ARCH" == "x64" ]]; then
        echo "🍎 macOS x64 détecté - Installation de @next/swc-darwin-x64"
        npm install @next/swc-darwin-x64
    else
        echo "❌ Architecture macOS non supportée: $ARCH"
        exit 1
    fi
elif [[ "$OS" == "linux" ]]; then
    if [[ "$ARCH" == "x64" ]]; then
        echo "🐧 Linux x64 détecté - Installation de @next/swc-linux-x64-gnu"
        npm install @next/swc-linux-x64-gnu
    elif [[ "$ARCH" == "arm64" ]]; then
        echo "🐧 Linux ARM64 détecté - Installation de @next/swc-linux-arm64-gnu"
        npm install @next/swc-linux-arm64-gnu
    else
        echo "❌ Architecture Linux non supportée: $ARCH"
        exit 1
    fi
else
    echo "❌ OS non supporté: $OS"
    exit 1
fi

echo "✅ SWC installé avec succès pour $OS $ARCH"
