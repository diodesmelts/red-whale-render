#!/bin/bash

# Script to deploy changes to GitHub
echo "🚀 Starting GitHub deployment process..."

# Configuration
REPO_URL="https://github.com/diodesmelts/RedWhale.git"
BRANCH="main"
COMMIT_MESSAGE="Feature: Add Beauty category to competition platform

- Added Beauty category to COMPETITION_CATEGORIES with spa icon and rose color theme
- Updated CategoryBadge component to display Beauty category with proper styling
- Added Beauty category button to competition filter on competitions page
- Added Beauty category to competition dropdown menu in navigation
- Updated competition creation form to include Beauty as a category option
- Added Beauty category to footer section"

# Check if GitHub token is available
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ ERROR: GITHUB_TOKEN environment variable is not set."
  exit 1
fi

# Setup git credentials
git config --global user.name "Replit Deployment"
git config --global user.email "noreply@replit.com"

# Create credential helper
echo "https://${GITHUB_TOKEN}:x-oauth-basic@github.com" > ~/.git-credentials
git config --global credential.helper store

echo "✅ Git credentials configured"

# Check if we're in a git repository already
if [ -d .git ]; then
  echo "📂 Git repository already exists"
else
  echo "📂 Initializing git repository"
  git init
  git remote add origin $REPO_URL
fi

# Add all changed files
echo "⏳ Adding changed files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin $BRANCH

echo "✅ Deployment complete!"