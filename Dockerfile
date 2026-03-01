# Dockerfile pour INKSPOT Next.js app
FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

# Étape de dépendances
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

# Étape de build
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN node scripts/setup-env-docker.js

RUN pnpm prisma generate

RUN if [ ! -f .env ] || ! grep -q "VAPID_PUBLIC_KEY" .env; then \
        node scripts/generate-vapid-keys-docker.js > vapid_keys.txt; \
        cat vapid_keys.txt >> .env; \
    fi

RUN pnpm build

# Étape de production
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output (contient son propre node_modules minimal)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma pour les migrations au démarrage
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
