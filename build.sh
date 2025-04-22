#!/bin/bash
set -ex  # Exit immediately if a command exits with a non-zero status and print commands

echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Prepare the output directory
echo "Preparing output directory..."
rm -rf dist
mkdir -p dist/public

# Use compiled JS approach to avoid TypeScript transform issues
echo "Transpiling TypeScript files with tsc..."
npx tsc --project tsconfig.json --outDir dist/tmp

# Build the frontend with Vite
echo "Building frontend with Vite..."
VITE_API_URL=${RENDER_EXTERNAL_URL} npx vite build --outDir dist/public

# Move server files
echo "Moving server files..."
cp -r dist/tmp/server/* dist/
rm -rf dist/tmp

echo "Build completed successfully!"