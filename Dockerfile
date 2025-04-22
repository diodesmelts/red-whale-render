FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 10000

# Use node to run the server
CMD ["node", "server-entry.js"]