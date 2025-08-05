#!/bin/bash

# database-monitoring.sh
# Script to run database monitoring
# Implements RF032 - Set up database monitoring

echo "Database Monitoring"
echo "=================="

# Change to the project root directory
cd "$(dirname "$0")/.."

# Set NODE_ENV to development
export NODE_ENV=development

# Check for continuous monitoring flag
if [[ "$1" == "--continuous" ]]; then
  echo "Starting continuous database monitoring..."
  
  # Check for custom interval
  if [[ "$2" == "--interval" && -n "$3" ]]; then
    INTERVAL=$3
    echo "Using custom interval: ${INTERVAL}ms"
    node server/src/scripts/database-monitoring.js --continuous --interval $INTERVAL
  else
    echo "Using default interval: 60000ms"
    node server/src/scripts/database-monitoring.js --continuous
  fi
else
  echo "Running one-time database monitoring..."
  node server/src/scripts/database-monitoring.js
  
  echo ""
  echo "Database monitoring completed"
  echo "Check the reports directory for the database monitoring report"
fi 