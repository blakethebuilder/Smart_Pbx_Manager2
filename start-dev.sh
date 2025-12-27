#!/bin/bash

# Start both backend and React frontend for development

echo "🚀 Starting MSP Fleet Dashboard in development mode..."

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend-react/node_modules" ]; then
    echo "📦 Installing React frontend dependencies..."
    cd frontend-react && npm install && cd ..
fi

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend
echo "📡 Starting backend server on port 3000..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start React frontend
echo "⚛️  Starting React frontend on port 3001..."
cd frontend-react
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Services started successfully!"
echo ""
echo "📊 Backend API:      http://localhost:3000"
echo "⚛️  React Frontend:  http://localhost:3001"
echo "🌐 Legacy Frontend:  http://localhost:3000"
echo ""
echo "🔐 Default login: Smart@2026!"
echo ""
echo "📝 Note: Make sure to start the backend first, then the React frontend"
echo "   The React app connects to the backend on port 3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait