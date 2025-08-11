# Architecture

High-level structure:

- `app/` Next.js App Router pages and API routes
  - `app/api/*` REST endpoints (auth, users, posts, payments, messaging, etc.)
  - UI routes in `app/*/page.tsx`
- `components/` shared UI components (shadcn-based + custom chat, navigation, uploads)
- `hooks/` custom hooks (API, WebSocket, storage, recommendations)
- `lib/` backend and shared libraries (auth, Redis cache, Stripe, S3, notifications, performance)
- `prisma/` schema and seed data
- `scripts/` devops and DB scripts (start docker, deploy, reset/verify DB)
- `__tests__/` unit/integration tests; `e2e/` Playwright tests

## Data model (Prisma)
Key enums and models (see `prisma/schema.prisma`):
- Users with roles: CLIENT, PRO, ADMIN; status and verification
- Social: Posts, Likes, Comments, Follows
- Messaging: Conversations, Members, Messages
- Bookings: Booking, with price/deposit, status, links to messages
- Payments: Payment, Transaction, Invoice with Stripe IDs
- Notifications, Reviews, SearchHistory, Interactions

## Core flows
- Auth: NextAuth (Email/Password + Google) with Prisma adapter
- Payments: Stripe intents and webhooks via `app/api/stripe/*`
- Messaging: Socket.IO API route and WebSocket service; UI in `components/chat/*`
- Uploads: S3 presigned uploads; files under `public/uploads` in dev
- Caching: Redis via `lib/redis-cache.ts`
- Monitoring: `/api/metrics`, `/api/health`, Prometheus + Grafana

See: [Realtime Messaging](Realtime-Messaging), [Database](Database), [Security](Security).