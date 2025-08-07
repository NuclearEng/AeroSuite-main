#!/bin/bash

# Safe Docker Build Script
# Runs pre-build checks before attempting docker-compose

echo "🔍 Running pre-build checks..."
echo ""

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTOMATION_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$AUTOMATION_DIR")"

cd "$PROJECT_ROOT"

# Run the orchestrator with just the preBuild agent
echo "Running pre-build agent..."
cd "$AUTOMATION_DIR"
npx ts-node orchestrator.ts --modules=all --agents=preBuild

# Check the exit code
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Pre-build checks failed! Please fix the errors before running docker-compose."
    exit 1
fi

echo ""
echo "✅ Pre-build checks passed!"
echo ""

# Ask user if they want to continue with docker-compose
read -p "Continue with docker-compose build? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🐳 Starting docker-compose build..."
    cd "$PROJECT_ROOT"
    docker-compose up -d --build
else
    echo "Docker build cancelled."
fi
