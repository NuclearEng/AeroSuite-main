#!/bin/bash
# docker-build-diagnose.sh
# Automate Node/npm alignment, lockfile regeneration, and Docker build diagnostics for aerosuite-server

set -e

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

DOCKER_NODE_VERSION="18"
DOCKER_NPM_VERSION="10.8.2" # Update if your Docker image uses a different npm version
SERVER_DIR="server"
BUILD_LOG="docker-build-diagnose.log"

# 1. Detect local Node and npm version
LOCAL_NODE=$(node -v | sed 's/v//')
LOCAL_NPM=$(npm -v)
echo "[INFO] Local Node version: $LOCAL_NODE"
echo "[INFO] Local npm version: $LOCAL_NPM"

# 2. Warn if not matching Dockerfile
if [[ "$LOCAL_NODE" != $DOCKER_NODE_VERSION* ]]; then
  echo "[WARN] Your local Node version ($LOCAL_NODE) does not match Dockerfile ($DOCKER_NODE_VERSION.x). Use nvm or n to switch."
fi
if [[ "$LOCAL_NPM" != $DOCKER_NPM_VERSION* ]]; then
  echo "[WARN] Your local npm version ($LOCAL_NPM) does not match Dockerfile ($DOCKER_NPM_VERSION). Run: npm install -g npm@$DOCKER_NPM_VERSION"
fi

# 3. Clean node_modules and lockfile in server/
echo "[INFO] Cleaning $SERVER_DIR/node_modules and $SERVER_DIR/package-lock.json..."
rm -rf "$SERVER_DIR/node_modules"
rm -f "$SERVER_DIR/package-lock.json"

# 4. Regenerate lockfile
cd "$SERVER_DIR"
echo "[INFO] Running npm install in $SERVER_DIR..."
npm install
echo "[INFO] Running npm ci in $SERVER_DIR to verify lockfile..."
npm ci
cd "$ROOT"

# 5. Clean Docker build with BuildKit disabled
echo "[INFO] Running clean Docker build with BuildKit disabled..."
DOCKER_BUILDKIT=0 docker-compose build --no-cache | tee "$BUILD_LOG"

# 6. Parse build output for npm ci errors
if grep -q 'npm error' "$BUILD_LOG"; then
  echo "[ERROR] Docker build failed due to npm ci errors. See $BUILD_LOG for details."
  echo "[HINT] Ensure your local Node and npm versions match the Dockerfile, and that all dependencies are compatible."
  exit 1
fi

# 7. Success message and next steps
echo "[SUCCESS] Docker build completed successfully!"
echo "[INFO] You can now launch your application with:"
echo "  docker-compose up -d"

# 8. End of script 