#!/bin/bash

# Setup script for PathExplorer
set -e

echo "🔧 Setting up PathExplorer environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_question() {
    echo -e "${BLUE}[QUESTION]${NC} $1"
}

# Function to generate random secret
generate_secret() {
    openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 32 | head -1
}

# Create directories
print_status "Creating directory structure..."
mkdir -p nginx/ssl
mkdir -p backend/logs
mkdir -p backend/uploads

# Check if .env exists, if not create template
if [ ! -f "backend/.env" ]; then
    print_status "Creating development .env file..."
    
    # Generate secrets
    JWT_SECRET=$(generate_secret)
    SESSION_SECRET=$(generate_secret)
    
    cat > backend/.env << EOF
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Authentication
SESSION_SECRET=${SESSION_SECRET}
JWT_SECRET=${JWT_SECRET}

# Database (usando la base de datos de Docker)
DB_CONNECTION=postgresql
DB_HOST=database
DB_NAME=pathexplorer_dev
DB_USER=pathexplorer_user
DB_PASSWORD=pathexplorer_pass

# Server
PORT=4000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
EOF

    print_warning "Created backend/.env with generated secrets. Please update OPENAI_API_KEY with your actual key."
fi

# Check if production .env exists
if [ ! -f "backend/.env.production" ]; then
    print_status "Creating production .env template..."
    
    # Generate production secrets
    JWT_SECRET_PROD=$(generate_secret)
    SESSION_SECRET_PROD=$(generate_secret)
    
    cat > backend/.env.production << EOF
# OpenAI
OPENAI_API_KEY=your_production_openai_api_key_here

# Authentication
SESSION_SECRET=${SESSION_SECRET_PROD}
JWT_SECRET=${JWT_SECRET_PROD}

# Database (configurar con tu base de datos de producción)
DB_CONNECTION=postgresql
DB_HOST=your_production_db_host
DB_NAME=pathexplorer_production
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password

# Server
PORT=4000
NODE_ENV=production

# CORS (ajustar con tu dominio/IP real)
FRONTEND_URL=http://your-vm-ip-address
EOF

    print_warning "Created backend/.env.production template. Please update with your production values."
fi

# Create database init script if it doesn't exist
if [ ! -f "backend/database/init.sql" ]; then
    print_status "Creating database initialization script..."
    mkdir -p backend/database
    
    cat > backend/database/init.sql << EOF
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
EOF

    print_status "Created database init script template at backend/database/init.sql"
fi

# Make scripts executable
chmod +x deploy.sh dev.sh

print_status "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your OPENAI_API_KEY"
echo "2. Update backend/.env.production with your production database credentials"
echo "3. Run './dev.sh' to start development environment"
echo "4. Run './deploy.sh' to deploy to production"
echo ""
print_warning "Don't forget to add your actual API keys and database credentials!"