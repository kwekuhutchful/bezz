#!/bin/bash

echo "🎨 Starting Bezz AI Frontend"
echo "============================"

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in frontend directory"
    exit 1
fi

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "🏃 Starting React development server..."
echo "Frontend will be available at: http://localhost:3000"
echo ""

# Start the frontend development server
npm run dev 