@echo off
REM Railway Deployment Script for INKSPOT (Windows)
REM This script helps deploy and troubleshoot Railway deployments

echo 🚂 Railway Deployment Script for INKSPOT
echo ========================================

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo ✗ Railway CLI not found. Please install it first:
    echo npm install -g @railway/cli
    pause
    exit /b 1
)
echo ✓ Railway CLI found

REM Check if we're in the right directory
if not exist "package.json" (
    echo ✗ Please run this script from the project root directory
    pause
    exit /b 1
)
if not exist "railway.json" (
    echo ✗ Please run this script from the project root directory
    pause
    exit /b 1
)
echo ✓ Project directory confirmed

REM Pre-deployment checks
echo.
echo 🔍 Running pre-deployment checks...

REM Check if build works locally
echo ✓ Testing local build...
call npm run build
if %errorlevel% neq 0 (
    echo ✗ Local build failed. Please fix build issues first.
    pause
    exit /b 1
)
echo ✓ Local build successful

REM Check Prisma schema
echo ✓ Validating Prisma schema...
call npx prisma validate
if %errorlevel% neq 0 (
    echo ✗ Prisma schema validation failed
    pause
    exit /b 1
)
echo ✓ Prisma schema is valid

REM Check environment variables
echo ✓ Checking environment variables...
if exist ".env.example" (
    echo ✓ Environment template found
) else (
    echo ⚠ No .env.example file found
)

REM Deploy to Railway
echo.
echo 🚀 Deploying to Railway...

REM Check Railway status
echo ✓ Checking Railway status...
railway status

REM Deploy
echo ✓ Starting deployment...
railway up --detach
if %errorlevel% neq 0 (
    echo ✗ Deployment failed
    pause
    exit /b 1
)
echo ✓ Deployment started successfully

REM Check deployment status
echo.
echo 📊 Checking deployment status...

REM Wait a bit for deployment to start
timeout /t 10 /nobreak >nul

REM Check status
railway status

REM Show logs
echo.
echo 📋 Recent logs:
railway logs --tail 20

REM Show troubleshooting info
echo.
echo 🔧 Troubleshooting Information:
echo ================================
echo.
echo If deployment fails, check:
echo 1. Railway logs: railway logs --build
echo 2. Environment variables: railway variables
echo 3. Build status: railway status
echo.
echo Common issues:
echo - Missing environment variables
echo - Prisma client generation failures
echo - TypeScript compilation errors
echo - Memory limits during build
echo.
echo For detailed troubleshooting, see: docs/railway-deployment-troubleshooting.md

pause
