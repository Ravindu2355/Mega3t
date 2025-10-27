# Use lightweight Node.js base image
FROM node:20-alpine

# Limit Node memory to avoid crashes on Koyeb free tier
ENV NODE_OPTIONS="--max-old-space-size=256"

# Set working directory
WORKDIR /app

# Copy package files first for better build caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy all source code
COPY . .

# Create required directories
RUN mkdir -p /app/downloads

# Expose your web or bot port (Koyeb expects this)
EXPOSE 8000

# Start your bot
CMD ["node", "bot/index.js"]
