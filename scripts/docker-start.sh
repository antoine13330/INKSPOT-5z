#!/bin/bash

echo "Starting INKSPOT application in Docker..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
for i in {1..12}; do
  if npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    echo "Database is ready!"
    break
  else
    echo "Database not ready, retrying in 5 seconds... (attempt $i/12)"
    sleep 5
  fi
  
  if [ $i -eq 12 ]; then
    echo "Database connection failed after 60 seconds. Starting anyway..."
  fi
done

# Run database migrations
echo "Running database migrations..."
npx prisma db push --accept-data-loss || echo "Migration failed, continuing..."

echo "Starting application..."
exec node server.js 