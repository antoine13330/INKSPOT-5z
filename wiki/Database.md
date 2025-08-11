# Database

Prisma + PostgreSQL power the data layer.

## Commands
```bash
pnpm run db:push     # apply schema to DB
pnpm run db:seed     # seed sample data
pnpm run db:studio   # open Prisma Studio
pnpm run db:reset    # reset and reseed database (see notes)
pnpm run db:verify   # verify DB state summary
```

Notes:
- `db:reset` triggers Stripe setup for some users. Set `STRIPE_SECRET_KEY` to avoid warnings.
- Local DB via Docker Compose uses `postgres://inkspot_user:inkspot_password@localhost:5432/inkspot`.

## Schema highlights
See `prisma/schema.prisma` for full details. Key relations:
- User ↔ Post/Like/Comment/Follow
- Conversation ↔ Member/Message
- Booking ↔ Payment/Invoice/Message
- Payment ↔ Transaction
- Notification, Review, SearchHistory, MagicLink, PushSubscription

## Troubleshooting
- Ensure DB container is healthy: `docker-compose ps`
- Run `pnpm run db:studio` to inspect data