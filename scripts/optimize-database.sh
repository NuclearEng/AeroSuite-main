#!/bin/bash

# optimize-database.sh
# Script to run the database schema optimization
# Implements RF029 - Review and optimize database schema

echo "Running Database Schema Optimization"
echo "==================================="

# Change to the project root directory
cd "$(dirname "$0")/.."

# Set NODE_ENV to development
export NODE_ENV=development

# Run the optimization script
echo "Analyzing database schema..."
node server/src/scripts/optimize-database-schema.js

echo ""
echo "Database schema optimization completed"
echo "Check the reports directory for the optimization report" 