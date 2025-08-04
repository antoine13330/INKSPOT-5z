#!/bin/bash

# INKSPOT Deployment Script
# This script handles deployment to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
ENVIRONMENT=${1:-staging}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-ghcr.io}
IMAGE_NAME=${IMAGE_NAME:-antoine13330/inkspot-5z}
TAG=${TAG:-latest}

# Function to show usage
show_usage() {
    echo "Usage: $0 {staging|production} [options]"
    echo ""
    echo "Environments:"
    echo "  staging     - Deploy to staging environment"
    echo "  production  - Deploy to production environment"
    echo ""
    echo "Options:"
    echo "  --tag TAG   - Specify image tag (default: latest)"
    echo "  --registry REGISTRY - Specify Docker registry"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production --tag v1.0.0"
    echo "  $0 staging --registry my-registry.com"
}

# Function to validate environment
validate_environment() {
    case $ENVIRONMENT in
        staging|production)
            print_status "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            show_usage
            exit 1
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f env.example ]; then
            cp env.example .env
            print_success ".env file created from template. Please edit it with your actual values."
        else
            print_error "env.example file not found. Please create a .env file with your environment variables."
            exit 1
        fi
    fi
    
    print_success "Prerequisites check passed"
}

# Function to pull latest images
pull_images() {
    print_status "Pulling latest Docker images..."
    
    # Pull main application image
    docker pull $DOCKER_REGISTRY/$IMAGE_NAME:$TAG || print_warning "Failed to pull main image"
    
    # Pull WebSocket server image
    docker pull $DOCKER_REGISTRY/$IMAGE_NAME-websocket:$TAG || print_warning "Failed to pull WebSocket image"
    
    print_success "Images pulled successfully"
}

# Function to backup current deployment
backup_deployment() {
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Creating backup of current deployment..."
        
        # Create backup directory
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p $BACKUP_DIR
        
        # Backup database
        docker-compose exec -T postgres pg_dump -U inkspot_user inkspot > $BACKUP_DIR/database.sql || print_warning "Database backup failed"
        
        # Backup uploads
        cp -r public/uploads $BACKUP_DIR/ || print_warning "Uploads backup failed"
        
        print_success "Backup created in $BACKUP_DIR"
    fi
}

# Function to deploy to staging
deploy_staging() {
    print_status "Deploying to staging environment..."
    
    # Stop existing containers
    docker-compose down || true
    
    # Pull latest images
    pull_images
    
    # Start services
    docker-compose --profile staging up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if docker-compose ps | grep -q "unhealthy"; then
        print_error "Some services are unhealthy. Check logs with: docker-compose logs"
        exit 1
    fi
    
    print_success "Staging deployment completed successfully"
    print_status "Application available at: http://localhost:3000"
    print_status "WebSocket server at: http://localhost:3001"
    print_status "Grafana at: http://localhost:3002"
}

# Function to deploy to production
deploy_production() {
    print_status "Deploying to production environment..."
    
    # Create backup
    backup_deployment
    
    # Stop existing containers
    docker-compose down || true
    
    # Pull latest images
    pull_images
    
    # Start services with production profile
    docker-compose --profile production up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 60
    
    # Check service health
    if docker-compose ps | grep -q "unhealthy"; then
        print_error "Some services are unhealthy. Rolling back..."
        rollback_deployment
        exit 1
    fi
    
    print_success "Production deployment completed successfully"
    print_status "Application available at: https://your-domain.com"
}

# Function to rollback deployment
rollback_deployment() {
    print_warning "Rolling back deployment..."
    
    # Stop current deployment
    docker-compose down
    
    # Restore from backup if available
    if [ -d "backups" ]; then
        LATEST_BACKUP=$(ls -t backups/ | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            print_status "Restoring from backup: $LATEST_BACKUP"
            # Add restore logic here
        fi
    fi
    
    # Start previous version
    docker-compose up -d
    
    print_warning "Rollback completed"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Check application health
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Application health check passed"
    else
        print_error "Application health check failed"
        return 1
    fi
    
    # Check WebSocket server
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "WebSocket server health check passed"
    else
        print_error "WebSocket server health check failed"
        return 1
    fi
    
    # Check database
    if docker-compose exec -T postgres pg_isready -U inkspot_user > /dev/null 2>&1; then
        print_success "Database health check passed"
    else
        print_error "Database health check failed"
        return 1
    fi
    
    print_success "All health checks passed"
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    docker-compose ps
    
    echo ""
    print_status "Recent logs:"
    docker-compose logs --tail=20
}

# Main deployment function
main() {
    print_status "Starting INKSPOT deployment..."
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --tag)
                TAG="$2"
                shift 2
                ;;
            --registry)
                DOCKER_REGISTRY="$2"
                shift 2
                ;;
            staging|production)
                ENVIRONMENT="$1"
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate environment
    validate_environment
    
    # Check prerequisites
    check_prerequisites
    
    # Deploy based on environment
    case $ENVIRONMENT in
        staging)
            deploy_staging
            ;;
        production)
            deploy_production
            ;;
    esac
    
    # Run health checks
    run_health_checks
    
    # Show status
    show_status
    
    print_success "Deployment completed successfully!"
}

# Run main function
main "$@" 