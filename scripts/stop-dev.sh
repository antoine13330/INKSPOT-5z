#!/bin/bash

# Development stop script for INKSPOT
echo "🛑 Stopping INKSPOT development environment..."

# Stop development containers
docker-compose -f docker-compose.dev.yml down

echo "✅ Development environment stopped!"
echo ""
echo "💡 To start again: ./scripts/start-dev.sh"
echo "🧹 To clean volumes: ./scripts/start-dev.sh --clean"
