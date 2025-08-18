#!/bin/bash

set -e

echo "⚡ Deploying to Google Cloud using Cloud Build..."

# Set variables
PROJECT_ID="bezz-777eb"
REGION="us-central1"

# Check which service to deploy
SERVICE=${1:-both}

if [ "$SERVICE" = "backend" ] || [ "$SERVICE" = "both" ]; then
    echo "📦 Building and deploying backend with Cloud Build..."
    BACKEND_IMAGE="gcr.io/$PROJECT_ID/bezz-backend"
    
    # Use Cloud Build to build and push the image
    gcloud builds submit backend/ \
        --tag $BACKEND_IMAGE:latest \
        --project=$PROJECT_ID
    
    # Deploy to Cloud Run
    gcloud run services replace deploy/backend/deploy-backend.yaml --region=$REGION
    
    # Set public access permissions
    gcloud run services add-iam-policy-binding bezz-backend --region=$REGION --member="allUsers" --role="roles/run.invoker"
    echo "✅ Backend deployed!"
fi

if [ "$SERVICE" = "frontend" ] || [ "$SERVICE" = "both" ]; then
    echo "📦 Building and deploying frontend with Cloud Build..."
    FRONTEND_IMAGE="gcr.io/$PROJECT_ID/bezz-frontend"
    
    # Use Cloud Build to build and push the image
    gcloud builds submit frontend/ \
        --tag $FRONTEND_IMAGE:latest \
        --project=$PROJECT_ID
    
    # Deploy to Cloud Run
    gcloud run services replace deploy/frontend/deploy-frontend.yaml --region=$REGION
    
    # Set public access permissions
    gcloud run services add-iam-policy-binding bezz-frontend --region=$REGION --member="allUsers" --role="roles/run.invoker"
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
echo "Usage: ./deploy-cloud-build.sh [backend|frontend|both]" 