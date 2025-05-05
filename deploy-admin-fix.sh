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
echo "   - ADMIN_PASSWORD: Set this to your desired admin password (e.g., MobyAdmin2023!)"
echo "   - UPDATE_ADMIN_PASSWORD: Set to 'true' to force an update of the admin password"
echo "4. Click 'Manual Deploy' and select 'Deploy latest commit'"
echo "5. Wait for the build and deployment to complete"
echo ""
echo "⚠️ IMPORTANT: After deployment, run one of these diagnostic scripts on the server:"
echo ""
echo "Option 1 - Run full diagnostic (recommended):"
echo "   node auth-diagnostic.cjs"
echo ""
echo "Option 2 - Reset admin password directly:" 
echo "   node reset-admin-password.cjs"
echo ""
echo "You can do this by:"
echo "1. SSH into your Render instance"
echo "2. Run: cd /app && node auth-diagnostic.cjs"
echo ""
echo "The diagnostic script will:"
echo "- Check your environment variables and database connection"
echo "- Validate the admin user exists in the database"
echo "- Test if the admin password is valid"
echo "- Update the admin password if UPDATE_ADMIN_PASSWORD=true"
echo ""
echo "After running the script, you should be able to log in with:"
echo "- Username: admin"
echo "- Password: [value from ADMIN_PASSWORD]"
echo ""
echo "Additional troubleshooting tips:"
echo "- If login still fails, try running: node hash-password.cjs YourPassword"
echo "  Then set ADMIN_PASSWORD_HASH to the generated hash value"
echo "- Clear your browser cookies and cache before testing the login again"
echo ""