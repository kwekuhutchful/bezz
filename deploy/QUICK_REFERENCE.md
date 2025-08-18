# Bezz Deployment Quick Reference

## 🚀 Script Categories

### ☁️  Cloud Deployment (Production)
| Script | Purpose | When to Use |
|--------|---------|-------------|
| `setup-cloud.sh` | 🔧 Initial cloud setup | **First time only** - Creates service account, secrets, permissions |
| `deploy-cloud.sh` | 🚀 Full deployment | **Code changes** - Builds images and deploys both services |
| `deploy-cloud-quick.sh` | ⚡ Quick deployment | **Config changes** - Uses existing images |
| `deploy-cloud-build.sh` | 🏗️  Cloud Build | **CI/CD pipelines** - Uses Google Cloud Build |

### 💻 Local Development
| Script | Purpose | When to Use |
|--------|---------|-------------|
| `dev-local.sh` | 🔄 Full dev environment | **General development** - Starts both frontend & backend |
| `dev-backend.sh` | 🖥️  Backend only | **Backend development** - API work, database changes |
| `dev-frontend.sh` | 🎨 Frontend only | **Frontend development** - UI/UX work |

## 📝 Common Workflows

### 🏁 First Time Setup
```bash
# 1. Setup cloud environment
./deploy/scripts/setup-cloud.sh

# 2. Add your secrets
echo -n 'YOUR_FIREBASE_API_KEY' | gcloud secrets versions add firebase-api-key --data-file=-
echo -n 'YOUR_OPENAI_API_KEY' | gcloud secrets versions add openai-api-key --data-file=-

# 3. Deploy to production
./deploy/scripts/deploy-cloud.sh
```

### 🚀 Production Deployment
```bash
# Full deployment (after code changes)
./deploy/scripts/deploy-cloud.sh

# Quick deployment (config only)
./deploy/scripts/deploy-cloud-quick.sh

# Deploy specific service
./deploy/scripts/deploy-cloud-quick.sh backend
```

### 💻 Development
```bash
# Start everything locally
./deploy/scripts/dev-local.sh

# Work on backend only
./deploy/scripts/dev-backend.sh

# Work on frontend only  
./deploy/scripts/dev-frontend.sh
```

## 🔍 Quick Troubleshooting

**Cloud deployment fails?**
```bash
# Check service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bezz-backend" --limit=10 --project=bezz-777eb
```

**Local development not working?**
```bash
# Check backend health
curl http://localhost:8080/health

# Check frontend
curl http://localhost:3000
```

**Secret Manager issues?**
```bash
# Verify service account permissions
gcloud secrets get-iam-policy firebase-api-key --project=bezz-777eb
```

## 📊 Current Production Status

- **Frontend**: https://bezz-frontend-981046325818.us-central1.run.app
- **Backend**: https://bezz-backend-981046325818.us-central1.run.app
- **Region**: us-central1
- **Project ID**: bezz-777eb (Project Number: 981046325818)
- **Service Account**: `bezz-backend-sa@bezz-777eb.iam.gserviceaccount.com`
- **Secret Manager**: All secrets configured ✅
- **Firebase Admin SDK**: Working ✅

## 🚨 Important Deployment Notes

### URL Format & Region
- **CRITICAL**: Services must be deployed to `us-central1` to get the expected URL format
- **Expected URL Pattern**: `https://servicename-981046325818.us-central1.run.app`
- **Wrong URL Pattern**: `https://servicename-2us4ilrkuq-uc.a.run.app` (avoid this)

### Public Access Setup
After deployment, services need public access permissions:
```bash
gcloud run services add-iam-policy-binding bezz-backend --region=us-central1 --member="allUsers" --role="roles/run.invoker"
gcloud run services add-iam-policy-binding bezz-frontend --region=us-central1 --member="allUsers" --role="roles/run.invoker"
```

### CORS Configuration
- **Production CORS**: Hardcoded in `backend/internal/config/config.go` line 87
- **Current Frontend URL**: `https://bezz-frontend-981046325818.us-central1.run.app`
- **Update Required**: If frontend URL changes, update line 87 in config.go 