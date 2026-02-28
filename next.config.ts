import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Configuration pour les images locales dans le dossier public
    domains: ['localhost'],
    // Pas besoin de remotePatterns pour les fichiers locaux
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // TODO: reactivate once 102 ESLint errors are fixed (65 unescaped-entities, 23 hooks/rules-of-hooks, 14 misc)
    ignoreDuringBuilds: true,
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