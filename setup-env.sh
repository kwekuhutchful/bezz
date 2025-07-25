#!/bin/bash

echo "🚀 Setting up Bezz AI Environment"
echo "=================================="

# Create .env file
cat > .env << 'EOF'
# Firebase Configuration (Backend Only)
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_API_KEY=your_firebase_web_api_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Google Cloud Storage
GCS_BUCKET_NAME=your_gcs_bucket_name_here

# Development Configuration
NODE_ENV=development
PORT=8080
VITE_API_URL=http://localhost:8080
EOF

echo "✅ Created .env file"

echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file with your actual API keys"
echo "2. Set up required services:"
echo ""
echo "🔥 Firebase Setup (Backend Only):"
echo "   - Go to https://console.firebase.google.com/"
echo "   - Create a new project or use existing one"
echo "   - Enable Authentication (Email/Password)"
echo "   - Enable Firestore Database"
echo "   - Go to Project Settings > Service Accounts"
echo "   - Generate new private key (save as backend/service-account.json)"
echo "   - Copy Project ID to FIREBASE_PROJECT_ID in .env"
echo ""
echo "🤖 OpenAI Setup:"
echo "   - Go to https://platform.openai.com/api-keys"
echo "   - Create a new API key"
echo "   - Add billing information for GPT-4 and DALL-E access"
echo ""
echo "💳 Stripe Setup:"
echo "   - Go to https://dashboard.stripe.com/"
echo "   - Get your test API keys from Developers > API keys"
echo "   - Set up webhook endpoint for local testing"
echo ""
echo "☁️ Google Cloud Setup:"
echo "   - Go to https://console.cloud.google.com/"
echo "   - Create a new project or use existing one"
echo "   - Enable Cloud Storage API"
echo "   - Create a storage bucket"
echo "   - Download service account key (save as backend/service-account.json)"
echo ""
echo "🔧 To install dependencies and start development:"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "📝 Edit .env file now with your API keys!" 