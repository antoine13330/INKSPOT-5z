#!/bin/bash

# INKSPOT Docker Compose Management Script
# Updated to use LocalTunnel instead of ngrok

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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 {start|stop|restart|status|logs|clean|webhooks}"
    echo ""
    echo "Commands:"
    echo "  start     - Start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  status    - Show status of all services"
    echo "  logs      - Show logs for all services"
    echo "  clean     - Stop and remove all containers, networks, and volumes"
    echo "  webhooks  - Start with LocalTunnel for webhook testing"
    echo ""
    echo "Examples:"
    echo "  $0 start        # Start core services"
    echo "  $0 webhooks     # Start with LocalTunnel for Stripe webhooks"
    echo "  $0 status       # Check service status"
}

# Function to start services
start_services() {
    print_status "Starting INKSPOT services..."
    
    # Start core services
    docker-compose up -d postgres redis app websocket mailhog
    
    print_success "Core services started successfully!"
    print_status "Application available at: http://localhost:3000"
    print_status "WebSocket server at: http://localhost:3001"
    print_status "MailHog at: http://localhost:8025"
}

# Function to start with webhooks
start_with_webhooks() {
    print_status "Starting INKSPOT services with LocalTunnel for webhooks..."
    
    # Start all services including LocalTunnel
    docker-compose --profile webhooks up -d
    
    print_success "All services started successfully!"
    print_status "Application available at: http://localhost:3000"
    print_status "LocalTunnel URL: https://inkspot-webhook.loca.lt"
    print_status "Configure Stripe webhooks to: https://inkspot-webhook.loca.lt/api/stripe/webhook"
}

# Function to stop services
stop_services() {
    print_status "Stopping INKSPOT services..."
    docker-compose down
    print_success "All services stopped successfully!"
}

# Function to restart services
restart_services() {
    print_status "Restarting INKSPOT services..."
    docker-compose restart
    print_success "All services restarted successfully!"
}

# Function to show status
show_status() {
    print_status "Service Status:"
    docker-compose ps
}

# Function to show logs
show_logs() {
    print_status "Showing logs for all services..."
    docker-compose logs -f
}

# Function to clean everything
clean_all() {
    print_warning "This will remove ALL containers, networks, and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning all Docker resources..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Main script logic
main() {
    check_docker
    
    case "$1" in
        start)
            start_services
            ;;
        webhooks)
            start_with_webhooks
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        clean)
            clean_all
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 