/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour le développement et la production
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Configuration pour Next.js 15
  experimental: {
    // appDir est maintenant par défaut dans Next.js 15
    // typedRoutes: true // Temporarily disabled to fix build error
  },
  
  // Configuration pour Docker builds avec Railway
  output: 'standalone',
  
  // Configuration du build
  distDir: '.next'
}

module.exports = nextConfig
