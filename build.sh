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

# Compile server to CommonJS first
echo "Compiling server to CommonJS..."
npx tsc --project tsconfig.build.json

# Build the frontend with Vite
echo "Building frontend with Vite..."
npm run build

# Copy vite assets to public folder
echo "Moving frontend assets..."
cp -r dist/client/* dist/public/

echo "Build completed successfully!"