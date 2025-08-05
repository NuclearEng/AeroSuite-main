# Dependencies stage
FROM node:18-slim AS deps

# Set working directory
WORKDIR /app

# Install build dependencies for node-gyp
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies including devDependencies
RUN npm install

# Build stage
FROM node:18-slim AS build

# Set working directory
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Copy source code
COPY . .

# Production stage
FROM node:18-slim

# Install dumb-init for proper signal handling
RUN apt-get update && \
    apt-get install -y --no-install-recommends dumb-init wget && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Increase Node memory limit
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Create a non-root user and directories with restricted permissions
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/false -m nodejs && \
    mkdir -p /app/logs /app/uploads && \
    chown -R nodejs:nodejs /app && \
    chmod 750 /app/logs /app/uploads

# Copy only production dependencies from build stage
COPY --from=build /app/package*.json ./
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    npm install --only=production && \
    apt-get purge -y --auto-remove python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy application code with correct ownership
COPY --from=build --chown=nodejs:nodejs /app/src ./src

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 5000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run the application using the cluster module
CMD ["node", "src/cluster.js"] 