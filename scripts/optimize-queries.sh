#!/bin/bash

# optimize-queries.sh
# Script to analyze and optimize database queries
# Implements RF031 - Implement query optimization

echo "Query Optimization"
echo "================="

# Change to the project root directory
cd "$(dirname "$0")/.."

# Set NODE_ENV to development
export NODE_ENV=development

# Run the query optimization script
echo "Analyzing database queries..."
node server/src/scripts/optimize-queries.js

echo ""
echo "Query optimization analysis completed"
echo "Check the reports directory for the query optimization report" 