-- Initialize INKSPOT database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE inkspot'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'inkspot')\gexec

-- Grant privileges to inkspot_user
GRANT ALL PRIVILEGES ON DATABASE inkspot TO inkspot_user;

-- Connect to the inkspot database
\c inkspot;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Note: Indexes will be created by Prisma when the schema is pushed
-- The following indexes will be created automatically by Prisma:
-- - Primary keys
-- - Foreign key indexes
-- - Unique constraints
-- - Custom indexes defined in schema.prisma

-- Grant all privileges on all tables to inkspot_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inkspot_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inkspot_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO inkspot_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO inkspot_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO inkspot_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO inkspot_user;
