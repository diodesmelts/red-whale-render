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

# Copy server files and production fix scripts
COPY server-docker.cjs production-fix-docker.cjs ./

# Create a patched version of server-docker.cjs with error handling fixes
RUN sed -i '1s/^/const productionFix = require(".\/production-fix-docker.cjs");\n/' server-docker.cjs \
    && sed -i '/app\.use(express\.json());/a \n// Set up production logging to reduce verbosity\nproductionFix.setupProductionLogging();\n\n// Add API monitoring for better error tracking\nproductionFix.addApiMonitoring(app);' server-docker.cjs

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

# Generate favicon to prevent browser loading indicator issues
RUN echo 'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmkMxmZpDMzGaQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMzMZpDMZgAAAAAAAAAAAAAAAAAAAAAAAAAAZpDMzGaQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzMwAAAAAAAAAAAAAAAAAAAAAAAAAAGaQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/AAAAAAAAAAAAAAAAAAAAAAAAAABmkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/wAAAAAAAAAAAAAAAAAAAAAAAAAAZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP8AAAAAAAAAAAAAAAAAAAAAAAAAAGaQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/AAAAAAAAAAAAAAAAAAAAAAAAAABmkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/wAAAAAAAAAAAAAAAAAAAAAAAAAAZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP8AAAAAAAAAAAAAAAAAAAAAAAAAAGaQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/AAAAAAAAAAAAAAAAAAAAAAAAAABmkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/wAAAAAAAAAAAAAAAAAAAAAAAAAAZpDMzGaQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzMwAAAAAAAAAAAAAAAAAAAAAAAAAAGaQzGZmkMzMZpDM/2aQzP9mkMz/ZpDM/2aQzP9mkMz/ZpDM/2aQzMxmkMxmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' | base64 -d > dist/public/favicon.ico \
    && cp dist/public/favicon.ico ./favicon.ico || true

# Patch competition endpoints with better error handling
RUN grep -q "getCompetitionActiveCartItems" server-docker.cjs && \
    sed -i '/app.post.*\/api\/competitions\/:id\/active-cart-items.*{/,/})/s/res.status(404).json({ message: .*})/productionFix.errorResponse(res, 404, "Competition not found", productionFix.defaultCartItems())/g' server-docker.cjs && \
    sed -i '/app.post.*\/api\/competitions\/:id\/active-cart-items.*{/,/})/s/res.status(500).json({ message: .*})/productionFix.errorResponse(res, 500, "Error processing cart items", productionFix.defaultCartItems())/g' server-docker.cjs && \
    sed -i '/app.get.*\/api\/competitions\/:id\/ticket-stats.*{/,/})/s/res.status(404).json({ message: .*})/productionFix.errorResponse(res, 404, "Competition not found", productionFix.defaultTicketStats())/g' server-docker.cjs && \
    sed -i '/app.get.*\/api\/competitions\/:id\/ticket-stats.*{/,/})/s/res.status(500).json({ message: .*})/productionFix.errorResponse(res, 500, error.message || "Error calculating ticket statistics", productionFix.defaultTicketStats())/g' server-docker.cjs || true

# For debugging purposes
RUN ls -la dist || true
RUN find dist -type f | sort || true

# Expose port
EXPOSE 10000

# Set production environment
ENV NODE_ENV=production

# Use the simpler server script for Docker with explicit CommonJS extension
CMD ["node", "server-docker.cjs"]