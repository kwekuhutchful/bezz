# Bezz Deployment Scripts

This folder contains all deployment-related scripts and configurations organized by component.

## 📁 Folder Structure

```
deploy/
├── backend/                 # Backend deployment configurations
│   └── deploy-backend.yaml    # Cloud Run service definition for backend
├── frontend/               # Frontend deployment configurations  
│   └── deploy-frontend.yaml   # Cloud Run service definition for frontend
├── infrastructure/         # Infrastructure as code
│   └── docker-compose.yml     # Local development Docker setup
└── scripts/               # Deployment and setup scripts
    ├── setup-cloud.sh        # ☁️  Initial cloud environment setup
    ├── deploy-cloud.sh       # ☁️  Full production deployment
    ├── deploy-cloud-quick.sh # ☁️  Quick cloud deployment (no rebuild)
    ├── deploy-cloud-build.sh # ☁️  Cloud Build based deployment
    ├── dev-local.sh          # 💻 Start local development environment
    ├── dev-backend.sh        # 💻 Start backend only (local)
    └── dev-frontend.sh       # 💻 Start frontend only (local)
```

## 🚀 Quick Start

### 1. Initial Setup
```bash
# Run from project root
./deploy/scripts/setup-cloud.sh
```

This will:
- Create the dedicated service account (`bezz-backend-sa`)
- Set up all required IAM permissions
- Create Secret Manager secrets with placeholder values
- Configure Firebase Admin SDK permissions

### 2. Configure Secrets
Update each secret with your real values:

```bash
# Firebase
echo -n 'bezz-777eb' | gcloud secrets versions add firebase-project-id --data-file=-
echo -n 'YOUR_FIREBASE_WEB_API_KEY' | gcloud secrets versions add firebase-api-key --data-file=-

# OpenAI
echo -n 'YOUR_OPENAI_API_KEY' | gcloud secrets versions add openai-api-key --data-file=-

# Google Cloud Storage
echo -n 'YOUR_BUCKET_NAME' | gcloud secrets versions add gcs-bucket-name --data-file=-

# Stripe (optional)
echo -n 'YOUR_STRIPE_SECRET_KEY' | gcloud secrets versions add stripe-secret-key --data-file=-
echo -n 'YOUR_STRIPE_WEBHOOK_SECRET' | gcloud secrets versions add stripe-webhook-secret --data-file=-
```

### 3. Deploy
```bash
# Full deployment (builds and deploys both services)
./deploy/scripts/deploy-cloud.sh

# Quick deployment (uses existing images)
./deploy/scripts/deploy-cloud-quick.sh
```

## 🔧 Development

### Local Development
```bash
# Start full development environment
./deploy/scripts/dev-local.sh

# Start individual services
./deploy/scripts/dev-backend.sh    # Backend only
./deploy/scripts/dev-frontend.sh   # Frontend only
```

### Using Docker Compose
```bash
# Start with Docker Compose
docker-compose -f deploy/infrastructure/docker-compose.yml up
```

## 🏗️ Architecture Changes

### Security Improvements
- **Dedicated Service Account**: Uses `bezz-backend-sa@bezz-777eb.iam.gserviceaccount.com` instead of default compute account
- **Minimal Permissions**: Only grants necessary IAM roles
- **Secret Manager**: All sensitive data stored in Google Cloud Secret Manager
- **No Local Credentials**: Removed dependency on service account JSON files

### Service Account Permissions
The backend service account has these minimal required permissions:
- `roles/secretmanager.secretAccessor` - Access secrets
- `roles/firebase.sdkAdminServiceAgent` - Firebase Admin SDK operations
- `roles/firebaseauth.admin` - Firebase Authentication management
- `roles/storage.admin` - Cloud Storage access

### Environment Variables
- **Production**: `GOOGLE_CLOUD_PROJECT=981046325818` (project number)
- **Removed**: `GOOGLE_APPLICATION_CREDENTIALS` (caused auth conflicts)
- **Service Account**: Configured at Cloud Run service level

## 📋 Deployment Configurations

### Backend (`deploy/backend/deploy-backend.yaml`)
- **Service Account**: `bezz-backend-sa@bezz-777eb.iam.gserviceaccount.com`
- **Environment**: Production with project number
- **Resources**: 1000m CPU, 512Mi memory
- **Autoscaling**: Max 10 instances
- **Execution Environment**: Gen2

### Frontend (`deploy/frontend/deploy-frontend.yaml`)
- Standard Cloud Run configuration for React app
- Nginx serving static files
- HTTPS redirect and caching headers

## 🔍 Troubleshooting

### Common Issues

**Secret Manager Permission Denied**
```bash
# Verify service account has access
gcloud secrets get-iam-policy firebase-api-key --project=bezz-777eb
```

**Firebase Admin SDK Errors**
```bash
# Check service account permissions
gcloud projects get-iam-policy bezz-777eb --flatten="bindings[].members" --filter="bindings.members:bezz-backend-sa@bezz-777eb.iam.gserviceaccount.com"
```

**Deployment Failures**
```bash
# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bezz-backend" --limit=10 --project=bezz-777eb
```

### Log Analysis
```bash
# Real-time logs
gcloud beta run services logs tail bezz-backend --region=us-central1

# Historical logs with filters
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bezz-backend AND severity>=ERROR" --limit=20 --project=bezz-777eb
```

## 🔄 Migration from Old Setup

If migrating from the old setup:

1. **Remove old files**: Delete `.env` files and service account JSON files
2. **Run setup**: Execute `./deploy/scripts/setup-cloud.sh`
3. **Update secrets**: Add your real values to Secret Manager
4. **Deploy**: Use `./deploy/scripts/deploy-cloud.sh`

## 📚 Additional Resources

- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Cloud Run Service Account](https://cloud.google.com/run/docs/securing/service-identity)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [IAM Best Practices](https://cloud.google.com/iam/docs/using-iam-securely)

## ⚡ Scripts Reference

| Script | Purpose | Environment | Usage |
|--------|---------|-------------|-------|
| **☁️  CLOUD DEPLOYMENT** | | | |
| `setup-cloud.sh` | Initial environment setup | Cloud | One-time setup |
| `deploy-cloud.sh` | Full production deployment | Cloud | After code changes |
| `deploy-cloud-quick.sh` | Quick deployment | Cloud | Config-only changes |
| `deploy-cloud-build.sh` | Cloud Build deployment | Cloud | CI/CD pipelines |
| **💻 LOCAL DEVELOPMENT** | | | |
| `dev-local.sh` | Full development environment | Local | Development |
| `dev-backend.sh` | Backend only | Local | Backend development |
| `dev-frontend.sh` | Frontend only | Local | Frontend development | 