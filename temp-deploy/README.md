# Blue Whale Competitions - Render Deployment Package

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

