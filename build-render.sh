#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "*** RENDER DEPLOYMENT SPECIAL BUILD SCRIPT ***"

# Copy the special Render files to use for this build
echo "Copying Render-specific files..."
cp package-render.json package.json
cp server-render.js server.js

# Install dependencies first to ensure we have Vite
echo "Installing dependencies..."
npm install

# Build the client-side code
echo "Building client with Vite..."
mkdir -p dist/client
npx vite build --outDir dist/client

# Make sure the server.js file is executable
echo "Finalizing deployment..."
chmod +x server.js

echo "Build completed successfully!"