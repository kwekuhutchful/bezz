#!/bin/bash

echo "🚀 Bezz AI Development Environment"
echo "=================================="

# Function to start backend
start_backend() {
    echo "Starting backend..."
    ./start-backend.sh &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
}

# Function to start frontend
start_frontend() {
    echo "Starting frontend..."
    ./start-frontend.sh &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [backend|frontend|both]"
    echo ""
    echo "Options:"
    echo "  backend  - Start only the Go backend server"
    echo "  frontend - Start only the React frontend"
    echo "  both     - Start both backend and frontend (default)"
    echo ""
    echo "Examples:"
    echo "  ./start-dev.sh           # Start both"
    echo "  ./start-dev.sh backend   # Start only backend"
    echo "  ./start-dev.sh frontend  # Start only frontend"
    echo "  ./start-dev.sh both      # Start both explicitly"
}

# Handle command line arguments
case "${1:-both}" in
    "backend")
        start_backend
        echo ""
        echo "✅ Backend started!"
        echo "🌐 API available at: http://localhost:8080"
        echo "🔍 Health check: http://localhost:8080/health"
        echo ""
        echo "Press Ctrl+C to stop..."
        wait $BACKEND_PID
        ;;
    "frontend")
        start_frontend
        echo ""
        echo "✅ Frontend started!"
        echo "🌐 App available at: http://localhost:3000"
        echo ""
        echo "Press Ctrl+C to stop..."
        wait $FRONTEND_PID
        ;;
    "both")
        start_backend
        sleep 3  # Give backend time to start
        start_frontend
        
        echo ""
        echo "✅ Both services started!"
        echo "🌐 Backend API: http://localhost:8080"
        echo "🌐 Frontend App: http://localhost:3000"
        echo "🔍 Health check: http://localhost:8080/health"
        echo ""
        echo "Press Ctrl+C to stop both services..."
        
        # Wait for either process to finish
        wait -n $BACKEND_PID $FRONTEND_PID
        
        # Kill remaining processes
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
        ;;
    "help"|"-h"|"--help")
        show_usage
        exit 0
        ;;
    *)
        echo "❌ Error: Unknown option '$1'"
        echo ""
        show_usage
        exit 1
        ;;
esac 