/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration pour GitHub Pages
  basePath: process.env.NODE_ENV === 'production' ? '/INKSPOT-5z' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/INKSPOT-5z' : '',
  
  // Configuration pour l'export statique
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Configuration pour Next.js 15
  experimental: {
    // appDir est maintenant par défaut dans Next.js 15
  },
  
  // Pas de redirects avec export statique
  // Pas de headers avec export statique
  
  // Configuration du build
  distDir: 'out',
  
  // Désactiver le téléchargement SWC pour GitHub Actions
  swcMinify: false
}

module.exports = nextConfig
