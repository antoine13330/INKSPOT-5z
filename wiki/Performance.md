# Performance

Highlights:
- Redis caching for frequent queries (`lib/redis-cache.ts`)
- CDN/image optimization helpers (`lib/cdn-manager.ts`)
- Lazy loading for images/components/lists (`components/ui/lazy-load.tsx`)
- Performance monitor and budgets (`lib/performance-monitor.ts`, `lib/performance-budgets.ts`)
- DB indexing and query optimization (`lib/database-optimizer.ts`)
- Service Worker strategies (`public/sw.js`)

## Targets (examples)
- API p95 < 500ms
- DB queries < 100ms
- LCP < 2.5s, CLS < 0.1
- Bundle size < 500KB (gzipped)

See `PERFORMANCE_GUIDE.md` for details and Nginx caching examples.