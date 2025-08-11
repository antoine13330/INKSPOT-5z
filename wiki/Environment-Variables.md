# Environment Variables

This page lists required variables and shows how to obtain each key securely.

## Core
- `DATABASE_URL`: PostgreSQL connection, e.g. `postgresql://inkspot_user:inkspot_password@localhost:5432/inkspot`
- `REDIS_URL`: Redis connection, e.g. `redis://localhost:6379`
- `NODE_ENV`: `development` | `production`

## Auth (NextAuth)
- `NEXTAUTH_URL`: e.g. `http://localhost:3000`
- `NEXTAUTH_SECRET`: 32+ char random string.
  - Generate:
    - OpenSSL: `openssl rand -hex 32`
    - Node: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## OAuth Providers (Google)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Tutorial (Google):
1. Go to Google Cloud Console → OAuth consent screen → set up app (External for dev).
2. Create Credentials → OAuth client ID → Web application.
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.
4. Copy Client ID/Secret to `.env`.

## Stripe
- `STRIPE_SECRET_KEY`: Test key from Stripe Dashboard → Developers → API keys.
- `STRIPE_PUBLISHABLE_KEY`: Test publishable key.
- `STRIPE_WEBHOOK_SECRET`: From the webhook endpoint you create.

Dev webhook tips:
- Start LocalTunnel profile: `./scripts/start-docker.sh webhooks`.
- Create a webhook endpoint in Stripe Dashboard pointing to:
  - `https://inkspot-webhook.loca.lt/api/stripe/webhook`
- Select events you need (e.g. `payment_intent.succeeded`, `charge.failed`).
- Copy the "Signing secret" as `STRIPE_WEBHOOK_SECRET`.

## AWS S3 (uploads)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION` (e.g. `us-east-1`)
- `AWS_S3_BUCKET`

Tutorial (AWS):
1. Create an IAM user (Programmatic access).
2. Attach a least-privilege policy for your bucket (read/write objects).
3. Create an S3 bucket for uploads.
4. Store access key/secret securely (never commit).

## Email (SMTP)
Local dev uses Mailhog via Docker.
- `SMTP_HOST=localhost`
- `SMTP_PORT=1025`
- `SMTP_USER`, `SMTP_PASS` empty for local.
- `EMAIL_FROM` for notifications (used to set VAPID subject): e.g. `noreply@localhost`

Mailhog UI: http://localhost:8025

## Web Push (VAPID)
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

Generate keys:
```bash
pnpm run generate-vapid
# then add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to .env
```

## WebSocket
- `WS_PORT=3001` (default for the separate WebSocket service){.note}

## Production-only examples
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` (if using prod docker-compose override)
- `GRAFANA_PASSWORD` for Grafana admin

## Optional/advanced
If you enable additional tooling:
- APM: `APM_ENABLED`, `APM_ENDPOINT`, `APM_API_KEY`
- Security scans: `SNYK_TOKEN`, `GITGUARDIAN_API_KEY`

## Best practices
- Use a secrets manager in production (not `.env`).
- Rotate secrets regularly.
- Separate staging and production credentials.
- Restrict IAM permissions to the minimum required.

See also: `env.example` and Docker envs in `docker-compose*.yml`.