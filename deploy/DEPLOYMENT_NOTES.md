# Bezz Deployment Notes & Lessons Learned

## 🎯 Production URLs (Current)
- **Frontend**: https://bezz-frontend-981046325818.us-central1.run.app
- **Backend**: https://bezz-backend-981046325818.us-central1.run.app

## 🚨 Critical Deployment Requirements

### 1. Region Specification
**ALWAYS deploy to `us-central1`** to get the correct URL format:
```bash
--region=us-central1
```

**Expected URL Pattern**: `https://servicename-981046325818.us-central1.run.app`
**Wrong URL Pattern**: `https://servicename-2us4ilrkuq-uc.a.run.app`

### 2. Public Access Permissions
After each deployment, services need public access:
```bash
gcloud run services add-iam-policy-binding bezz-backend --region=us-central1 --member="allUsers" --role="roles/run.invoker"
gcloud run services add-iam-policy-binding bezz-frontend --region=us-central1 --member="allUsers" --role="roles/run.invoker"
```

### 3. CORS Configuration
- **Location**: `backend/internal/config/config.go` line 87
- **Current Value**: `https://bezz-frontend-981046325818.us-central1.run.app`
- **Important**: Update this if frontend URL changes

## 🔄 Deployment Process

### Step-by-Step Deployment
1. **Commit and Push Changes**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Deploy Using Cloud Build**:
   ```bash
   ./deploy/scripts/deploy-cloud-build.sh both
   ```

3. **Verify Services**:
   ```bash
   curl -I https://bezz-frontend-981046325818.us-central1.run.app
   curl -s https://bezz-backend-981046325818.us-central1.run.app/health
   ```

### If Services Get Wrong URLs
If you get URLs like `*-2us4ilrkuq-uc.a.run.app`:

1. **Delete Services**:
   ```bash
   gcloud run services delete bezz-backend --region=us-central1 --quiet
   gcloud run services delete bezz-frontend --region=us-central1 --quiet
   ```

2. **Redeploy**:
   ```bash
   gcloud run services replace deploy/backend/deploy-backend.yaml --region=us-central1
   gcloud run services replace deploy/frontend/deploy-frontend.yaml --region=us-central1
   ```

3. **Add Public Access** (see commands above)

## 🛠️ Project Configuration

### Google Cloud Settings
- **Project ID**: bezz-777eb
- **Project Number**: 981046325818
- **Region**: us-central1
- **Authentication**: SSH with kwekuhutchful@gmail.com

### Git Configuration
```bash
git config user.email kwekuhutchful@gmail.com
git config user.name kwekuhutchful
```

### SSH Setup
- **Key**: `~/.ssh/id_ed25519_personal`
- **Config**: `~/.ssh/config` with GitHub host configuration

## 🔍 Troubleshooting Common Issues

### CORS Errors
**Symptoms**: "Origin is not allowed by Access-Control-Allow-Origin"
**Solution**: Check CORS configuration in `backend/internal/config/config.go` line 87

### 403 Forbidden Errors
**Symptoms**: Services return 403 when accessed
**Solution**: Add public access permissions (see commands above)

### Wrong URL Format
**Symptoms**: URLs like `*-2us4ilrkuq-uc.a.run.app`
**Solution**: Delete and redeploy services to us-central1 region

### Frontend Not Loading
**Symptoms**: Frontend shows loading errors or blank page
**Checklist**:
1. Verify frontend URL returns HTTP 200
2. Check backend health endpoint
3. Verify CORS configuration
4. Check browser console for JavaScript errors

## 📋 Pre-Deployment Checklist

- [ ] All changes committed and pushed to GitHub
- [ ] Google Cloud authenticated with correct account
- [ ] Project set to `bezz-777eb`
- [ ] Region set to `us-central1`
- [ ] CORS origins updated if frontend URL changed
- [ ] Secrets updated in Secret Manager if needed

## 🎯 Post-Deployment Verification

- [ ] Frontend loads at expected URL
- [ ] Backend health check responds
- [ ] Login functionality works (no CORS errors)
- [ ] API calls succeed from frontend to backend
- [ ] Services have public access permissions

## 🔄 Future Improvements

### Automation Opportunities
1. **Auto-set Public Permissions**: Already added to deploy-cloud-build.sh
2. **Environment-based CORS**: Consider making CORS origins configurable via environment variables
3. **Health Checks**: Add automated health checks post-deployment
4. **URL Validation**: Add checks to ensure correct URL format

### Monitoring Setup
```bash
# Check service status
gcloud run services list --region=us-central1

# Monitor logs in real-time
gcloud run services logs tail bezz-backend --region=us-central1
gcloud run services logs tail bezz-frontend --region=us-central1
```
