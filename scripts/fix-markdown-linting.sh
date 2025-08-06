#!/bin/bash

# Markdown Linting Auto-Fix Script
# This script automatically fixes common markdown linting issues

set -e

echo "🔧 Starting markdown linting auto-fix..."

# Function to fix a single markdown file
fix_markdown_file() {
    local file="$1"
    local temp_file=$(mktemp)
    
    echo "Processing: $file"
    
    # Create a backup
    cp "$file" "$file.backup"
    
    # Apply fixes using sed and awk
    cat "$file" | \
    # Fix 1: Remove trailing spaces (MD009)
    sed 's/[[:space:]]*$//' | \
    # Fix 2: Add language specifiers to code blocks (MD040) - basic fix
    sed 's/^```$/```bash/' | \
    # Fix 3: Add blank lines around headings (MD022)
    sed '/^#{1,6}[[:space:]]/i\
' | \
    sed '/^#{1,6}[[:space:]]/a\
' | \
    # Fix 4: Add blank lines around lists (MD032)
    sed '/^[[:space:]]*[-*+][[:space:]]/i\
' | \
    sed '/^[[:space:]]*[-*+][[:space:]]/a\
' | \
    sed '/^[[:space:]]*[0-9]\+\.[[:space:]]/i\
' | \
    sed '/^[[:space:]]*[0-9]\+\.[[:space:]]/a\
' | \
    # Fix 5: Add blank lines around code fences (MD031)
    sed '/^```/i\
' | \
    sed '/^```/a\
' | \
    # Fix 6: Convert asterisk emphasis to underscore (MD049)
    sed 's/\*\*\([^*]*\)\*\*/__\1__/g' | \
    sed 's/\*\([^*]*\)\*/_\1_/g' > "$temp_file"
    
    # Replace original file
    mv "$temp_file" "$file"
    
    echo "✅ Fixed: $file"
}

# Function to find all markdown files
find_markdown_files() {
    find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*"
}

# Function to fix line length issues (MD013)
fix_line_length() {
    local file="$1"
    local temp_file=$(mktemp)
    
    # Use awk to wrap lines at 100 characters
    awk '
    BEGIN { max_length = 100 }
    {
        if (length($0) <= max_length) {
            print $0
        } else {
            # Simple word wrapping
            line = $0
            while (length(line) > max_length) {
                # Find the last space before max_length
                pos = max_length
                while (pos > 0 && substr(line, pos, 1) != " ") {
                    pos--
                }
                if (pos == 0) {
                    # No space found, break at max_length
                    pos = max_length
                }
                print substr(line, 1, pos)
                line = substr(line, pos + 1)
            }
            if (length(line) > 0) {
                print line
            }
        }
    }' "$file" > "$temp_file"
    
    mv "$temp_file" "$file"
}

# Main execution
main() {
    local files=($(find_markdown_files))
    
    if [[ ${#files[@]} -eq 0 ]]; then
        echo "No markdown files found."
        exit 0
    fi
    
    echo "Found ${#files[@]} markdown files to process:"
    printf '%s\n' "${files[@]}"
    echo ""
    
    # Process each file
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            fix_markdown_file "$file"
            fix_line_length "$file"
        fi
    done
    
    echo ""
    echo "✅ Markdown linting auto-fix completed!"
    echo ""
    echo "Running markdownlint to check remaining issues..."
    npx markdownlint-cli "**/*.md" --ignore node_modules || true
}

# Run the script
main "$@" 