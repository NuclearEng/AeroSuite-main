#!/bin/bash

# Memory-optimized start script for AeroSuite server
# Uses cluster mode for multi-core utilization

# Make script executable on first run
chmod +x ./run-server.sh

# Set environment variables for optimization
export NODE_ENV=development
export NODE_OPTIONS="--max-old-space-size=2048"
export WORKER_COUNT=0  # Auto-detect CPU cores (0 means use all available)

echo "Starting AeroSuite server in cluster mode with memory optimizations..."
echo "Max heap size: 2GB"
echo "Worker count: Auto (uses available CPU cores)"

# Ensure .env file exists
if [ ! -f .env ]; then
  echo "Creating .env file with default settings..."
  cat > .env << EOF
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aerosuite
JWT_SECRET=aerosuite_secret_key_development
JWT_EXPIRES_IN=7d
EMAIL_SERVICE=gmail
EMAIL_USER=test@example.com
EMAIL_PASSWORD=password
CLIENT_URL=http://localhost:3000
EOF
fi

# Create log directory if it doesn't exist
mkdir -p logs

# Start the server in cluster mode
node src/cluster.js 