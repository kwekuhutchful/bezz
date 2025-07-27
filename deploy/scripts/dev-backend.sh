#!/bin/bash

echo "🚀 Starting Bezz AI Backend"
echo "=========================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in project root"
    echo "Please create .env file first using ./setup-env.sh"
    exit 1
fi

# Check if service account file exists
if [ ! -f "backend/service-account.json" ]; then
    echo "❌ Error: backend/service-account.json not found"
    echo "Please add your Firebase service account key file"
    exit 1
fi

# Load environment variables
echo "📋 Loading environment variables..."
export $(cat .env | xargs)

# Set Google Cloud credentials path
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/backend/service-account.json"

# Verify critical environment variables
echo "✅ Environment loaded:"
echo "   Firebase Project: $FIREBASE_PROJECT_ID"
echo "   OpenAI Key: ${OPENAI_API_KEY:0:20}..."
echo "   GCS Bucket: $GCS_BUCKET_NAME"
echo ""

# Navigate to backend and start the server
echo "🏃 Starting Go server..."
cd backend

# Check if go.mod exists
if [ ! -f "go.mod" ]; then
    echo "❌ Error: go.mod not found in backend directory"
    exit 1
fi

# Start the backend
go run main.go 