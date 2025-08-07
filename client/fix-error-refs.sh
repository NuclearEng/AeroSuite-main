#!/bin/bash

echo "🔧 Fixing _error references in error handling code..."

# Find all TypeScript and JavaScript files with the pattern
FILES=$(grep -l "console\.error(\"Error:\", _error)" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" -r ./src)

# Process each file
for file in $FILES; do
  echo "Processing $file"
  
  # Check the catch variable pattern and replace accordingly
  sed -i 's/catch (err) {[[:space:]]*console\.error("Error:", _error);/catch (err) {\n      console.error("Error:", err);/g' "$file"
  sed -i 's/catch (err: any) {[[:space:]]*console\.error("Error:", _error);/catch (err: any) {\n      console.error("Error:", err);/g' "$file"
  sed -i 's/catch (error) {[[:space:]]*console\.error("Error:", _error);/catch (error) {\n      console.error("Error:", error);/g' "$file"
  sed -i 's/catch (error: any) {[[:space:]]*console\.error("Error:", _error);/catch (error: any) {\n      console.error("Error:", error);/g' "$file"
  
  # For cases where the catch variable doesn't match the pattern above
  # We'll replace the _error with the most common catch variable name (err)
  sed -i 's/console\.error("Error:", _error);/console.error("Error:", err);/g' "$file"
done

echo "✅ Fixed _error references in $(echo "$FILES" | wc -l) files"