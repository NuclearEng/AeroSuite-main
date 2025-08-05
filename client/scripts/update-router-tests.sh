#!/bin/bash

# Script to automate the process of updating component tests to use our testing utilities
# This script will scan for test files that might need to be updated and apply the changes

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo "Node.js is required but not installed. Please install Node.js and try again."
  exit 1
fi

# Check if the test-utils directory exists
if [ ! -d "src/test-utils" ]; then
  echo "The test-utils directory does not exist. Please create it first."
  exit 1
fi

# Run the update-router-tests.js script
echo "Running update-router-tests.js script..."
node src/test-utils/update-router-tests.js

# Check for .fixed files and prompt to apply them
echo "Checking for .fixed files..."
FIXED_FILES=$(find src -name "*.fixed")

if [ -z "$FIXED_FILES" ]; then
  echo "No .fixed files found. All tests are already updated or no tests need updating."
  exit 0
fi

echo "Found the following .fixed files:"
echo "$FIXED_FILES"

read -p "Do you want to apply these changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  for file in $FIXED_FILES; do
    original_file=${file%.fixed}
    echo "Applying changes to $original_file"
    mv "$file" "$original_file"
  done
  echo "Changes applied successfully."
else
  echo "Changes not applied. You can review the .fixed files and apply them manually."
fi

echo "Script completed." 