#!/bin/bash

echo "🚀 Setting up Bezz AI Environment"
echo "=================================="

# Create .env file
cat > .env << 'EOF'
# Firebase Configuration (Frontend)
VITE_FIREBASE_API_KEY=your_firebase_web_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here

# Firebase Configuration (Backend)
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_API_KEY=your_firebase_web_api_key_here

# OpenAI Configuration (Required for AI Pipeline)
OPENAI_API_KEY=your_openai_api_key_here

# Google Cloud Storage Configuration (Required for Image Generation)
GCS_BUCKET_NAME=your_gcs_bucket_name_here
GOOGLE_APPLICATION_CREDENTIALS=backend/service-account.json

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Development Configuration
NODE_ENV=development
PORT=8080
VITE_API_URL=http://localhost:8080
EOF

echo "✅ Created .env file"

echo ""
echo "📋 Next Steps - Complete Setup Guide:"
echo "======================================"
echo ""
echo "🔥 Firebase Setup:"
echo "   1. Go to https://console.firebase.google.com/"
echo "   2. Create a new project or use existing one"
echo "   3. Enable Authentication (Email/Password)"
echo "   4. Enable Firestore Database"
echo "   5. Go to Project Settings > General"
echo "      - Copy Project ID → FIREBASE_PROJECT_ID & VITE_FIREBASE_PROJECT_ID"
echo "      - Copy Web API Key → FIREBASE_API_KEY & VITE_FIREBASE_API_KEY"
echo "      - Copy Auth Domain → VITE_FIREBASE_AUTH_DOMAIN"
echo "   6. Go to Project Settings > Service Accounts"
echo "      - Generate new private key (save as backend/service-account.json)"
echo ""
echo "🤖 OpenAI Setup (Critical for AI Pipeline):"
echo "   1. Go to https://platform.openai.com/api-keys"
echo "   2. Create a new API key"
echo "   3. ⚠️  IMPORTANT: Add billing info for GPT-4 and DALL-E 3 access"
echo "   4. Copy API key → OPENAI_API_KEY"
echo "   5. Verify you have access to:"
echo "      - GPT-4 (for strategy generation)"
echo "      - DALL-E 3 (for image generation)"
echo ""
echo "☁️ Google Cloud Storage Setup (Required for Image Storage):"
echo "   1. Go to https://console.cloud.google.com/"
echo "   2. Select your Firebase project (or create new one)"
echo "   3. Enable Cloud Storage API"
echo "   4. Create a storage bucket:"
echo "      - Name: bezz-dev-assets-[your-name] (must be globally unique)"
echo "      - Location: Same region as Firebase project"
echo "      - Storage class: Standard"
echo "   5. Set bucket permissions:"
echo "      - Go to IAM & Admin > Service Accounts"
echo "      - Find your service account"
echo "      - Add 'Storage Admin' role"
echo "   6. Copy bucket name → GCS_BUCKET_NAME"
echo "   7. Ensure backend/service-account.json exists with proper permissions"
echo ""
echo "💳 Stripe Setup:"
echo "   1. Go to https://dashboard.stripe.com/"
echo "   2. Get your test API keys from Developers > API keys"
echo "   3. Copy Secret key → STRIPE_SECRET_KEY"
echo "   4. Set up webhook endpoint for local testing (optional for development)"
echo ""
echo "🧪 Testing Your Setup:"
echo "==============================="
echo ""
echo "1. Install dependencies:"
echo "   npm install"
echo ""
echo "2. Test backend with environment:"
echo "   cd backend"
echo "   export \$(cat ../.env | xargs)"
echo "   export GOOGLE_APPLICATION_CREDENTIALS=\"\$(pwd)/service-account.json\""
echo "   echo \"Testing environment...\""
echo "   echo \"OpenAI Key: \${OPENAI_API_KEY:0:20}...\""
echo "   echo \"GCS Bucket: \$GCS_BUCKET_NAME\""
echo "   echo \"Firebase Project: \$FIREBASE_PROJECT_ID\""
echo "   go run main.go"
echo ""
echo "3. Test AI Pipeline (after backend is running):"
echo "   curl -X POST http://localhost:8080/health"
echo ""
echo "4. Start full development environment:"
echo "   npm run dev"
echo ""
echo "🔍 Troubleshooting:"
echo "==================="
echo ""
echo "❌ If you get 'API key not valid' errors:"
echo "   - Verify OpenAI API key is correct"
echo "   - Check billing is enabled for GPT-4/DALL-E"
echo ""
echo "❌ If image generation fails:"
echo "   - Verify GCS bucket exists and is accessible"
echo "   - Check GOOGLE_APPLICATION_CREDENTIALS path"
echo "   - Ensure service account has Storage Admin role"
echo ""
echo "❌ If Firebase auth fails:"
echo "   - Verify all Firebase config variables match your project"
echo "   - Check service-account.json exists and is valid"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Full setup guide"
echo "   - documentation/ai-pipeline-technical-guide.md - AI pipeline details"
echo ""
echo "📝 Edit .env file now with your actual API keys!"
echo "⚠️  Never commit .env file to git - it contains secrets!" 