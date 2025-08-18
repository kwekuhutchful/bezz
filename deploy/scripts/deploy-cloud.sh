#!/bin/bash

set -e

echo "🚀 Starting Bezz deployment to Google Cloud..."

# Get the project root directory (assuming script is in deploy/scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Set variables
PROJECT_ID="bezz-777eb"
PROJECT_NUMBER="981046325818"
REGION="us-central1"
BACKEND_IMAGE="gcr.io/$PROJECT_ID/bezz-backend"
FRONTEND_IMAGE="gcr.io/$PROJECT_ID/bezz-frontend"

# Set project
gcloud config set project $PROJECT_ID

echo "📦 Building and pushing backend image..."
# Build and push backend
cd "$PROJECT_ROOT"
docker build -t $BACKEND_IMAGE:latest -f backend/Dockerfile backend/
docker push $BACKEND_IMAGE:latest

echo "📦 Building and pushing frontend image..."
# Build and push frontend
docker build -t $FRONTEND_IMAGE:latest -f frontend/Dockerfile frontend/
docker push $FRONTEND_IMAGE:latest

echo "🚀 Deploying backend to Cloud Run..."
# Deploy backend
gcloud run services replace deploy/backend/deploy-backend.yaml --region=$REGION

# Set public access permissions for backend
gcloud run services add-iam-policy-binding bezz-backend --region=$REGION --member="allUsers" --role="roles/run.invoker"

echo "🚀 Deploying frontend to Cloud Run..."
# Deploy frontend
gcloud run services replace deploy/frontend/deploy-frontend.yaml --region=$REGION

# Set public access permissions for frontend
gcloud run services add-iam-policy-binding bezz-frontend --region=$REGION --member="allUsers" --role="roles/run.invoker"

echo "🔗 Getting service URLs..."
BACKEND_URL=$(gcloud run services describe bezz-backend --region=$REGION --format="value(status.url)")
FRONTEND_URL=$(gcloud run services describe bezz-frontend --region=$REGION --format="value(status.url)")

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Service URLs:"
echo "   Backend:  $BACKEND_URL"
echo "   Frontend: $FRONTEND_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend to use the backend URL: $BACKEND_URL"
echo "2. Configure CORS origins in production config to include: $FRONTEND_URL"
echo "3. Set up custom domain and SSL certificates if needed"
echo "" 