#!/bin/bash

# Admin authentication fix deployment script
echo "🔧 Preparing admin auth fix for production..."

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
echo "3. Add or update the following environment variables:"
echo "   - ADMIN_PASSWORD: Set this to your desired admin password"
echo "4. Click 'Manual Deploy' and select 'Deploy latest commit'"
echo "5. Wait for the build and deployment to complete"
echo ""
echo "⚠️ IMPORTANT: After deployment, run this command on the server:"
echo "   node reset-admin-password.js"
echo ""
echo "You can do this by:"
echo "1. SSH into your Render instance"
echo "2. Run: cd /app && node reset-admin-password.js"
echo "   (or set ADMIN_PASSWORD as an environment variable before running)"
echo ""
echo "This will reset the admin password to match your ADMIN_PASSWORD"
echo "environment variable. You should then be able to log in with:"
echo "- Username: admin"
echo "- Password: [value from ADMIN_PASSWORD]"
echo ""