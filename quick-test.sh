#!/bin/bash

echo "🔍 Quick syntax and type check before Docker build..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Track if any errors occurred
ERROR_FOUND=0

# Test client TypeScript compilation
echo "📦 Checking client TypeScript..."
cd client
npx tsc --noEmit --skipLibCheck
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Client TypeScript check passed${NC}"
else
    echo -e "${RED}❌ Client TypeScript errors found${NC}"
    ERROR_FOUND=1
fi
cd ..

# Test server syntax (basic node syntax check)
echo ""
echo "📦 Checking server syntax..."
cd server
node -c src/index.js 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Server syntax check passed${NC}"
else
    echo -e "${RED}❌ Server syntax errors found${NC}"
    ERROR_FOUND=1
fi
cd ..

# Summary
echo ""
if [ $ERROR_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Safe to run docker-compose.${NC}"
    exit 0
else
    echo -e "${RED}❌ Errors found. Please fix them before running docker-compose.${NC}"
    exit 1
fi
