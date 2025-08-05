#!/usr/bin/env node

/**
 * Git post-commit hook for updating task-to-code relationship report
 * 
 * This script runs after a commit to update the task-to-code relationship report.
 */

const { execSync } = require('child_process');

try {
  console.log('Updating task-to-code relationship report...');
  
  // Run the task reference manager with visualize-only flag
  execSync('node scripts/task-management/enhanced-task-reference.js --visualize-only', {
    stdio: 'inherit'
  });
  
  console.log('✅ Task-to-code relationship report updated');
} catch (error) {
  console.error(`Error updating task-to-code report: ${error.message}`);
  // Don't block the commit as this is a post-commit hook
  process.exit(0);
} 