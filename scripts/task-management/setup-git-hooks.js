#!/usr/bin/env node

/**
 * Setup Git Hooks
 * 
 * This script sets up Git hooks for enforcing task traceability:
 * - commit-msg: Enforces task ID in commit messages
 * - pre-commit: Checks if files have task references
 * - post-commit: Updates task-to-code relationship report
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Setting up Git hooks for task traceability...');

// Get the project root directory
const projectRoot = process.cwd();

// Ensure the Git hooks directory exists
const gitHooksDir = path.join(projectRoot, '.git', 'hooks');
if (!fs.existsSync(gitHooksDir)) {
  console.error('❌ Error: .git/hooks directory not found. Are you in a Git repository?');
  process.exit(1);
}

// Define hooks to set up
const hooks = [
  {
    name: 'commit-msg',
    source: path.join(projectRoot, 'scripts', 'task-management', 'commit-msg-hook.js'),
    target: path.join(gitHooksDir, 'commit-msg')
  },
  {
    name: 'pre-commit',
    source: path.join(projectRoot, 'scripts', 'task-management', 'pre-commit-hook.js'),
    target: path.join(gitHooksDir, 'pre-commit')
  },
  {
    name: 'post-commit',
    source: path.join(projectRoot, 'scripts', 'task-management', 'post-commit-hook.js'),
    target: path.join(gitHooksDir, 'post-commit')
  }
];

// Set up each hook
for (const hook of hooks) {
  try {
    // Check if the source file exists
    if (!fs.existsSync(hook.source)) {
      console.log(`Creating ${hook.name} hook script...`);
      
      // Create the appropriate hook script based on the hook name
      if (hook.name === 'commit-msg') {
        createCommitMsgHook(hook.source);
      } else if (hook.name === 'pre-commit') {
        createPreCommitHook(hook.source);
      } else if (hook.name === 'post-commit') {
        createPostCommitHook(hook.source);
      }
    }
    
    // Copy the hook script to the Git hooks directory
    console.log(`Setting up ${hook.name} hook...`);
    fs.copyFileSync(hook.source, hook.target);
    
    // Make the hook executable
    fs.chmodSync(hook.target, '755');
    
    console.log(`✅ ${hook.name} hook installed successfully`);
  } catch (error) {
    console.error(`❌ Error setting up ${hook.name} hook: ${error.message}`);
  }
}

console.log('\n🎉 Git hooks setup complete!');
console.log('Task traceability is now enforced for this repository.');

/**
 * Create the commit-msg hook script if it doesn't exist
 * @param {string} filePath Path to the script file
 */
function createCommitMsgHook(filePath) {
  const script = `#!/usr/bin/env node

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
const TASK_ID_PATTERN = /^\\[(TS|SEC|AI|PERF|DEV)\\d{3}\\]/;

// Check if the commit message starts with a task ID
if (!TASK_ID_PATTERN.test(commitMsg)) {
  console.error('❌ Error: Commit message must include a task ID in square brackets.');
  console.error('Example: [TS123] Implement feature X\\n');
  console.error(\`Current message: \${commitMsg}\\n\`);
  
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
      const taskRegex = /\\|\\s*(TS\\d{3}|SEC\\d{3}|AI\\d{3}|PERF\\d{3}|DEV\\d{3})\\s*\\|\\s*([^|]+)\\|\\s*([^|]+)\\|/g;
      
      let match;
      while ((match = taskRegex.exec(taskContent)) !== null) {
        const taskId = match[1].trim();
        const title = match[2].trim();
        const status = match[3].trim();
        
        taskMap.set(taskId, { title, status });
      }
      
      // Get staged files to determine which task the commit might be related to
      try {
        const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
          .trim().split('\\n').filter(Boolean);
        
        if (stagedFiles.length > 0) {
          // Try to find task references in the staged files
          const taskReferences = new Set();
          
          for (const file of stagedFiles) {
            try {
              // Check if the file exists (it might have been deleted)
              if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf-8');
                
                // Look for @task annotations
                const taskPattern = /@task\\s+(TS|SEC|AI|PERF|DEV)\\d{3}/g;
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
                console.error(\`  [\${taskId}] \${taskMap.get(taskId).title}\`);
              } else {
                console.error(\`  [\${taskId}]\`);
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
                console.error(\`  [\${task.id}] \${task.title}\`);
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
  
  console.error('\\nValid task ID prefixes: TS, SEC, AI, PERF, DEV');
  console.error('If this is a minor change that doesn\\'t relate to a task, use [NOJIRA]');
  
  process.exit(1);
}

// Success
process.exit(0);`;

  fs.writeFileSync(filePath, script);
  fs.chmodSync(filePath, '755');
}

/**
 * Create the pre-commit hook script if it doesn't exist
 * @param {string} filePath Path to the script file
 */
function createPreCommitHook(filePath) {
  const script = `#!/usr/bin/env node

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
    .trim().split('\\n').filter(Boolean);
  
  // Skip certain files and directories
  const skipPatterns = [
    /node_modules/,
    /\\.git/,
    /package-lock\\.json/,
    /yarn\\.lock/,
    /\\.lock$/,
    /\\.md$/,
    /\\.json$/,
    /\\.png$/,
    /\\.jpg$/,
    /\\.svg$/,
    /\\.ico$/,
    /\\.env/
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
        const taskPattern = /@task\\s+(TS|SEC|AI|PERF|DEV)\\d{3}/;
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
    console.warn('⚠️  Warning: The following files are missing task references:\\n');
    
    for (const file of filesWithoutReferences) {
      console.warn(\`  \${file}\`);
    }
    
    console.warn('\\nConsider adding task references with: node scripts/task-management/task-reference-adder.js');
    console.warn('\\nTo bypass this check, use: git commit --no-verify');
    
    process.exit(1);
  }
  
  // Success
  console.log('✅ All checked files have task references.');
  process.exit(0);
} catch (error) {
  console.error(\`Error checking task references: \${error.message}\`);
  // Don't block the commit if there's an error in the hook
  process.exit(0);
}`;

  fs.writeFileSync(filePath, script);
  fs.chmodSync(filePath, '755');
}

/**
 * Create the post-commit hook script if it doesn't exist
 * @param {string} filePath Path to the script file
 */
function createPostCommitHook(filePath) {
  const script = `#!/usr/bin/env node

/**
 * Git post-commit hook for updating task-to-code relationship report
 * 
 * This script runs after a commit to update the task-to-code relationship report.
 */

const { execSync } = require('child_process');

try {
  // Run the task reference manager with visualize-only flag
  execSync('node scripts/task-management/enhanced-task-reference.js --visualize-only', {
    stdio: 'inherit'
  });
} catch (error) {
  console.error(\`Error updating task-to-code report: \${error.message}\`);
  // Don't block the commit as this is a post-commit hook
  process.exit(0);
}`;

  fs.writeFileSync(filePath, script);
  fs.chmodSync(filePath, '755');
} 