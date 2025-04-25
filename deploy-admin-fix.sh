#!/bin/bash

# Admin endpoints fix deployment script
echo "🔧 Preparing admin routes fix for production..."

# Make script executable
chmod +x deploy-to-github.sh

# Execute GitHub deployment
echo "🚀 Deploying changes to GitHub repository..."
./deploy-to-github.sh

# Display success message and instructions
echo ""
echo "✅ Code changes have been pushed to GitHub."
echo ""
echo "🛠️ To apply these changes to your production environment:"
echo ""
echo "1. Log in to your Render dashboard"
echo "2. Go to the 'RedWhale' web service"
echo "3. Click 'Manual Deploy' and select 'Deploy latest commit'"
echo "4. Wait for the build and deployment to complete"
echo ""
echo "These changes add the missing admin routes to your production Docker deployment,"
echo "which should fix the issues with deleting competitions in the admin panel."
echo ""
echo "🧪 After deployment, test the following functions in production:"
echo "- Deleting individual competitions via the admin panel"
echo "- Using the 'Reset All Competitions' button"
echo ""
echo "If issues persist, additional debugging may be required."