#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "=== Starting Render Deployment Process ==="

# Install dev dependencies explicitly
echo "=== Installing Development Dependencies ==="
npm install --save-dev @vitejs/plugin-react @tailwindcss/typography tailwindcss postcss autoprefixer vite esbuild typescript tsx @types/react

# Install regular dependencies
echo "=== Installing Production Dependencies ==="
npm install

echo "=== All dependencies installed successfully ==="