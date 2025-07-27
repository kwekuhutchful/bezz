#!/bin/bash

echo "🚀 Setting up Bezz AI Environment"
echo "=================================="

# Set variables
PROJECT_ID="bezz-777eb"
PROJECT_NUMBER="981046325818"
SERVICE_ACCOUNT_NAME="bezz-backend-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🔧 Setting up Google Cloud Project..."
gcloud config set project $PROJECT_ID

echo "🔑 Creating dedicated service account..."
echo "Creating service account: $SERVICE_ACCOUNT_EMAIL"
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL >/dev/null 2>&1; then
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="Bezz Backend Service Account" \
        --description="Dedicated service account for Bezz backend with minimal required permissions"
    echo "✅ Service account created"
else
    echo "✅ Service account already exists"
fi

echo "🔐 Setting up IAM permissions..."
echo "Granting Secret Manager access..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/secretmanager.secretAccessor"

echo "Granting Firebase Admin SDK permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/firebase.sdkAdminServiceAgent"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/firebaseauth.admin"

echo "Granting Cloud Storage access..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.admin"

echo "🔒 Setting up Secret Manager secrets..."
echo "Creating secrets (you'll need to add the actual values)..."

# Create secrets if they don't exist
secrets=("firebase-project-id" "firebase-api-key" "openai-api-key" "stripe-secret-key" "stripe-webhook-secret" "gcs-bucket-name")

for secret in "${secrets[@]}"; do
    if ! gcloud secrets describe $secret >/dev/null 2>&1; then
        echo "Creating secret: $secret"
        echo -n "placeholder-value" | gcloud secrets create $secret --data-file=-
        gcloud secrets add-iam-policy-binding $secret \
            --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
            --role="roles/secretmanager.secretAccessor"
    else
        echo "Secret $secret already exists"
        # Ensure our service account has access
        gcloud secrets add-iam-policy-binding $secret \
            --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
            --role="roles/secretmanager.secretAccessor" || true
    fi
done

echo ""
echo "✅ Environment setup completed!"
echo ""
echo "📋 Next Steps - Manual Configuration Required:"
echo "=============================================="
echo ""
echo "🔥 Firebase Setup:"
echo "   1. Go to https://console.firebase.google.com/"
echo "   2. Create a new project or use existing one: $PROJECT_ID"
echo "   3. Enable Authentication (Email/Password)"
echo "   4. Enable Firestore Database"
echo "   5. Get your Firebase Web API Key:"
echo "      - Project Settings > General > Web API Key"
echo "   6. Update secrets with real values:"
echo "      echo -n 'bezz-777eb' | gcloud secrets versions add firebase-project-id --data-file=-"
echo "      echo -n 'YOUR_FIREBASE_WEB_API_KEY' | gcloud secrets versions add firebase-api-key --data-file=-"
echo ""
echo "🤖 OpenAI Setup (Critical for AI Pipeline):"
echo "   1. Go to https://platform.openai.com/api-keys"
echo "   2. Create a new API key with GPT-4 and DALL-E 3 access"
echo "   3. ⚠️  IMPORTANT: Add billing info for GPT-4 and DALL-E 3 access"
echo "   4. Update secret:"
echo "      echo -n 'YOUR_OPENAI_API_KEY' | gcloud secrets versions add openai-api-key --data-file=-"
echo ""
echo "☁️ Google Cloud Storage Setup:"
echo "   1. Create a storage bucket for generated assets"
echo "   2. Update secret:"
echo "      echo -n 'YOUR_BUCKET_NAME' | gcloud secrets versions add gcs-bucket-name --data-file=-"
echo ""
echo "💳 Stripe Setup (Optional - for payments):"
echo "   1. Go to https://dashboard.stripe.com/apikeys"
echo "   2. Get your secret key and webhook secret"
echo "   3. Update secrets:"
echo "      echo -n 'YOUR_STRIPE_SECRET_KEY' | gcloud secrets versions add stripe-secret-key --data-file=-"
echo "      echo -n 'YOUR_STRIPE_WEBHOOK_SECRET' | gcloud secrets versions add stripe-webhook-secret --data-file=-"
echo ""
echo "🚀 Deployment:"
echo "   Run: ./deploy/scripts/deploy.sh"
echo ""
echo "🔧 Development:"
echo "   Run: ./deploy/scripts/start-dev.sh"
echo ""
echo "📊 Service Account Summary:"
echo "   Name: $SERVICE_ACCOUNT_EMAIL"
echo "   Permissions:"
echo "   - Secret Manager Secret Accessor"
echo "   - Firebase Admin SDK Service Agent"
echo "   - Firebase Auth Admin"
echo "   - Storage Admin"
echo "" 