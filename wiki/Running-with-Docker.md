# Running with Docker

Use the helper script to manage Docker Compose services.

## Start core services
```bash
./scripts/start-docker.sh start
# App:      http://localhost:3000
# WebSocket http://localhost:3001
# Mailhog:  http://localhost:8025
```

## Start with Stripe webhooks (LocalTunnel)
```bash
./scripts/start-docker.sh webhooks
# Webhook URL: https://inkspot-webhook.loca.lt/api/stripe/webhook
```

## Other commands
```bash
./scripts/start-docker.sh status
./scripts/start-docker.sh logs
./scripts/start-docker.sh restart
./scripts/start-docker.sh stop
./scripts/start-docker.sh clean   # removes containers/volumes (danger)
```

## Services and ports
- App (Next.js): 3000
- WebSocket: 3001
- PostgreSQL: 5432
- Redis: 6379
- Mailhog: 8025
- Grafana (monitoring profile): 3002
- Prometheus (monitoring profile): 9090

See `docker-compose.yml` for full details and profiles. For production, see [Deployment](Deployment).