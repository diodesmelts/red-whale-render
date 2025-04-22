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

# Create a static public directory for static assets
RUN mkdir -p dist/public/images

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