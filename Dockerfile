FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create a special server script
RUN echo "import './dist/server/index.js';" > server-start.mjs

# Expose port
EXPOSE 10000

# Use node to run the server with ES modules
CMD ["node", "server-start.mjs"]