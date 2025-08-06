#!/bin/bash

# TypeScript Error Detection and Auto-Fix Integration Script
# This script integrates TypeScript error detection into the testing workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[STATUS]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Main function
main() {
    print_status "Starting TypeScript Error Detection and Auto-Fix..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Not in project root directory"
        exit 1
    fi
    
    # Run TypeScript error detection
    print_status "Detecting TypeScript errors..."
    
    # Capture current errors
    if npm run typescript:feed-build > typescript-errors-output.txt 2>&1; then
        print_success "No TypeScript errors found!"
        exit 0
    else
        print_warning "TypeScript errors detected"
    fi
    
    # Parse the errors
    cat typescript-errors-output.txt | npm run typescript:parse-errors > typescript-errors.json
    
    # Display summary
    ERROR_COUNT=$(jq '.summary.total' typescript-errors.json)
    FIXABLE_COUNT=$(jq '.summary.autoFixable' typescript-errors.json)
    
    print_status "Found $ERROR_COUNT errors, $FIXABLE_COUNT are auto-fixable"
    
    # If auto-fix is requested
    if [ "$1" == "--fix" ] || [ "$1" == "-f" ]; then
        print_status "Attempting to auto-fix errors..."
        
        # Run auto-fix
        node scripts/typescript-auto-fix.js typescript-errors.json
        
        # Re-check for remaining errors
        print_status "Re-checking for remaining errors..."
        if npm run typescript:feed-build > typescript-errors-remaining.txt 2>&1; then
            print_success "All auto-fixable errors have been resolved!"
        else
            REMAINING=$(cat typescript-errors-remaining.txt | grep "ERROR in" | wc -l)
            print_warning "$REMAINING errors remain and require manual fixes"
        fi
    fi
    
    # Generate test report
    print_status "Generating test report..."
    node -e "
    const fs = require('fs');
    const report = JSON.parse(fs.readFileSync('typescript-errors.json'));
    
    console.log('\\n📊 TypeScript Error Report:');
    console.log('  Total errors:', report.summary.total);
    console.log('  Auto-fixable:', report.summary.autoFixable);
    console.log('\\n  Error types:');
    Object.entries(report.summary.byType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([type, count]) => console.log('    ' + type + ':', count));
    
    console.log('\\n  Files with most errors:');
    Object.entries(report.summary.byFile)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([file, count]) => console.log('    ' + file.split('/').pop() + ':', count));
    "
    
    # Exit with error if there are unfixed errors
    if [ "$ERROR_COUNT" -gt 0 ] && [ "$1" != "--fix" ]; then
        print_error "TypeScript errors found. Run with --fix to attempt auto-fixes."
        exit 1
    fi
}

# Run main function
main "$@"