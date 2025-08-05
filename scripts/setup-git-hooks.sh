#!/bin/bash

# Setup Git Hooks Script
# This script installs custom git hooks for the project

echo "🔧 Setting up Git hooks..."

# Check if .git directory exists
if [ ! -d ".git" ]; then
    echo "❌ Error: .git directory not found. Please run this from the project root."
    exit 1
fi

# Configure git to use the .githooks directory
git config core.hooksPath .githooks

if [ $? -eq 0 ]; then
    echo "✅ Git hooks successfully configured!"
    echo "📍 Git will now use hooks from: .githooks/"
    echo ""
    echo "🎯 Installed hooks:"
    echo "  - pre-commit: Automatically fixes markdown trailing newlines"
    echo ""
    echo "💡 To bypass hooks temporarily, use: git commit --no-verify"
else
    echo "❌ Failed to configure git hooks"
    exit 1
fi

# Optional: Install the hooks to .git/hooks for compatibility
read -p "Do you want to also install hooks to .git/hooks? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp .githooks/pre-commit .git/hooks/pre-commit 2>/dev/null
    chmod +x .git/hooks/pre-commit 2>/dev/null
    echo "✅ Hooks also installed to .git/hooks/"
fi

echo ""
echo "✨ Git hooks setup complete!"