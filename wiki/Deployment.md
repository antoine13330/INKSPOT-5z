# Deployment

The project supports automated CI/CD with Docker images and GitHub Actions, plus manual scripts for staging/production.

## Branches
- Staging: `dev`
- Production: `main`

## Automated pipeline (overview)
- Lint, type-check, unit tests
- Build Docker images (app, websocket)
- Security scan (Trivy)
- Deploy to target environment

## Manual deploy script
```bash
# Staging
./scripts/deploy.sh staging

# Production
./scripts/deploy.sh production --tag v1.0.0

# Health check
./scripts/deploy.sh health-check
```

## Production env example
See `docker-compose.prod.yml` for variables like `NEXTAUTH_URL`, Stripe keys, S3, SMTP, and DB credentials. Also set `GRAFANA_PASSWORD` if monitoring is enabled.

## Rollback and backups
- Backups and rollback hooks are integrated in `scripts/deploy.sh` (for production).
- Uploads under `public/uploads` should be backed up externally in real deployments.

For full details, consult `DEPLOYMENT_GUIDE.md` and `docker-compose.prod.yml`. See also: [Monitoring](Monitoring).