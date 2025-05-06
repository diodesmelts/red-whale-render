#!/bin/bash

# Deploy to production with enhanced error handling and stability fixes
# This script builds and deploys the application with improved error handling,
# reduced log verbosity, and production optimization.

set -e

echo "🔧 Starting production deployment with enhanced stability fixes..."

# Ensure we're on the main branch
git checkout main

# Add production fixes
echo "📦 Ensuring production fixes are included..."
git add production-fix-docker.cjs
git add Dockerfile
git add server/middleware/api-monitoring.ts

# Commit if there are changes
git diff --quiet && git diff --staged --quiet || git commit -m "Add production stability and error handling improvements"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

# Push to production (adjust based on your deployment method)
if [ -n "$RENDER_API_KEY" ]; then
  echo "🔄 Triggering Render deployment..."
  curl -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json"
  echo "✅ Deployment triggered on Render!"
else
  echo "⚠️ No Render API key found. Please deploy manually."
fi

echo "✅ Deployment complete!"
echo "🔍 Monitor your deployment at: https://dashboard.render.com/web/$RENDER_SERVICE_ID"