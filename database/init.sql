-- Initialization script for PathExplorer database
-- This file will be executed when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add any initial database setup here
-- CREATE TABLE IF NOT EXISTS users (...);
-- INSERT INTO users (...) VALUES (...);

-- Example:
-- CREATE TABLE IF NOT EXISTS app_settings (
--     id SERIAL PRIMARY KEY,
--     key VARCHAR(255) UNIQUE NOT NULL,
--     value TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
