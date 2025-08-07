#!/bin/bash

# AeroSuite Shutdown Script
# This script stops all services for the AeroSuite application

echo "🛑 Stopping AeroSuite services..."

# Stop the simple server
if [ -f .pids/simple-server.pid ]; then
  SIMPLE_SERVER_PID=$(cat .pids/simple-server.pid)
  if ps -p $SIMPLE_SERVER_PID > /dev/null; then
    echo "🔌 Stopping simple server (PID: $SIMPLE_SERVER_PID)..."
    kill $SIMPLE_SERVER_PID
    rm .pids/simple-server.pid
  else
    echo "⚠️ Simple server process not found. It may have already been stopped."
    rm .pids/simple-server.pid
  fi
else
  # Try to find the process by port
  echo "🔍 Looking for simple server process by port..."
  SIMPLE_SERVER_PID=$(lsof -i:5002 -t)
  if [ -n "$SIMPLE_SERVER_PID" ]; then
    echo "🔌 Stopping simple server (PID: $SIMPLE_SERVER_PID)..."
    kill $SIMPLE_SERVER_PID
  else
    echo "⚠️ Could not find simple server process. It may have already been stopped."
  fi
fi

# Stop Docker containers
echo "📦 Stopping Docker containers..."
docker-compose down

echo "✅ All AeroSuite services have been stopped."
