#!/bin/bash

# Simple deployment script for Render.com with production fixes
# This script pushes the direct production fixes to the main branch
# and triggers a deployment through Render's automated GitHub integration

set -e

echo "💡 Starting Render deployment preparation..."

# Ensure the direct fix file exists
if [ ! -f "production-direct-fix.cjs" ]; then
  echo "❌ Error: production-direct-fix.cjs not found!"
  exit 1
fi

# Ensure our Dockerfile exists
if [ ! -f "Dockerfile" ]; then
  echo "❌ Error: Dockerfile not found!"
  exit 1
fi

# Add all files to Git
echo "📦 Adding production fixes to Git..."
git add production-direct-fix.cjs Dockerfile 

# Commit changes (if any)
if ! git diff --cached --quiet; then
  git commit -m "Add direct production fixes for stable deployment"
fi

# Push to GitHub
echo "🚀 Pushing changes to GitHub main branch..."
git push origin main

echo "✅ Deployment preparation complete!"
echo ""
echo "🔍 Your changes have been pushed to GitHub."
echo "⏱️ Render should automatically start a new deployment."
echo "📊 Visit your Render dashboard to monitor the deployment progress."
echo ""