FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Prepare the build directory
RUN mkdir -p dist/public dist/server

# Build the frontend
RUN npm run build || (echo "Vite build failed!" && exit 1)

# Copy the frontend build to the public folder
RUN cp -r dist/client/* dist/public/ || true

# Manually transpile the server files with tsc
RUN npx tsc --allowJs --outDir dist/server --esModuleInterop --skipLibCheck --moduleResolution node --module NodeNext --target ES2020 server/*.ts shared/*.ts || true

# For debugging purposes
RUN ls -la dist || true
RUN find dist -type f | sort || true

# Expose port
EXPOSE 10000

# Use the simpler server script for Docker with explicit CommonJS extension
CMD ["node", "server-docker.cjs"]