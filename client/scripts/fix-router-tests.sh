#!/bin/bash

# Script to fix React Router tests
# This script provides a simple interface to run the test fixing scripts

# Change to the client directory
cd "$(dirname "$0")/.." || exit 1

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo "Node.js is required but not installed. Please install Node.js and try again."
  exit 1
fi

# Check if glob is installed
if ! node -e "require('glob')" &> /dev/null; then
  echo "Installing required dependencies..."
  npm install --save-dev glob
fi

# Display the menu
echo "===== React Router Test Fixer ====="
echo "1. Interactive mode (fix tests one by one)"
echo "2. Batch mode (fix all tests at once)"
echo "3. Fix tests in a specific directory"
echo "4. Exit"
echo "=================================="
echo -n "Enter your choice (1-4): "
read -r choice

case $choice in
  1)
    echo "Running in interactive mode..."
    node scripts/apply-router-test-fixes.js
    ;;
  2)
    echo "Running in batch mode..."
    node scripts/batch-fix-router-tests.js
    ;;
  3)
    echo -n "Enter the directory pattern (e.g., src/pages/customers): "
    read -r pattern
    echo "Fixing tests in $pattern..."
    node scripts/batch-fix-router-tests.js "$pattern/**/*.test.{js,jsx,ts,tsx}"
    ;;
  4)
    echo "Exiting..."
    exit 0
    ;;
  *)
    echo "Invalid choice. Exiting..."
    exit 1
    ;;
esac

echo "Done!" 