#!/bin/bash

# INKSPOT Database Backup Script
# This script creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backups"
DB_NAME="inkspot"
DB_USER="inkspot_user"
DB_HOST="postgres"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
BACKUP_FILE="$BACKUP_DIR/inkspot_backup_$(date +%Y%m%d_%H%M%S).sql"

# Create backup
echo "Creating backup: $BACKUP_FILE"
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
echo "Backup compressed: ${BACKUP_FILE}.gz"

# Remove old backups (older than RETENTION_DAYS)
find "$BACKUP_DIR" -name "inkspot_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Removed backups older than $RETENTION_DAYS days"

# List current backups
echo "Current backups:"
ls -la "$BACKUP_DIR"/inkspot_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "Backup completed successfully at $(date)" 