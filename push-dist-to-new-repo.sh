#!/bin/bash
# Script to push the dist-ready directory to a new GitHub repository

# Configuration - CHANGE THESE VARIABLES
GITHUB_USERNAME="your-github-username"
NEW_REPO_NAME="redwhale-render"
REPO_URL="https://github.com/$GITHUB_USERNAME/$NEW_REPO_NAME.git"
COMMIT_MESSAGE="Initial commit of pre-built Render deployment package"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Pushing dist-ready to new GitHub repository ===${NC}"

# Check if dist-ready directory exists
if [ ! -d "dist-ready" ]; then
  echo -e "${RED}Error: dist-ready directory does not exist. Please run the Render deployment preparation first.${NC}"
  exit 1
fi

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Created temporary directory: ${TEMP_DIR}${NC}"

# Copy dist-ready contents to the temporary directory
echo -e "${YELLOW}Copying dist-ready contents...${NC}"
cp -r dist-ready/* $TEMP_DIR/
cp -r dist-ready/.* $TEMP_DIR/ 2>/dev/null || true

# Initialize git in the temporary directory
echo -e "${YELLOW}Initializing git repository...${NC}"
cd $TEMP_DIR
git init

# Add all files to git
echo -e "${YELLOW}Adding all files to git...${NC}"
git add .
git status

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE"

# Create main branch (for newer git versions that use 'main' instead of 'master')
echo -e "${YELLOW}Creating main branch...${NC}"
git branch -M main

echo -e "${GREEN}=== Ready to push to GitHub ===${NC}"
echo -e "Before pushing, please create a new empty repository named ${BLUE}${NEW_REPO_NAME}${NC} on GitHub:"
echo -e "${BLUE}https://github.com/new${NC}"
echo -e "${YELLOW}IMPORTANT: Make sure it's completely empty (no README, .gitignore, or license).${NC}\n"

echo -e "Then run the following command to push to GitHub:"
echo -e "${BLUE}cd ${TEMP_DIR} && git remote add origin ${REPO_URL} && git push -u origin main${NC}"
echo -e "\nOr if you want to use SSH instead:"
echo -e "${BLUE}cd ${TEMP_DIR} && git remote add origin git@github.com:${GITHUB_USERNAME}/${NEW_REPO_NAME}.git && git push -u origin main${NC}"