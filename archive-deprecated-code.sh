#!/bin/bash

# Create an archive directory if it doesn't exist
mkdir -p archived-code

# Archive files from the not-used directory
echo "Archiving files from client/src/not-used..."
mkdir -p archived-code/client-not-used
cp -r client/src/not-used/* archived-code/client-not-used/

# Archive backup files with timestamp patterns
echo "Archiving timestamp backup files..."
mkdir -p archived-code/timestamp-backups

# Find and move timestamp backup files (excluding those in ui-sync-backups which seem to be intentional)
find . -name "*.20250625_*" -not -path "./ui-sync-backups/*" -not -path "./archived-code/*" -exec bash -c 'mkdir -p archived-code/timestamp-backups/$(dirname "{}" | sed "s|^\./||"); cp "{}" archived-code/timestamp-backups/$(dirname "{}" | sed "s|^\./||")/$(basename "{}")' \;

# Create a manifest of archived files
echo "Creating archive manifest..."
find archived-code -type f | sort > archived-code/manifest.txt

echo "Archive complete. Files are stored in the archived-code directory."
echo "A manifest of all archived files is available at archived-code/manifest.txt"

