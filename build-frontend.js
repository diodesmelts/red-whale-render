#!/usr/bin/env node

// Simple frontend build script for Vercel deployment
const { execSync } = require('child_process');

console.log('Building frontend only...');
execSync('npm run build', { stdio: 'inherit' });
console.log('Frontend build complete!');