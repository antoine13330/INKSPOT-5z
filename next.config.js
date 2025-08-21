/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour GitHub Pages
  basePath: process.env.NODE_ENV === 'production' ? '/INKSPOT-5z' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/INKSPOT-5z' : '',
  
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
  
  // Pas de redirects avec export statique
  // Pas de headers avec export statique
  
  // Configuration du build
  distDir: 'out'
}

module.exports = nextConfig
