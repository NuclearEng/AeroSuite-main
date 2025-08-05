#!/bin/bash

# analyze-lazy-loading.sh
# Script to analyze lazy loading opportunities in the AeroSuite frontend
# Implements RF034 - Add lazy loading for routes and components

echo "Lazy Loading Analysis"
echo "===================="

# Change to the project root directory
cd "$(dirname "$0")/.."

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed"
  exit 1
fi

# Check if chalk is installed
if ! node -e "require('chalk')" &> /dev/null; then
  echo "Installing required dependencies..."
  npm install --save-dev chalk
fi

# Set up variables
REPORT_DIR="reports/lazy-loading"

# Create reports directory if it doesn't exist
mkdir -p "$REPORT_DIR"

# Make the script executable
chmod +x scripts/analyze-lazy-loading.js

# Run the analysis script
echo "Running lazy loading analysis..."
node scripts/analyze-lazy-loading.js

# Check if the script was successful
if [ $? -ne 0 ]; then
  echo "Error: Lazy loading analysis failed"
  exit 1
fi

echo ""
echo "Analysis complete!"
echo "Check the reports in $REPORT_DIR"

# Print next steps
echo ""
echo "Next steps:"
echo "1. Review the generated report in $REPORT_DIR"
echo "2. Implement lazy loading for recommended files"
echo "3. Update routes.tsx to use the new lazy loading utilities"
echo "4. Test the application to ensure everything works correctly" 