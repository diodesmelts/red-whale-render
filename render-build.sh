#!/bin/bash

# Install ALL dependencies (including dev dependencies which are needed for the build)
npm install --include=dev

# Force install specific packages that might be missing for the build
npm install @vitejs/plugin-react @tailwindcss/typography tailwindcss postcss autoprefixer

# Build the client
npm run build

# Ensure server-docker.js is executable
chmod +x server-docker.js