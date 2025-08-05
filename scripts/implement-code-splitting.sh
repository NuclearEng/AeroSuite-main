#!/bin/bash

# implement-code-splitting.sh
# Script to implement code splitting for the AeroSuite frontend
# Implements RF033 - Implement code splitting for frontend

echo "Code Splitting Implementation"
echo "============================"

# Change to the project root directory
cd "$(dirname "$0")/.."

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed"
  exit 1
fi

# Set up variables
REPORT_DIR="reports/code-splitting"
APPLY_FLAG=""

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --apply) APPLY_FLAG="--apply"; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
done

# Create reports directory if it doesn't exist
mkdir -p "$REPORT_DIR"

# Run the implementation script
echo "Running code splitting analysis..."
node scripts/implement-code-splitting.js $APPLY_FLAG

# Check if the script was successful
if [ $? -ne 0 ]; then
  echo "Error: Code splitting implementation failed"
  exit 1
fi

# If apply flag was provided, update the package.json script
if [ -n "$APPLY_FLAG" ]; then
  echo "Updating package.json scripts..."
  
  # Check if jq is installed
  if command -v jq &> /dev/null; then
    # Use jq to add the script to package.json
    jq '.scripts["analyze:code-splitting"] = "node scripts/implement-code-splitting.js"' package.json > package.json.tmp
    mv package.json.tmp package.json
    echo "Added 'analyze:code-splitting' script to package.json"
  else
    echo "Warning: jq is not installed. Please manually add the following script to package.json:"
    echo '"analyze:code-splitting": "node scripts/implement-code-splitting.js"'
  fi
  
  # Make the script executable
  chmod +x scripts/implement-code-splitting.js
  
  echo ""
  echo "Code splitting implementation complete!"
  echo "To analyze code splitting opportunities, run: npm run analyze:code-splitting"
else
  echo ""
  echo "Code splitting analysis complete!"
  echo "To apply code splitting, run: ./scripts/implement-code-splitting.sh --apply"
fi

# Print next steps
echo ""
echo "Next steps:"
echo "1. Review the generated report in $REPORT_DIR"
echo "2. Update routes.tsx to use the new code splitting utilities"
echo "3. Update App.tsx to use the useRouteSplitting hook"
echo "4. Test the application to ensure everything works correctly" 