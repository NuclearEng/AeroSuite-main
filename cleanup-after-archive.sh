#!/bin/bash

# This script removes deprecated files after they've been archived
# Run this only after running archive-deprecated-code.sh

# Remove the not-used directory
echo "Removing client/src/not-used directory..."
rm -rf client/src/not-used

# Remove timestamp backup files (excluding those in ui-sync-backups which seem to be intentional)
echo "Removing timestamp backup files..."
find . -name "*.20250625_*" -not -path "./ui-sync-backups/*" -not -path "./archived-code/*" -exec rm -f {} \;

echo "Cleanup complete."
echo "Note: The archived files are still available in the archived-code directory."

