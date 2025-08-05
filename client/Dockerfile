# ---- Base Stage ----
FROM node:18-slim AS base
WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS deps
# Install build dependencies for native modules
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Copy package files for better caching
COPY package*.json ./

# Install dependencies with deterministic builds
RUN npm install --legacy-peer-deps

# ---- Build Stage ----
FROM base AS build
# Copy deps from previous stage
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./

# Copy source code (filtered by .dockerignore)
COPY --chown=node:node . .

# Ensure /app directory is owned by node user
RUN chown -R node:node /app

# Build as non-root user
USER node
ENV NODE_ENV=production
RUN npm run build:optimized

# ---- Production Stage ----
FROM nginx:stable-alpine AS production

# Create a custom nginx.conf that doesn't require root permissions
RUN echo 'worker_processes auto;\n\
pid /tmp/nginx.pid;\n\
events {\n\
    worker_connections 1024;\n\
}\n\
http {\n\
    include /etc/nginx/mime.types;\n\
    default_type application/octet-stream;\n\
    sendfile on;\n\
    access_log /tmp/nginx_access.log;\n\
    error_log /tmp/nginx_error.log;\n\
    client_body_temp_path /tmp/client_temp;\n\
    proxy_temp_path /tmp/proxy_temp;\n\
    fastcgi_temp_path /tmp/fastcgi_temp;\n\
    uwsgi_temp_path /tmp/uwsgi_temp;\n\
    scgi_temp_path /tmp/scgi_temp;\n\
    server {\n\
        listen 80;\n\
        server_name localhost;\n\
        location / {\n\
            root /usr/share/nginx/html;\n\
            index index.html index.htm;\n\
            try_files $uri $uri/ /index.html;\n\
        }\n\
    }\n\
}\n' > /etc/nginx/nginx.conf

# Create required temp directories with proper permissions
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    chmod 777 -R /tmp

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"] 