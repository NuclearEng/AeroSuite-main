#!/bin/bash

# AeroSuite Startup Script
# This script starts all required services for the AeroSuite application

echo "🚀 Starting AeroSuite services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Start Docker containers
echo "📦 Starting Docker containers..."
docker-compose up -d
if [ $? -ne 0 ]; then
  echo "❌ Failed to start Docker containers. Please check the logs."
  exit 1
fi

# Wait for containers to be healthy
echo "⏳ Waiting for containers to be healthy..."
for i in {1..30}; do
  if docker ps | grep aerosuite-main-aerosuite-server-1 | grep -q "(healthy)"; then
    break
  fi
  echo "⏳ Waiting for server container to be healthy... ($i/30)"
  sleep 2
done

if ! docker ps | grep aerosuite-main-aerosuite-server-1 | grep -q "(healthy)"; then
  echo "❌ Server container is not healthy after waiting. Please check the logs."
  echo "⚠️ Continuing anyway, but there may be issues..."
fi

# Start the simple server on port 5002
echo "🔌 Starting simple server on port 5002..."
node server/simple-server-5002.js > logs/simple-server.log 2>&1 &
SIMPLE_SERVER_PID=$!

# Check if simple server started successfully
sleep 2
if ! curl -s http://localhost:5002/api/health > /dev/null; then
  echo "❌ Failed to start simple server on port 5002. Please check the logs."
  echo "📄 Log file: logs/simple-server.log"
  exit 1
fi

echo "✅ Simple server started successfully on port 5002 (PID: $SIMPLE_SERVER_PID)"

# Start the API proxy server on port 80
echo "🔌 Starting API proxy server on port 80..."
sudo node server/api-proxy.js > logs/api-proxy.log 2>&1 &
API_PROXY_PID=$!

# Check if API proxy server started successfully
sleep 2
if ! curl -s http://api.aerosuite.com/ > /dev/null; then
  echo "❌ Failed to start API proxy server. Please check the logs."
  echo "📄 Log file: logs/api-proxy.log"
  echo "⚠️ Continuing anyway, but there may be issues..."
else
  echo "✅ API proxy server started successfully (PID: $API_PROXY_PID)"
fi

# Print URLs
echo ""
echo "🌐 AeroSuite is now running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Main API: http://localhost:5001/api/health"
echo "🔌 Simple API: http://localhost:5002/api/health"
echo ""
echo "💡 To stop all services, run: ./stop-aerosuite.sh"
echo ""

# Save PID for later cleanup
mkdir -p .pids
echo $SIMPLE_SERVER_PID > .pids/simple-server.pid

# Open the application in the default browser
echo "🌐 Opening AeroSuite in your default browser..."
open http://localhost:3000
