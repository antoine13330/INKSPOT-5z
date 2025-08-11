# Useful Commands

## App
```bash
pnpm run dev
pnpm run build
pnpm run start
pnpm run lint
```

## Build helper
```bash
./scripts/build.sh
```

## Database
```bash
pnpm run db:push
pnpm run db:seed
pnpm run db:studio
pnpm run db:reset
pnpm run db:verify
```

## Docker
```bash
pnpm run docker:start
pnpm run docker:start:dev
pnpm run docker:stop
pnpm run docker:restart
pnpm run docker:status
pnpm run docker:logs
pnpm run docker:reset-db
pnpm run docker:build
pnpm run docker:build:prod
pnpm run docker:up:prod

# Alternative direct script
./scripts/start-docker.sh start|webhooks|stop|restart|status|logs|clean
```

## Monitoring
```bash
pnpm run monitoring:start
pnpm run monitoring:stop
pnpm run monitoring:logs
pnpm run monitoring:restart
pnpm run monitoring:status
pnpm run metrics:test
pnpm run health:check
```

## Notifications (VAPID)
```bash
pnpm run generate-vapid
```

## Maintenance / Devex
```bash
./scripts/cleanup-code.sh analyze|clean|organize|all
./scripts/backup.sh
./scripts/deploy.sh staging|production [--tag vX.Y.Z]
./scripts/create-pull-requests.sh
./scripts/update-tickets.sh list|update|create|close
./scripts/publish-wiki.sh "Update wiki"
```

## Tests
```bash
pnpm test
pnpm test:watch
pnpm test:coverage
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
pnpm test:e2e:debug
```