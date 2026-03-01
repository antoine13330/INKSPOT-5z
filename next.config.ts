import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  trailingSlash: true,
  output: 'standalone',
  distDir: '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['@prisma/client'],
}

export default nextConfig