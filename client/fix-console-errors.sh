#!/bin/bash

# Fix console.error statements to use the correct catch variable
find src -name "*.tsx" -o -name "*.ts" | while read file; do
  # Fix _error catch blocks
  sed -i '' 's/catch (_error) {[[:space:]]*console\.error("Error:", err);/catch (_error) {\n      console.error("Error:", _error);/g' "$file"
  
  # Fix _err catch blocks
  sed -i '' 's/catch (_err) {[[:space:]]*console\.error("Error:", err);/catch (_err) {\n      console.error("Error:", _err);/g' "$file"
  
  # Fix error catch blocks
  sed -i '' 's/catch (error) {[[:space:]]*console\.error("Error:", err);/catch (error) {\n      console.error("Error:", error);/g' "$file"
  
  # Fix err catch blocks
  sed -i '' 's/catch (err) {[[:space:]]*console\.error("Error:", _error);/catch (err) {\n      console.error("Error:", err);/g' "$file"
done

echo "Fixed console.error statements to use the correct catch variables"
