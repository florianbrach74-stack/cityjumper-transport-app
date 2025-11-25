# Use Node 18 Alpine (kleiner, schneller)
FROM node:18-alpine

# Install dependencies for Puppeteer (falls benötigt)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (wird gecached!)
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 8080

# Start application
CMD ["node", "server/index.js"]
