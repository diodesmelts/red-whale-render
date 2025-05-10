#!/bin/bash
# Script to push the dist-ready directory to a new branch in the existing repository

# Configuration
BRANCH_NAME="render-ready"
COMMIT_MESSAGE="Pre-built package ready for Render deployment"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Pushing dist-ready to '${BRANCH_NAME}' branch ===${NC}"

# Check if we are in a git repository
if [ ! -d ".git" ]; then
  echo -e "${RED}Error: Not in a git repository. Please run this script from the root of your project.${NC}"
  exit 1
fi

# Check if dist-ready directory exists
if [ ! -d "dist-ready" ]; then
  echo -e "${RED}Error: dist-ready directory does not exist. Please run the Render deployment preparation first.${NC}"
  exit 1
fi

# Create a new orphan branch (no history)
echo -e "${YELLOW}Creating new orphan branch '${BRANCH_NAME}'...${NC}"
git checkout --orphan $BRANCH_NAME

# Remove all files from the working directory
echo -e "${YELLOW}Cleaning working directory...${NC}"
git rm -rf .

# Move all files from dist-ready to the root
echo -e "${YELLOW}Moving dist-ready files to root...${NC}"
cp -r dist-ready/* .
cp -r dist-ready/.* . 2>/dev/null || true

# Add and commit all files
echo -e "${YELLOW}Adding all files to git...${NC}"
git add .
git status

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "$COMMIT_MESSAGE"

echo -e "${GREEN}=== Success! ===${NC}"
echo -e "The dist-ready directory has been pushed to the '${BRANCH_NAME}' branch."
echo -e "To push this branch to GitHub, run: ${BLUE}git push -f origin ${BRANCH_NAME}${NC}"
echo -e "${YELLOW}Note: Remember to switch back to your main branch when done:${NC} ${BLUE}git checkout main${NC}"