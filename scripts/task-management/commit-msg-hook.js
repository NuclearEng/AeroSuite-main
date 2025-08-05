#!/usr/bin/env node

/**
 * Git commit-msg hook for enforcing task reference in commit messages
 * 
 * This script checks if the commit message contains a valid task ID
 * and provides suggestions if it doesn't.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the commit message file path from the command line
const commitMsgFile = process.argv[2];

if (!commitMsgFile) {
  console.error('❌ Error: No commit message file provided');
  process.exit(1);
}

// Read the commit message
const commitMsg = fs.readFileSync(commitMsgFile, 'utf8').trim();

// Skip merge commits
if (commitMsg.startsWith('Merge ')) {
  process.exit(0);
}

// Define task ID pattern
const TASK_ID_PATTERN = /^\[(TS|SEC|AI|PERF|DEV)\d{3}\]/;

// Check if the commit message starts with a task ID
if (!TASK_ID_PATTERN.test(commitMsg)) {
  console.error('❌ Error: Commit message must include a task ID in square brackets.');
  console.error('Example: [TS123] Implement feature X\n');
  console.error(`Current message: ${commitMsg}\n`);
  
  // Attempt to suggest task IDs based on changed files
  try {
    // Get the task file path
    const taskFilePath = path.join(process.cwd(), 'task.md');
    
    // Check if task.md exists
    if (fs.existsSync(taskFilePath)) {
      // Parse task.md
      const taskContent = fs.readFileSync(taskFilePath, 'utf-8');
      const taskMap = new Map();
      
      // Regular expression to match task entries
      const taskRegex = /\|\s*(TS\d{3}|SEC\d{3}|AI\d{3}|PERF\d{3}|DEV\d{3})\s*\|\s*([^|]+)\|\s*([^|]+)\|/g;
      
      let match;
      while ((match = taskRegex.exec(taskContent)) !== null) {
        const taskId = match[1].trim();
        const title = match[2].trim();
        const status = match[3].trim();
        
        taskMap.set(taskId, { title, status });
      }
      
      // Get staged files to determine which task the commit might be related to
      try {
        // Use a different approach to get staged files that works in the hook environment
        const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
          .trim().split('\n').filter(Boolean);
        
        if (stagedFiles.length > 0) {
          // Try to find task references in the staged files
          const taskReferences = new Set();
          
          for (const file of stagedFiles) {
            try {
              // Check if the file exists (it might have been deleted)
              if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf-8');
                
                // Look for @task annotations
                const taskPattern = /@task\s+(TS|SEC|AI|PERF|DEV)\d{3}/g;
                let taskMatch;
                while ((taskMatch = taskPattern.exec(content)) !== null) {
                  const taskId = taskMatch[0].replace('@task', '').trim();
                  taskReferences.add(taskId);
                }
              }
            } catch (err) {
              // Skip files that can't be read
            }
          }
          
          if (taskReferences.size > 0) {
            console.error('Suggested task IDs based on file references:');
            for (const taskId of taskReferences) {
              if (taskMap.has(taskId)) {
                console.error(`  [${taskId}] ${taskMap.get(taskId).title}`);
              } else {
                console.error(`  [${taskId}]`);
              }
            }
          } else {
            // If no task references found in files, suggest in-progress tasks
            const inProgressTasks = Array.from(taskMap.entries())
              .filter(([_, info]) => info.status.includes('🔄'))
              .map(([id, info]) => ({ id, title: info.title }));
            
            if (inProgressTasks.length > 0) {
              console.error('Suggested task IDs based on in-progress tasks:');
              inProgressTasks.forEach(task => {
                console.error(`  [${task.id}] ${task.title}`);
              });
            }
          }
        }
      } catch (err) {
        // Continue without suggestions if there's an error
      }
    }
  } catch (err) {
    // Continue without suggestions if there's an error
  }
  
  console.error('\nValid task ID prefixes: TS, SEC, AI, PERF, DEV');
  console.error('If this is a minor change that doesn\'t relate to a task, use [NOJIRA]');
  
  process.exit(1);
}

// Success
process.exit(0); 