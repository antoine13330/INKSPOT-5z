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
  
  // Désactiver le server-side rendering pour GitHub Pages
  experimental: {
    appDir: true
  },
  
  // Configuration des redirections
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true,
      },
    ]
  },
  
  // Configuration des headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  }
}

module.exports = nextConfig
