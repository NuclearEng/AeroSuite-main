#!/bin/bash

# AeroSuite Development Launch Script

echo "🚀 Launching AeroSuite Application"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to kill process on port
kill_port() {
  local port=$1
  echo -e "${YELLOW}Checking port $port...${NC}"
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
}

# Clean up any existing processes
echo -e "${BLUE}Cleaning up existing processes...${NC}"
kill_port 3000
kill_port 5000
kill_port 5002

# Start MongoDB if not running
echo -e "${BLUE}Checking MongoDB...${NC}"
if ! pgrep -x "mongod" > /dev/null; then
    echo -e "${YELLOW}Starting MongoDB...${NC}"
    mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data 2>/dev/null || {
        echo -e "${YELLOW}MongoDB may already be running or configured differently${NC}"
    }
fi

# Start Redis if available
echo -e "${BLUE}Checking Redis...${NC}"
if command -v redis-server &> /dev/null; then
    if ! pgrep -x "redis-server" > /dev/null; then
        echo -e "${YELLOW}Starting Redis...${NC}"
        redis-server --daemonize yes 2>/dev/null || {
            echo -e "${YELLOW}Redis may already be running${NC}"
        }
    fi
else
    echo -e "${YELLOW}Redis not installed, skipping...${NC}"
fi

# Start the backend server
echo -e "${BLUE}Starting backend server...${NC}"
cd server
npm run dev &
SERVER_PID=$!
echo -e "${GREEN}Backend server starting (PID: $SERVER_PID)${NC}"

# Wait for backend to be ready
echo -e "${BLUE}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5000/api/health > /dev/null; then
        echo -e "${GREEN}✓ Backend server is ready!${NC}"
        break
    fi
    sleep 1
done

# Start the frontend
echo -e "${BLUE}Starting frontend...${NC}"
cd ../client
npm start &
CLIENT_PID=$!
echo -e "${GREEN}Frontend starting (PID: $CLIENT_PID)${NC}"

# Wait for frontend to be ready
echo -e "${BLUE}Waiting for frontend to be ready...${NC}"
for i in {1..60}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✓ Frontend is ready!${NC}"
        break
    fi
    sleep 2
done

echo ""
echo -e "${GREEN}🎉 AeroSuite is running!${NC}"
echo ""
echo "📍 Access points:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo "   API Health: http://localhost:5000/api/health"
echo ""
echo "📋 Process IDs:"
echo "   Backend: $SERVER_PID"
echo "   Frontend: $CLIENT_PID"
echo ""
echo "To stop all services, press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    kill_port 3000
    kill_port 5000
    echo -e "${GREEN}Services stopped.${NC}"
    exit 0
}

# Set up trap for cleanup
trap cleanup INT TERM

# Keep script running
while true; do
    sleep 1
done