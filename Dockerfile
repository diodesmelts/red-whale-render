FROM node:20-slim AS builder

WORKDIR /app

# Copy package files for dependencies
COPY package.json package-lock.json ./

# Install all dependencies for building
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Start a new stage for the production image
FROM node:20-slim

WORKDIR /app

# Copy custom package.json for Docker (server only)
COPY package.docker.json ./package.json

# Install only the dependencies needed for production server
RUN npm install

# Copy the built frontend from the builder stage
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server-docker.cjs .

# Prepare the build directory
RUN mkdir -p dist/public dist/server

# Create a static public directory for static assets
RUN mkdir -p dist/public/images

# Create uploads directory for file storage (needed for image uploads fallback)
RUN mkdir -p uploads
RUN chmod 777 uploads

# Create a few placeholder images for competitions
RUN echo '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#0099cc"/><text x="150" y="100" font-family="Arial" font-size="24" text-anchor="middle" fill="white">Air Fryer</text></svg>' > dist/public/images/air-fryer.jpg
RUN echo '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#202060"/><text x="150" y="100" font-family="Arial" font-size="24" text-anchor="middle" fill="white">PlayStation 5</text></svg>' > dist/public/images/ps5.jpg
RUN echo '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#3f71e9"/><text x="150" y="100" font-family="Arial" font-size="24" text-anchor="middle" fill="white">MacBook Pro</text></svg>' > dist/public/images/macbook.jpg
RUN echo '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#34a853"/><text x="150" y="100" font-family="Arial" font-size="24" text-anchor="middle" fill="white">Paris Weekend</text></svg>' > dist/public/images/paris.jpg
RUN echo '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#1db954"/><text x="150" y="100" font-family="Arial" font-size="24" text-anchor="middle" fill="white">Cash Prize</text></svg>' > dist/public/images/cash.jpg
RUN echo '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#cccccc"/><text x="150" y="100" font-family="Arial" font-size="24" text-anchor="middle" fill="white">Placeholder</text></svg>' > dist/public/images/placeholder.jpg

# For debugging purposes
RUN ls -la dist || true
RUN find dist -type f | sort || true

# Expose port
EXPOSE 10000

# Use the simpler server script for Docker with explicit CommonJS extension
CMD ["node", "server-docker.cjs"]