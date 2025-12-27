#!/bin/bash

# MSP Fleet Dashboard - Development Setup Script

echo "🚀 Setting up MSP Fleet Dashboard for development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install React frontend dependencies
echo "📦 Installing React frontend dependencies..."
cd frontend-react
npm install
cd ..

# Create data directory if it doesn't exist
mkdir -p backend/data

# Copy environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend environment file..."
    cp backend/.env.example backend/.env
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start development:"
echo "  Backend:  cd backend && npm run dev"
echo "  React:    cd frontend-react && npm run dev"
echo ""
echo "URLs:"
echo "  Backend API:     http://localhost:3000"
echo "  React Frontend:  http://localhost:3001"
echo "  Legacy Frontend: http://localhost:3000 (served by backend)"
echo ""
echo "Default login: Smart@2026!"