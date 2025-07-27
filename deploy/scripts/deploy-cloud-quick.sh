#!/bin/bash

set -e

echo "⚡ Quick deployment to Google Cloud..."

# Get the project root directory (assuming script is in deploy/scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Set variables
PROJECT_ID="bezz-777eb"
PROJECT_NUMBER="981046325818"
REGION="us-central1"

# Check which service to deploy
SERVICE=${1:-both}

# Set project
gcloud config set project $PROJECT_ID

cd "$PROJECT_ROOT"

if [ "$SERVICE" = "backend" ] || [ "$SERVICE" = "both" ]; then
    echo "📦 Building and deploying backend..."
    BACKEND_IMAGE="gcr.io/$PROJECT_ID/bezz-backend"
    docker build -t $BACKEND_IMAGE:latest -f backend/Dockerfile backend/
    docker push $BACKEND_IMAGE:latest
    gcloud run services replace deploy/backend/deploy-backend.yaml --region=$REGION
    echo "✅ Backend deployed!"
fi

if [ "$SERVICE" = "frontend" ] || [ "$SERVICE" = "both" ]; then
    echo "📦 Building and deploying frontend..."
    FRONTEND_IMAGE="gcr.io/$PROJECT_ID/bezz-frontend"
    docker build -t $FRONTEND_IMAGE:latest -f frontend/Dockerfile frontend/
    docker push $FRONTEND_IMAGE:latest
    gcloud run services replace deploy/frontend/deploy-frontend.yaml --region=$REGION
    echo "✅ Frontend deployed!"
fi

echo ""
echo "🔗 Service URLs:"
if [ "$SERVICE" = "backend" ] || [ "$SERVICE" = "both" ]; then
    BACKEND_URL=$(gcloud run services describe bezz-backend --region=$REGION --format="value(status.url)")
    echo "   Backend:  $BACKEND_URL"
fi
if [ "$SERVICE" = "frontend" ] || [ "$SERVICE" = "both" ]; then
    FRONTEND_URL=$(gcloud run services describe bezz-frontend --region=$REGION --format="value(status.url)")
    echo "   Frontend: $FRONTEND_URL"
fi
echo ""
echo "Usage: ./deploy/scripts/deploy-cloud-quick.sh [backend|frontend|both]" 