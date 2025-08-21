#!/bin/bash

# Railway Deployment Script for INKSPOT
# This script helps deploy and troubleshoot Railway deployments

set -e

echo "🚂 Railway Deployment Script for INKSPOT"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    print_status "Railway CLI found"
}

# Check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ] || [ ! -f "railway.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    print_status "Project directory confirmed"
}

# Pre-deployment checks
pre_deployment_checks() {
    echo ""
    echo "🔍 Running pre-deployment checks..."
    
    # Check if build works locally
    print_status "Testing local build..."
    if npm run build; then
        print_status "Local build successful"
    else
        print_error "Local build failed. Please fix build issues first."
        exit 1
    fi
    
    # Check Prisma schema
    print_status "Validating Prisma schema..."
    if npx prisma validate; then
        print_status "Prisma schema is valid"
    else
        print_error "Prisma schema validation failed"
        exit 1
    fi
    
    # Check environment variables
    print_status "Checking environment variables..."
    if [ -f ".env.example" ]; then
        print_status "Environment template found"
    else
        print_warning "No .env.example file found"
    fi
}

# Deploy to Railway
deploy() {
    echo ""
    echo "🚀 Deploying to Railway..."
    
    # Check Railway status
    print_status "Checking Railway status..."
    railway status
    
    # Deploy
    print_status "Starting deployment..."
    if railway up --detach; then
        print_status "Deployment started successfully"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Check deployment status
check_status() {
    echo ""
    echo "📊 Checking deployment status..."
    
    # Wait a bit for deployment to start
    sleep 10
    
    # Check status
    railway status
    
    # Show logs
    echo ""
    echo "📋 Recent logs:"
    railway logs --tail 20
}

# Show troubleshooting info
show_troubleshooting() {
    echo ""
    echo "🔧 Troubleshooting Information:"
    echo "================================"
    echo ""
    echo "If deployment fails, check:"
    echo "1. Railway logs: railway logs --build"
    echo "2. Environment variables: railway variables"
    echo "3. Build status: railway status"
    echo ""
    echo "Common issues:"
    echo "- Missing environment variables"
    echo "- Prisma client generation failures"
    echo "- TypeScript compilation errors"
    echo "- Memory limits during build"
    echo ""
    echo "For detailed troubleshooting, see: docs/railway-deployment-troubleshooting.md"
}

# Main execution
main() {
    check_railway_cli
    check_directory
    pre_deployment_checks
    
    if [ "$1" = "--deploy" ]; then
        deploy
        check_status
    elif [ "$1" = "--check" ]; then
        check_status
    elif [ "$1" = "--help" ] || [ -z "$1" ]; then
        echo ""
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  --deploy    Run full deployment process"
        echo "  --check     Check deployment status and logs"
        echo "  --help      Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 --deploy    # Deploy to Railway"
        echo "  $0 --check     # Check deployment status"
        echo ""
    else
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
    fi
    
    show_troubleshooting
}

# Run main function with all arguments
main "$@"
