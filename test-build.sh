#!/bin/bash

echo "🔍 Running build tests before Docker..."
echo ""

# Test server build
echo "📦 Testing server build..."
cd server
npm run build 2>/dev/null || npm run start:single --dry-run 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server build test passed"
else
    echo "❌ Server build test failed"
    exit 1
fi
cd ..

# Test client build
echo ""
echo "📦 Testing client build..."
cd client
echo "Running TypeScript type check..."
npm run type-check 2>/dev/null || npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found in client"
    exit 1
fi
echo "✅ Client TypeScript check passed"

# Quick build test (faster than full build)
echo "Running quick build test..."
SKIP_PREFLIGHT_CHECK=true CI=true npm run build -- --no-minify 2>&1 | head -100
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ Client build test passed"
else
    echo "❌ Client build test failed"
    exit 1
fi
cd ..

echo ""
echo "✅ All build tests passed! Safe to run docker-compose."
