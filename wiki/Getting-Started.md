# Getting Started

Follow these steps to run INKSPOT-5z locally.

## Prerequisites
- Node.js 18+
- pnpm (or npm)
- Docker (optional, recommended)

## 1) Clone and install
```bash
git clone <your-repo-url>
cd INKSPOT-5z
pnpm install
```

## 2) Configure environment
Copy and edit variables. See [Environment Variables](Environment-Variables) for details and tutorials.
```bash
cp env.example .env
```

## 3) Database setup
```bash
pnpm run db:push     # push schema to local PostgreSQL (or via Docker)
pnpm run db:seed     # seed sample data
```

If you run PostgreSQL via Docker Compose, ensure containers are up (see [Running with Docker](Running-with-Docker)).

## 4) Start the app
```bash
pnpm run dev
# visit http://localhost:3000
```

## Default users (after seeding)
- Admin: `admin@example.com` / `admin123`
- Pro 1: `pierce@example.com` / `pro123`
- Pro 2: `artist@example.com` / `pro123`

## Alternative: run everything with Docker
Use the helper script to launch core services (Postgres, Redis, App, WebSocket, Mailhog).
```bash
./scripts/start-docker.sh start
# App:      http://localhost:3000
# WebSocket http://localhost:3001
# Mailhog:  http://localhost:8025
```

For Stripe webhooks in dev, use LocalTunnel profile:
```bash
./scripts/start-docker.sh webhooks
# Webhook URL: https://inkspot-webhook.loca.lt/api/stripe/webhook
```

Next steps:
- Configure your secrets: [Environment Variables](Environment-Variables)
- Understand the system: [Architecture](Architecture)
- Operate with Docker: [Running with Docker](Running-with-Docker)