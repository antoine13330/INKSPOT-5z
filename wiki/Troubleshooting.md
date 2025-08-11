# Troubleshooting / FAQ

## App won't start
- Check `.env` values; see [Environment Variables](Environment-Variables)
- Ensure PostgreSQL and Redis are running (Docker): `docker-compose ps`
- See logs: `./scripts/start-docker.sh logs`

## Stripe webhooks not received
- Start LocalTunnel: `./scripts/start-docker.sh webhooks`
- Update webhook endpoint in Stripe Dashboard and copy new signing secret

## Database errors on first run
- Run `pnpm run db:push` then `pnpm run db:seed`
- If using Docker: wait for Postgres to be healthy

## WebSocket not connecting
- Confirm server up: `http://localhost:3000/api/socketio`
- Check auth/session; verify conversation membership

## Monitoring dashboards empty
- Start monitoring profile: `docker-compose --profile monitoring up -d`
- Visit Grafana: http://localhost:3002 and Prometheus: http://localhost:9090

## Health check fails
```bash
pnpm run health:check
```
Check server logs and DB connection.

Still stuck? Check the logs, verify environment, then open an issue.