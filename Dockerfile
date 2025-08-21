# Dockerfile pour INKSPOT Next.js app
FROM node:18-alpine AS base

# Installer les dépendances nécessaires
RUN apk add --no-cache libc6-compat

# Étape de dépendances
FROM base AS deps
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Installer toutes les dépendances (incluant devDependencies pour Prisma et ESLint)
RUN npm ci

# Étape de build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Configurer l'environnement avec des valeurs par défaut
RUN echo "🔧 Setting up build environment..." && \
    node scripts/setup-env-docker.js

# Générer le client Prisma
RUN echo "🔧 Generating Prisma client..." && \
    npx prisma generate

# Générer automatiquement les clés VAPID si elles n'existent pas
RUN if [ ! -f .env ] || ! grep -q "VAPID_PUBLIC_KEY" .env; then \
        echo "🔑 Generating VAPID keys automatically..."; \
        node scripts/generate-vapid-keys-docker.js > vapid_keys.txt; \
        cat vapid_keys.txt >> .env; \
        echo "✅ VAPID keys generated and added to .env"; \
        echo "📋 VAPID keys in .env:"; \
        cat .env | grep VAPID; \
    else \
        echo "✅ VAPID keys already present in .env"; \
    fi

# Build de l'application
RUN echo "🚀 Building Next.js application..." && \
    npm run build

# Étape de production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Changer les permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Commande de démarrage
CMD ["node", "server.js"] 