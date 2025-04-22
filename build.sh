#!/bin/bash

# Install dependencies
npm install

# Build the frontend
echo "Building Vite frontend..."
npm run build

# Make the script executable
chmod +x build.sh

echo "Build completed successfully!"