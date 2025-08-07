#!/bin/bash

# Pre-Docker Build Check
# Quick syntax and type check before Docker build

echo "🔍 Pre-Docker Build Check..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any errors occurred
ERROR_FOUND=0
WARNING_COUNT=0

# Test client TypeScript compilation
echo "📦 Checking client TypeScript..."
cd client 2>/dev/null || { echo -e "${RED}❌ Client directory not found${NC}"; exit 1; }

# Quick TypeScript check (only show first few errors)
npx tsc --noEmit --skipLibCheck 2>&1 | head -20 > /tmp/tsc-output.txt
TSC_EXIT_CODE=${PIPESTATUS[0]}

if [ $TSC_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Client TypeScript check passed${NC}"
else
    echo -e "${RED}❌ Client TypeScript errors found:${NC}"
    cat /tmp/tsc-output.txt
    ERROR_FOUND=1
    
    # Count total errors
    ERROR_COUNT=$(npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS")
    echo -e "${RED}Total TypeScript errors: $ERROR_COUNT${NC}"
fi
cd ..

# Test server syntax (basic node syntax check)
echo ""
echo "📦 Checking server syntax..."
cd server 2>/dev/null || { echo -e "${RED}❌ Server directory not found${NC}"; exit 1; }

# Check main server file
node -c src/index.js 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Server syntax check passed${NC}"
else
    echo -e "${RED}❌ Server syntax errors found${NC}"
    ERROR_FOUND=1
fi
cd ..

# Check for common error patterns
echo ""
echo "📦 Checking for common error patterns..."
PATTERN_ERRORS=$(grep -r 'console.error("Error:", err)' client/src 2>/dev/null | wc -l)
if [ $PATTERN_ERRORS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $PATTERN_ERRORS instances of potential undefined 'err' variable${NC}"
    grep -r 'console.error("Error:", err)' client/src 2>/dev/null | head -5
    WARNING_COUNT=$((WARNING_COUNT + PATTERN_ERRORS))
fi

# Docker readiness check
echo ""
echo "📦 Checking Docker readiness..."
docker ps >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker daemon is running${NC}"
else
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    echo "   Please start Docker Desktop first"
    ERROR_FOUND=1
fi

# Check for required files
echo ""
echo "📦 Checking required files..."
REQUIRED_FILES=(
    "docker-compose.yml"
    "client/Dockerfile"
    "server/Dockerfile"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Found $file${NC}"
    else
        echo -e "${RED}❌ Missing $file${NC}"
        ERROR_FOUND=1
    fi
done

# Summary
echo ""
echo "======================================"
if [ $ERROR_FOUND -eq 0 ]; then
    if [ $WARNING_COUNT -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Checks passed with $WARNING_COUNT warnings${NC}"
        echo -e "${GREEN}✅ Safe to run docker-compose (but consider fixing warnings)${NC}"
    else
        echo -e "${GREEN}✅ All checks passed! Safe to run docker-compose.${NC}"
    fi
    echo ""
    echo "Run: docker-compose up -d --build"
    exit 0
else
    echo -e "${RED}❌ Errors found. Please fix them before running docker-compose.${NC}"
    echo ""
    echo "After fixing errors, run this check again or use:"
    echo "docker-compose up -d --build"
    exit 1
fi
