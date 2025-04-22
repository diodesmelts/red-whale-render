FROM node:20-slim

WORKDIR /app

# Copy custom package.json for Docker
COPY package.docker.json ./package.json

# Install only the dependencies needed for production server
RUN npm install

# Copy source code
COPY . .

# Prepare the build directory
RUN mkdir -p dist/public dist/server

# Create a static public directory with a simple index.html
RUN mkdir -p dist/public
RUN echo "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>Blue Whale Competitions</title><script>window.location.href = '/api/health';</script></head><body><h1>Blue Whale Competitions</h1><p>Loading...</p></body></html>" > dist/public/index.html

# For debugging purposes
RUN ls -la dist || true
RUN find dist -type f | sort || true

# Expose port
EXPOSE 10000

# Use the simpler server script for Docker with explicit CommonJS extension
CMD ["node", "server-docker.cjs"]