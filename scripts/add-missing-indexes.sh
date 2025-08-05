#!/bin/bash

# add-missing-indexes.sh
# Script to add missing indexes to all collections
# Implements RF030 - Add missing database indexes

echo "Adding Missing Database Indexes"
echo "=============================="

# Change to the project root directory
cd "$(dirname "$0")/.."

# Set NODE_ENV to development
export NODE_ENV=development

# Run the index addition script
echo "Analyzing and adding missing indexes..."
node server/src/scripts/add-missing-indexes.js

echo ""
echo "Index addition completed"
echo "Check the reports directory for the index addition report" 