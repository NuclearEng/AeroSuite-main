#!/bin/bash

# analyze-bundle-size.sh
# Script to analyze bundle size and provide optimization recommendations
# Implementation of RF035 - Optimize bundle size

echo "Bundle Size Analysis"
echo "===================="

# Change to the project root directory
cd "$(dirname "$0")/.."

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed"
  exit 1
fi

# Check if required dependencies are installed
MISSING_DEPS=0
for dep in chalk cli-table3 filesize gzip-size brotli-size; do
  if ! node -e "require('$dep')" &> /dev/null; then
    echo "Installing dependency: $dep..."
    npm install --save-dev $dep
    MISSING_DEPS=1
  fi
done

# If we installed dependencies, we need to make sure they're available
if [ $MISSING_DEPS -eq 1 ]; then
  echo "Dependencies installed. Continuing..."
fi

# Check if build directory exists
if [ ! -d "build" ]; then
  echo "Build directory not found. Running production build first..."
  echo ""
  
  # Run production build with bundle analyzer
  ANALYZE=true npm run build:optimized
else
  # Check if user wants to rebuild
  if [ "$1" == "--rebuild" ] || [ "$1" == "-r" ]; then
    echo "Rebuilding with bundle analyzer..."
    echo ""
    ANALYZE=true npm run build:optimized
  fi
fi

# Make the script executable
chmod +x scripts/analyze-bundle-size.js

# Run the analysis script
echo "Running bundle size analysis..."
node scripts/analyze-bundle-size.js

# Check if the script was successful
if [ $? -ne 0 ]; then
  echo "Error: Bundle size analysis failed"
  exit 1
fi

# Open the HTML report if --open flag is provided
if [ "$1" == "--open" ] || [ "$2" == "--open" ] || [ "$1" == "-o" ] || [ "$2" == "-o" ]; then
  REPORT_PATH="reports/bundle-analysis/bundle-analysis-report.html"
  
  if [ -f "$REPORT_PATH" ]; then
    echo "Opening HTML report..."
    
    # Try to open the report with the appropriate command based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      open "$REPORT_PATH"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      # Linux
      if command -v xdg-open &> /dev/null; then
        xdg-open "$REPORT_PATH"
      else
        echo "Could not open report automatically. Please open manually: $REPORT_PATH"
      fi
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
      # Windows
      start "$REPORT_PATH"
    else
      echo "Could not open report automatically. Please open manually: $REPORT_PATH"
    fi
  else
    echo "Report file not found: $REPORT_PATH"
  fi
fi

echo ""
echo "Analysis complete!"
echo "Check the reports in reports/bundle-analysis/"

# Print next steps
echo ""
echo "Next steps:"
echo "1. Review the generated report in reports/bundle-analysis/"
echo "2. Implement the recommended optimizations"
echo "3. Run this script again to verify improvements" 