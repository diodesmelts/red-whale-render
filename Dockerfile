FROM node:20-slim

WORKDIR /app

# First copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Set the port
EXPOSE ${PORT:-5000}

# Use ts-node to run the server in production
CMD ["node", "dist/index.js"]