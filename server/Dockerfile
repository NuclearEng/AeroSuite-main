# Multi-stage build for AeroSuite Backend - Fixed permissions version

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install build dependencies needed for some npm packages
RUN apk add --no-cache python3 make g++ 

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install --legacy-peer-deps

# Stage 2: Production
FROM node:18-alpine AS production

# Install dumb-init first
RUN apk add --no-cache dumb-init

# Create user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Create working directory
WORKDIR /app

# Copy package files (no chown needed)
COPY --from=deps /app/package*.json ./

# Now switch to nodejs user after files are properly owned
USER nodejs

# Install only production dependencies as nodejs user
RUN npm install --only=production --legacy-peer-deps && \
    npm cache clean --force

# Create necessary directories (already owned by nodejs since we're running as that user)
RUN mkdir -p logs uploads temp

# Copy application code (will be owned by nodejs automatically)
COPY . .

# Environment defaults
ENV NODE_ENV=production \
    PORT=5000 \
    NODE_OPTIONS="--max-old-space-size=2048"

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals (works with non-root user)
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["sh", "-c", "if [ -f src/cluster.js ]; then node src/cluster.js; else node src/index.js; fi"]
