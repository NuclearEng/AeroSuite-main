#!/bin/bash

# Run Docker validation tests through the orchestrator
# This script runs both preBuild and dockerBuild agents

echo "🔍 Running Docker validation tests..."
echo ""

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

# Run the orchestrator with just the preBuild and dockerBuild agents
echo "Running Docker validation tests through orchestrator..."
cd "$SCRIPT_DIR/automation"
npx ts-node orchestrator.ts --modules=all --agents=preBuild,dockerBuild

# Check the exit code
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Docker validation tests failed! Please fix the errors before running docker-compose."
    exit 1
fi

echo ""
echo "✅ Docker validation tests passed!"
echo ""

# Ask user if they want to continue with docker-compose
read -p "Continue with docker-compose build? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🐳 Starting docker-compose build..."
    cd "$SCRIPT_DIR"
    docker-compose up -d --build
else
    echo "Docker build cancelled."
fi
