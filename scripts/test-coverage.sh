#!/bin/bash

# Generate test coverage report
echo "Generating test coverage report..."
npm run test:coverage

# Check if coverage directory exists
if [ -d "./coverage" ]; then
  echo "Coverage report generated successfully."
  echo "Summary:"
  cat ./coverage/coverage-summary.json | jq .
  
  # Open HTML report if on a desktop environment
  if [ -n "$DISPLAY" ] || [ "$(uname)" == "Darwin" ]; then
    echo "Opening HTML report..."
    if [ "$(uname)" == "Darwin" ]; then
      open ./coverage/lcov-report/index.html
    elif [ "$(uname)" == "Linux" ]; then
      xdg-open ./coverage/lcov-report/index.html
    elif [ "$(uname)" == "MINGW"* ] || [ "$(uname)" == "MSYS"* ] || [ "$(uname)" == "CYGWIN"* ]; then
      start ./coverage/lcov-report/index.html
    fi
  fi
else
  echo "Error: Coverage report was not generated."
  exit 1
fi 