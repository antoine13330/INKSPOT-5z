import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Configuration pour les images locales dans le dossier public
    domains: ['localhost'],
    // Pas besoin de remotePatterns pour les fichiers locaux
  },
  // Configuration pour éviter les erreurs de build
  typescript: {
    // Ignore les erreurs TypeScript pendant le build (optionnel)
    ignoreBuildErrors: false,
  },
  // Paquets externes côté serveur (remplace experimental.serverComponentsExternalPackages)
  serverExternalPackages: ['@prisma/client'],
  // Configuration pour le serveur de développement
  webpack: (config, { dev, isServer }) => {
    if (dev && isServer) {
      // Améliore la stabilité en développement
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

export default nextConfig