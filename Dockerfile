FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE ${PORT:-5000}

CMD ["node", "dist/index.js"]