# Multi-stage build for Next.js application
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install only production dependencies first
RUN \
  if [ -f package-lock.json ]; then npm ci --only=production; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && corepack prepare pnpm@latest --activate && pnpm i --frozen-lockfile --prod; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install dev dependencies for build
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && corepack prepare pnpm@latest --activate && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Set default environment variables for build to avoid Stripe errors
ENV NODE_ENV=production
ENV STRIPE_SECRET_KEY=sk_test_dummy_key_for_build
ENV STRIPE_PUBLISHABLE_KEY=pk_test_dummy_key_for_build
ENV AWS_ACCESS_KEY_ID=dummy_access_key
ENV AWS_SECRET_ACCESS_KEY=dummy_secret_key
ENV AWS_S3_BUCKET=dummy_bucket
ENV NEXTAUTH_SECRET=dummy_secret_for_build
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files and node_modules for runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Use a simple startup command that handles database migration
CMD ["sh", "-c", "npx prisma db push --accept-data-loss || echo 'Migration failed, continuing...' && node server.js"] 