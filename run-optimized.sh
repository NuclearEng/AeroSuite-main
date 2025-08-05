#!/bin/bash

# Memory-optimized start script for AeroSuite client

# Make script executable on first run
chmod +x ./run-optimized.sh

# Set environment variables for optimization
export NODE_OPTIONS="--max-old-space-size=8192"
export FAST_REFRESH=true
export TSC_COMPILE_ON_ERROR=true
export DISABLE_ESLINT_PLUGIN=true

# Uncomment this if you're still experiencing memory issues
# export DISABLE_TYPECHECKING=true

echo "Starting AeroSuite client with memory optimizations..."
echo "Max heap size: 8GB"
echo "Fast refresh: Enabled"
echo "TypeScript error tolerance: Enabled"
echo "ESLint disabled during development"

# Start the optimized development server with memory monitoring
npm run start:optimized 