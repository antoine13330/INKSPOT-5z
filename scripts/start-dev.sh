#!/bin/bash

# Development startup script for INKSPOT
echo "🚀 Starting INKSPOT in development mode..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

# Remove old volumes if requested
if [ "$1" = "--clean" ]; then
    echo "🧹 Cleaning old volumes..."
    docker-compose -f docker-compose.dev.yml down -v
    docker volume prune -f
fi

# Build and start development containers
echo "🔨 Building development containers..."
docker-compose -f docker-compose.dev.yml build

echo "🚀 Starting development environment..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Service status:"
docker-compose -f docker-compose.dev.yml ps

echo ""
echo "✅ Development environment started!"
echo ""
echo "🌐 Application: http://localhost:3000"
echo "📧 Mailhog: http://localhost:8025"
echo "🗄️  Prisma Studio: http://localhost:5555"
echo "🔌 WebSocket: ws://localhost:3001"
echo ""
echo "📝 To view logs: docker-compose -f docker-compose.dev.yml logs -f app"
echo "🛑 To stop: docker-compose -f docker-compose.dev.yml down"
echo ""
echo "🔄 Hot reload is enabled! Changes to your code will automatically refresh the browser."
