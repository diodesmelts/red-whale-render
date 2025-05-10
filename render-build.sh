#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting build process..."

# Install ALL dependencies (including dev dependencies which are needed for the build)
echo "Installing dependencies..."
npm install --include=dev

# Force install specific packages that might be missing for the build
echo "Installing build-specific packages..."
npm install --no-save @vitejs/plugin-react @tailwindcss/typography tailwindcss postcss autoprefixer vite esbuild

# Run Vite build directly
echo "Building client with Vite..."
./node_modules/.bin/vite build

# Build server with esbuild
echo "Building server with esbuild..."
./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Make sure server-docker.js exists
echo "Preparing server file..."
if [ ! -f server-docker.js ]; then
  echo "server-docker.js not found, creating it..."
  cp server-docker.cjs server-docker.js 2>/dev/null || cp server-docker.js.bak server-docker.js 2>/dev/null || echo "export * from './server/index.js';" > server-docker.js
fi

# Ensure server-docker.js is executable
chmod +x server-docker.js

echo "Build process completed successfully!"