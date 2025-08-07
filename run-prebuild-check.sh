#!/bin/bash

# Run Pre-Build Check Script
# This script runs the preBuild agent to validate code before Docker build

# Set the base directory to the script location
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 Running pre-build checks..."
"$BASE_DIR/run-orchestrator.sh" -a preBuild

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Pre-build checks passed! You can proceed with Docker build."
  echo "   To build Docker containers, run: docker-compose up -d --build"
else
  echo "❌ Pre-build checks failed! Please fix the issues before building Docker containers."
  echo "   For more details, run: ./run-orchestrator.sh -a preBuild -v"
  exit 1
fi
