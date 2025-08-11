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

## Direct docker-compose usage
```bash
docker-compose up -d postgres redis app websocket mailhog
# Stop / status / logs
docker-compose down
docker-compose ps
docker-compose logs -f
```

## Monitoring profile
```bash
docker-compose --profile monitoring up -d
# Grafana:   http://localhost:3002
# Prometheus http://localhost:9090
```

## Cleanup
```bash
./scripts/start-docker.sh clean
# or
docker-compose down -v --remove-orphans
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