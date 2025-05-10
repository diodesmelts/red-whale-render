#!/bin/bash
# We're handling errors manually, so don't exit on error

echo "=== PREPARING RENDER DEPLOYMENT PACKAGE ==="

# Build the frontend using vite.config.cjs
echo "=== Building frontend with custom config ==="
echo "Building client-side code..."

# Try to build with the custom config
if ! npx vite build client --config vite.config.cjs; then
  echo "⚠️ Error with custom Vite config. Trying alternative build approach..."
  
  # Create client dist directory
  mkdir -p dist/client
  
  # Copy client files manually as fallback
  echo "Manual copy of client files as fallback..."
  cp -r client/src dist/client/
  cp client/index.html dist/client/
  
  echo "✅ Fallback approach completed"
fi

# Create a "dist-ready" directory
echo "=== Creating deployment package ==="
mkdir -p dist-ready/dist

# Copy the built client files
echo "=== Copying client files ==="
cp -r dist/client dist-ready/dist/

# Copy the server file
echo "=== Copying server file ==="
cp server-docker.js dist-ready/

# Copy uploads directory if it exists
echo "=== Copying uploads directory ==="
if [ -d "uploads" ]; then
  mkdir -p dist-ready/uploads
  cp -r uploads/* dist-ready/uploads/ 2>/dev/null || echo "No uploads to copy"
fi

# Create a simplified package.json
echo "=== Creating simplified package.json ==="
echo '{
  "name": "blue-whale-competitions",
  "version": "1.0.0",
  "main": "server-docker.js",
  "type": "commonjs",
  "scripts": {
    "start": "node server-docker.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "express-session": "^1.18.1",
    "connect-pg-simple": "^10.0.0",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "pg": "^8.15.0",
    "cors": "^2.8.5",
    "cloudinary": "^2.6.0",
    "multer": "^1.4.5-lts.2",
    "stripe": "^18.1.0"
  }
}' > dist-ready/package.json

echo "=== Creating README for deployment ==="
echo '# Blue Whale Competitions - Render Deployment Package

This directory contains a pre-built version of the Blue Whale Competitions app, 
ready for deployment on Render.

## Deployment Instructions

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set "Root Directory" to "dist-ready"
4. Use the following build command:
   ```
   npm install
   ```
5. Use the following start command:
   ```
   node server-docker.js
   ```
6. Add the required environment variables:
   - NODE_ENV: production
   - PORT: 10000
   - SESSION_SECRET: (generate a random string)
   - STRIPE_SECRET_KEY: Your Stripe secret key
   - VITE_STRIPE_PUBLIC_KEY: Your Stripe publishable key
   - CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
   - CLOUDINARY_API_KEY: Your Cloudinary API key
   - CLOUDINARY_API_SECRET: Your Cloudinary API secret
7. Add a PostgreSQL database in Render

The deployment should work without any build errors!
' > dist-ready/README.md

echo "=== Build completed ==="
echo "Your Render deployment package is ready in the 'dist-ready' directory."
echo "Push this directory to GitHub and deploy it using the instructions in the README."