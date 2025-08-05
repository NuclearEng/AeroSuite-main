#!/bin/bash

# Production AeroSuite Launch Script
echo "🚀 Starting Production AeroSuite..."
echo "📍 Location: $(pwd)"
echo "⏰ Time: $(date)"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ to continue."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start the application
echo "🎯 Starting Production AeroSuite on port 5001..."
echo "🌐 Access the application at: http://localhost:5001"
echo "🏥 Health check: http://localhost:5001/api/health"
echo ""
echo "📋 Available page:"
echo "   • Dashboard: http://localhost:5001"
echo ""
echo "⚡ Press Ctrl+C to stop the server"
echo ""

# Launch the application
NODE_ENV=production PORT=5001 node simple-server.js 