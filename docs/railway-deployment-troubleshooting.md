# Railway Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Build Failures

#### Issue: TypeScript compilation errors
**Symptoms:** Build fails with TypeScript errors that don't occur locally
**Solutions:**
- Ensure all environment variables are set in Railway dashboard
- Check that `NODE_ENV=production` is set
- Verify Prisma schema is valid: `npx prisma validate`

#### Issue: Missing dependencies
**Symptoms:** Build fails with "Cannot find module" errors
**Solutions:**
- Ensure `package-lock.json` is committed to git
- Check that all dependencies are in `dependencies` not `devDependencies`
- Run `npm ci --only=production` locally to test

#### Issue: Prisma build errors
**Symptoms:** Build fails during Prisma client generation
**Solutions:**
- Ensure `DATABASE_URL` is set in Railway
- Add `prisma generate` to build script if needed
- Check Prisma schema syntax

### 2. Environment Variables

#### Required Variables for Build:
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.railway.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
```

#### Public Variables (NEXT_PUBLIC_*):
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
NEXT_PUBLIC_WS_URL=wss://your-app.railway.app
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

### 3. Configuration Issues

#### Next.js Config:
- Ensure `output: 'standalone'` is set for Docker builds
- Remove `basePath` and `assetPrefix` for Railway
- Set `distDir: '.next'` (not `'out'`)

#### Railway Config:
- Use `"builder": "DOCKERFILE"` for Docker builds
- Ensure `dockerfilePath` points to correct Dockerfile
- Remove `buildCommand` when using Docker

### 4. Docker Build Issues

#### Issue: Build context too large
**Solutions:**
- Add `.dockerignore` file
- Exclude unnecessary files from build context
- Use multi-stage builds efficiently

#### Issue: Memory limits
**Solutions:**
- Optimize Dockerfile layers
- Use `.dockerignore` to reduce context size
- Consider using Railway's build cache

### 5. Runtime Issues

#### Issue: App crashes on startup
**Solutions:**
- Check health check endpoint `/api/health`
- Verify all required environment variables
- Check database connectivity
- Review Railway logs for errors

#### Issue: Database connection failures
**Solutions:**
- Ensure `DATABASE_URL` is correct
- Check database is accessible from Railway
- Verify Prisma client is generated correctly

## Debugging Steps

### 1. Check Railway Logs
```bash
# View build logs
railway logs --build

# View runtime logs
railway logs
```

### 2. Test Locally with Production Build
```bash
# Build locally
npm run build

# Start production server
npm start

# Test with production environment variables
NODE_ENV=production npm start
```

### 3. Verify Environment Variables
```bash
# Check Railway variables
railway variables

# Test locally with Railway variables
railway run npm run build
```

### 4. Check Prisma
```bash
# Validate schema
npx prisma validate

# Generate client
npx prisma generate

# Test database connection
npx prisma db push --preview-feature
```

## Quick Fixes

### 1. Reset Railway Build
```bash
railway up --detach
```

### 2. Force Rebuild
```bash
railway up --detach --force
```

### 3. Check Build Status
```bash
railway status
```

## Prevention

### 1. Pre-deployment Checklist
- [ ] All environment variables set in Railway
- [ ] `package-lock.json` committed
- [ ] Prisma schema validated
- [ ] Local production build works
- [ ] Docker build works locally

### 2. CI/CD Best Practices
- Test builds locally before pushing
- Use consistent Node.js versions
- Pin dependency versions
- Monitor build logs regularly

### 3. Environment Management
- Use Railway environments (dev/staging/prod)
- Keep environment variables organized
- Document required variables
- Use `.env.example` files
