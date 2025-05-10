#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "=== STANDALONE BUILD SCRIPT FOR RENDER ==="

# Install basic dependencies without relying on package.json
echo "=== Installing core dependencies ==="
npm install express express-session connect-pg-simple passport passport-local pg cors cloudinary multer stripe

# Install only the essential build tools
echo "=== Installing build tools ==="
npm install --no-save esbuild

# Create a basic client build directory
echo "=== Setting up client files ==="
mkdir -p dist/client

# Copy pre-built client files (consider pre-building and pushing to repo)
echo "=== Copying client files ==="
cp -r client/* dist/client/ 2>/dev/null || echo "No client files to copy"

# Build a simplified server
echo "=== Building server ==="
npx esbuild server/index.ts --bundle --platform=node --packages=external --outfile=dist/server.js || echo "Server build failed, will use server-docker.js"

# Make sure we have a server file to run
echo "=== Preparing server file ==="
if [ -f "server-docker.js" ]; then
  echo "Using server-docker.js"
  chmod +x server-docker.js
elif [ -f "dist/server.js" ]; then
  echo "Using built server.js"
  chmod +x dist/server.js
  cp dist/server.js server.js
else
  echo "ERROR: No server file found!"
  exit 1
fi

echo "=== Build completed ==="