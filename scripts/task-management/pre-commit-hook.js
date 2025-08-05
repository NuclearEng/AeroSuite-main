#!/usr/bin/env node

/**
 * Git pre-commit hook for checking task references
 * 
 * This script checks if files being committed have task references
 * and warns if they don't.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Checking for task references in changed files...');

try {
  // Get the staged files
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
    .trim().split('\n').filter(Boolean);
  
  // Skip certain files and directories
  const skipPatterns = [
    /node_modules/,
    /\.git/,
    /package-lock\.json/,
    /yarn\.lock/,
    /\.lock$/,
    /\.md$/,
    /\.json$/,
    /\.png$/,
    /\.jpg$/,
    /\.svg$/,
    /\.ico$/,
    /\.env/
  ];
  
  // Filter files to check
  const filesToCheck = stagedFiles.filter(file => {
    // Skip files that match any of the patterns
    return !skipPatterns.some(pattern => pattern.test(file));
  });
  
  if (filesToCheck.length === 0) {
    console.log('No relevant files to check for task references.');
    process.exit(0);
  }
  
  // Check each file for task references
  const filesWithoutReferences = [];
  
  for (const file of filesToCheck) {
    try {
      // Check if the file exists (it might have been deleted)
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Look for @task annotations
        const taskPattern = /@task\s+(TS|SEC|AI|PERF|DEV)\d{3}/;
        if (!taskPattern.test(content)) {
          filesWithoutReferences.push(file);
        }
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }
  
  // Warning if files don't have task references
  if (filesWithoutReferences.length > 0) {
    console.warn('⚠️  Warning: The following files are missing task references:\n');
    
    for (const file of filesWithoutReferences) {
      console.warn(`  ${file}`);
    }
    
    console.warn('\nConsider adding task references with: node scripts/task-management/enhanced-task-reference.js');
    console.warn('\nTo bypass this check, use: git commit --no-verify');
    
    // Ask if the user wants to continue
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\nContinue with commit anyway? (y/n): ', answer => {
      readline.close();
      if (answer.toLowerCase() !== 'y') {
        process.exit(1);
      }
      process.exit(0);
    });
  } else {
    // Success
    console.log('✅ All checked files have task references.');
    process.exit(0);
  }
} catch (error) {
  console.error(`Error checking task references: ${error.message}`);
  // Don't block the commit if there's an error in the hook
  process.exit(0);
} 