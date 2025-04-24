#!/bin/bash

# Deploy and reset script for Blue Whale Competitions
# This script will deploy your changes to GitHub and reset the competitions on Render

# Step 1: Push changes to GitHub
echo "🚀 Pushing changes to GitHub..."
./deploy-to-github.sh

# Step 2: Wait for Render to pick up the changes (approximately)
echo "⏳ Waiting for Render to start the deployment (60 seconds)..."
sleep 60

# Step 3: Explain how to run the database reset on Render
echo ""
echo "====================================================================="
echo "🧹 RESET INSTRUCTIONS FOR RENDER 🧹"
echo "====================================================================="
echo ""
echo "To reset the competitions in your Render deployment:"
echo ""
echo "1. Log in to your Render dashboard: https://dashboard.render.com"
echo "2. Go to your 'RedWhale' web service"
echo "3. Click on 'Shell' in the left navigation"
echo "4. Run the following command to reset the competitions:"
echo ""
echo "   node render-reset-competitions.cjs"
echo ""
echo "5. Wait for the script to complete - you should see:"
echo "   '✅ Database reset completed successfully!'"
echo ""
echo "6. Verify that all counts show zero:"
echo "   - Competitions: 0"
echo "   - Entries: 0"
echo "   - Winners: 0"
echo ""
echo "7. Refresh your Render deployed site - the competitions should be gone"
echo ""
echo "====================================================================="
echo ""
echo "✅ Deployment process complete!"