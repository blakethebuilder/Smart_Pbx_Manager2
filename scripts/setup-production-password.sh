#!/bin/bash

# Production Password Setup Script
# This script helps set up a secure password for production deployment

echo "🔐 PBX Dashboard - Production Password Setup"
echo "============================================="

# Check if password is provided as argument
if [ -z "$1" ]; then
    echo "❌ Error: Password not provided"
    echo ""
    echo "Usage: $0 <your_secure_password>"
    echo ""
    echo "Example:"
    echo "  $0 MySecurePassword123!"
    echo ""
    echo "This will:"
    echo "  1. Update the .env file with your password"
    echo "  2. Export the environment variable for Docker"
    echo ""
    exit 1
fi

PASSWORD="$1"

# Validate password strength (basic check)
if [ ${#PASSWORD} -lt 8 ]; then
    echo "❌ Error: Password must be at least 8 characters long"
    exit 1
fi

echo "✅ Setting up password..."

# Update .env file
sed -i.bak "s/MASTER_PASSWORD=.*/MASTER_PASSWORD=$PASSWORD/" .env

# Export for current session
export MASTER_PASSWORD="$PASSWORD"

echo "✅ Password configured successfully!"
echo ""
echo "Next steps:"
echo "1. Deploy with: docker-compose up -d --build"
echo "2. Your dashboard will be available with the new password"
echo ""
echo "⚠️  Important: Keep your password secure and don't commit it to version control!"