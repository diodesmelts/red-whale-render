#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Create separate directory for the build
echo "Creating build directory structure..."
mkdir -p build_temp

# Build the frontend first
echo "Building frontend with Vite..."
npx vite build --outDir build_temp/public

# Build the server separately
echo "Building server with esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=build_temp

# Move everything to dist
echo "Moving built files to dist..."
mkdir -p dist
cp -r build_temp/public dist/
cp build_temp/index.js dist/

echo "Build completed successfully!"