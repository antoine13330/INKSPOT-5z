# Monitoring & Observability

## App endpoints
- Health: `GET /api/health`
- Metrics: `GET /api/metrics` (when enabled)

## Docker monitoring profile
Start monitoring services:
```bash
docker-compose --profile monitoring up -d
# Grafana:   http://localhost:3002
# Prometheus http://localhost:9090
```

Grafana defaults:
- Username: `admin`
- Password: `admin123` (override with `GRAFANA_PASSWORD` in prod)

Pre-provisioned datasources and dashboards are loaded from `monitoring/grafana/*`. See `GRAFANA_SETUP_GUIDE.md` for dashboard details.

## Useful commands
```bash
pnpm run monitoring:status
pnpm run monitoring:logs
pnpm run monitoring:restart
pnpm run monitoring:stop
pnpm run metrics:test     # curl http://localhost:3000/api/metrics
pnpm run health:check     # curl http://localhost:3000/api/health
```

See also: [Performance](Performance), [Security](Security).