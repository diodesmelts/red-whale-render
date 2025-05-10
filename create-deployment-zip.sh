#!/bin/bash
# Script to create a ZIP archive of the dist-ready directory for easy deployment

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Creating deployment package ===${NC}"

# Check if dist-ready directory exists
if [ ! -d "dist-ready" ]; then
  echo -e "${RED}Error: dist-ready directory does not exist. Please run the Render deployment preparation first.${NC}"
  exit 1
fi

# Create a ZIP archive of the dist-ready directory
echo -e "${YELLOW}Creating ZIP archive...${NC}"
zip -r render-deployment.zip dist-ready

echo -e "${GREEN}=== Success! ===${NC}"
echo -e "The deployment package has been created as ${BLUE}render-deployment.zip${NC}"
echo -e "You can download this file and extract it to deploy to Render."
echo -e "\n${YELLOW}Deployment Instructions:${NC}"
echo -e "1. Download the ${BLUE}render-deployment.zip${NC} file"
echo -e "2. Extract the ZIP file on your local computer"
echo -e "3. Push the contents of the dist-ready directory to GitHub"
echo -e "4. On Render, create a new Web Service pointing to your GitHub repository"
echo -e "5. Set the Build Command to: ${BLUE}npm install${NC}"
echo -e "6. Set the Start Command to: ${BLUE}node server-docker.js${NC}"
echo -e "7. Add your environment variables (DATABASE_URL, STRIPE keys, etc.)"
echo -e "8. Deploy!"