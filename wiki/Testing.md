# Testing

## Unit/Integration tests (Jest)
- Location: `__tests__/`
- Run:
```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

## E2E (Playwright)
- Location: `e2e/`
- Install browsers once:
```bash
npx playwright install
```
- Run:
```bash
pnpm test:e2e
# UI mode
pnpm test:e2e:ui
```

Prefer writing tests colocated in `__tests__` and use Testing Library for React components.