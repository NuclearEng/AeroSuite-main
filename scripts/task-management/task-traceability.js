#!/usr/bin/env node

/**
 * Task-Code Traceability System for AeroSuite
 * 
 * This script:
 * 1. Scans the codebase for task references in comments
 * 2. Checks completed tasks in task.md to verify implementation
 * 3. Generates a task-to-code mapping document
 * 4. Reports on traceability gaps
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const MAPPING_FILE_PATH = path.join(process.cwd(), 'task-code-mapping.md');
const README_PATH = path.join(process.cwd(), 'README.md');

// Task ID patterns
const TASK_ID_PATTERNS = [
  /Task:\s*(TS\d{3})/i,
  /Task:\s*(SEC\d{3})/i,
  /Task:\s*(AI\d{3})/i,
  /Task:\s*(PERF\d{3})/i,
  /Task:\s*(DEV\d{3})/i,
  /Task ID:\s*(TS\d{3})/i,
  /Task ID:\s*(SEC\d{3})/i,
  /Task ID:\s*(AI\d{3})/i,
  /Task ID:\s*(PERF\d{3})/i,
  /Task ID:\s*(DEV\d{3})/i,
  /\[Task:\s*(TS\d{3})\]/i,
  /\[Task:\s*(SEC\d{3})\]/i,
  /\[Task:\s*(AI\d{3})\]/i,
  /\[Task:\s*(PERF\d{3})\]/i,
  /\[Task:\s*(DEV\d{3})\]/i,
  /\[TS\d{3}\]/i,
  /\[SEC\d{3}\]/i,
  /\[AI\d{3}\]/i,
  /\[PERF\d{3}\]/i,
  /\[DEV\d{3}\]/i,
];

// File extensions to scan
const CODE_FILE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.php',
  '.html', '.css', '.scss', '.vue', '.go', '.rb', '.c', '.cpp'
];

// Directories to ignore
const IGNORE_DIRS = [
  'node_modules', 'build', 'dist', '.git',
  'coverage', '.vscode', '.idea', 'public/assets'
];

// Task status emojis for parsing task.md
const COMPLETED_STATUS = '✅ Completed';

// Main function
async function runTraceabilityAnalysis() {
  try {
    console.log('🔍 Starting task-code traceability analysis...');
    
    // Read task file to extract tasks
    const tasks = extractTasksFromTaskFile();
    console.log(`Found ${tasks.size} tasks in task.md`);
    
    // Count completed tasks
    const completedTasks = new Set();
    for (const [id, task] of tasks.entries()) {
      if (task.status === COMPLETED_STATUS) {
        completedTasks.add(id);
      }
    }
    console.log(`Found ${completedTasks.size} completed tasks`);
    
    // Scan codebase for task references
    const fileTaskMap = scanCodebaseForTaskReferences();
    
    // Create a mapping of tasks to files
    const taskFileMap = createTaskToFileMapping(fileTaskMap);
    
    // Analyze traceability gaps
    const { missingReferences, filesWithoutTasks } = analyzeTraceabilityGaps(tasks, taskFileMap, completedTasks);
    
    // Generate the mapping document
    generateMappingDocument(tasks, taskFileMap, missingReferences, filesWithoutTasks);
    
    // Generate traceability stats
    const stats = generateTraceabilityStats(tasks, taskFileMap, completedTasks);
    
    console.log('\n📊 Traceability Analysis Complete:');
    console.log(`- Total tasks: ${tasks.size}`);
    console.log(`- Completed tasks: ${completedTasks.size}`);
    console.log(`- Tasks with code references: ${Object.keys(taskFileMap).length}`);
    console.log(`- Files with task references: ${Object.keys(fileTaskMap).length}`);
    console.log(`- Completed tasks missing code references: ${missingReferences.length}`);
    console.log(`- Traceability coverage: ${stats.coveragePercentage.toFixed(2)}%`);
    console.log(`\n📝 Task-code mapping document generated: ${MAPPING_FILE_PATH}`);
    
    // Update README with badge if coverage is low
    if (stats.coveragePercentage < 50) {
      console.log('\n⚠️  Warning: Task-code traceability is below 50%');
      console.log('   Consider improving task references in your codebase');
    }
    
  } catch (error) {
    console.error('Error running traceability analysis:', error);
    process.exit(1);
  }
}

// Extract tasks from task.md
function extractTasksFromTaskFile() {
  const taskMap = new Map();
  
  try {
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Parse task rows from the markdown table
      if (line.startsWith('|') && !line.includes('---') && !line.includes('ID')) {
        const columns = line.split('|').map(col => col.trim()).filter(Boolean);
        
        if (columns.length >= 5) { // At least ID, Title, Status, Priority, Dependencies
          const id = columns[0];
          const title = columns[1];
          const status = columns[2];
          const priority = columns[3];
          const dependencies = columns[4];
          
          // Only add if it's a valid task ID
          if (/^(TS|SEC|AI|PERF|DEV)\d{3}$/.test(id)) {
            taskMap.set(id, {
              id,
              title,
              status,
              priority,
              dependencies,
              files: []
            });
          }
        }
      }
    }
    
    return taskMap;
  } catch (error) {
    console.error('Error reading task file:', error);
    return new Map();
  }
}

// Scan codebase for task references in comments
function scanCodebaseForTaskReferences() {
  const fileTaskMap = {};
  
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip ignored directories
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.includes(entry.name)) {
          scanDirectory(fullPath);
        }
        continue;
      }
      
      // Only process code files
      const ext = path.extname(entry.name).toLowerCase();
      if (!CODE_FILE_EXTENSIONS.includes(ext)) {
        continue;
      }
      
      // Read file and look for task references
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const taskIds = extractTaskIdsFromContent(content);
        
        if (taskIds.length > 0) {
          // Store relative path from project root
          const relativePath = path.relative(process.cwd(), fullPath);
          fileTaskMap[relativePath] = taskIds;
        }
      } catch (error) {
        console.error(`Error reading file ${fullPath}:`, error.message);
      }
    }
  }
  
  // Start scanning from project root
  scanDirectory(process.cwd());
  return fileTaskMap;
}

// Extract task IDs from file content
function extractTaskIdsFromContent(content) {
  const taskIds = new Set();
  
  // Check each pattern
  for (const pattern of TASK_ID_PATTERNS) {
    const matches = content.match(new RegExp(pattern, 'g'));
    if (matches) {
      for (const match of matches) {
        const idMatch = match.match(pattern);
        if (idMatch && idMatch[1]) {
          taskIds.add(idMatch[1]);
        } else {
          // Handle the case for patterns like [TS123]
          const directMatch = match.match(/\[(TS|SEC|AI|PERF|DEV)(\d{3})\]/i);
          if (directMatch) {
            taskIds.add(`${directMatch[1]}${directMatch[2]}`);
          }
        }
      }
    }
  }
  
  return Array.from(taskIds);
}

// Create a mapping of tasks to files
function createTaskToFileMapping(fileTaskMap) {
  const taskFileMap = {};
  
  for (const [file, taskIds] of Object.entries(fileTaskMap)) {
    for (const taskId of taskIds) {
      if (!taskFileMap[taskId]) {
        taskFileMap[taskId] = [];
      }
      taskFileMap[taskId].push(file);
    }
  }
  
  return taskFileMap;
}

// Analyze gaps in traceability
function analyzeTraceabilityGaps(tasks, taskFileMap, completedTasks) {
  const missingReferences = [];
  
  // Find completed tasks without code references
  for (const taskId of completedTasks) {
    if (!taskFileMap[taskId]) {
      missingReferences.push(taskId);
    }
  }
  
  // Find files without task references
  const filesWithTasks = new Set();
  Object.values(taskFileMap).forEach(files => {
    files.forEach(file => filesWithTasks.add(file));
  });
  
  const allCodeFiles = findAllCodeFiles();
  const filesWithoutTasks = allCodeFiles.filter(file => !filesWithTasks.has(file));
  
  return { missingReferences, filesWithoutTasks };
}

// Find all code files in the project
function findAllCodeFiles() {
  try {
    // Use git to list all tracked files with code extensions
    const extensions = CODE_FILE_EXTENSIONS.map(ext => `*${ext}`).join(' ');
    const cmd = `git ls-files -- ${extensions}`;
    const result = execSync(cmd, { encoding: 'utf8' });
    
    return result.split('\n').filter(Boolean).filter(file => {
      const parts = file.split('/');
      return !parts.some(part => IGNORE_DIRS.includes(part));
    });
  } catch (error) {
    console.error('Error finding code files:', error.message);
    return [];
  }
}

// Generate statistics on traceability
function generateTraceabilityStats(tasks, taskFileMap, completedTasks) {
  const completedTasksWithReferences = Array.from(completedTasks)
    .filter(taskId => taskFileMap[taskId]);
  
  const coveragePercentage = completedTasks.size > 0
    ? (completedTasksWithReferences.length / completedTasks.size) * 100
    : 0;
  
  return {
    totalTasks: tasks.size,
    completedTasks: completedTasks.size,
    tasksWithReferences: Object.keys(taskFileMap).length,
    completedTasksWithReferences: completedTasksWithReferences.length,
    coveragePercentage
  };
}

// Generate the mapping document
function generateMappingDocument(tasks, taskFileMap, missingReferences, filesWithoutTasks) {
  let content = `# Task-Code Mapping for AeroSuite\n\n`;
  content += `*Generated on ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  // Add summary section
  content += `## Summary\n\n`;
  content += `- Total tasks: ${tasks.size}\n`;
  content += `- Tasks with code references: ${Object.keys(taskFileMap).length}\n`;
  content += `- Completed tasks missing code references: ${missingReferences.length}\n`;
  content += `- Files without task references: ${filesWithoutTasks.length}\n\n`;
  
  // Add tasks with code references
  content += `## Tasks with Code References\n\n`;
  content += `| Task ID | Task Title | Status | Files |\n`;
  content += `|---------|------------|--------|-------|\n`;
  
  const sortedTaskIds = Object.keys(taskFileMap).sort();
  for (const taskId of sortedTaskIds) {
    const task = tasks.get(taskId);
    if (task) {
      const filesList = taskFileMap[taskId].map(file => `\`${file}\``).join(', ');
      content += `| ${taskId} | ${task.title} | ${task.status} | ${filesList} |\n`;
    } else {
      content += `| ${taskId} | *Not found in task.md* | - | ${taskFileMap[taskId].map(file => `\`${file}\``).join(', ')} |\n`;
    }
  }
  
  // Add completed tasks missing code references
  if (missingReferences.length > 0) {
    content += `\n## Completed Tasks Missing Code References\n\n`;
    content += `| Task ID | Task Title | Priority |\n`;
    content += `|---------|------------|----------|\n`;
    
    for (const taskId of missingReferences.sort()) {
      const task = tasks.get(taskId);
      if (task) {
        content += `| ${taskId} | ${task.title} | ${task.priority} |\n`;
      }
    }
  }
  
  // Add files without task references (limited to top 20)
  if (filesWithoutTasks.length > 0) {
    content += `\n## Files Without Task References (Top 20)\n\n`;
    content += `These files should be reviewed and associated with appropriate tasks:\n\n`;
    
    const topFiles = filesWithoutTasks.slice(0, 20);
    for (const file of topFiles) {
      content += `- \`${file}\`\n`;
    }
    
    if (filesWithoutTasks.length > 20) {
      content += `\n*...and ${filesWithoutTasks.length - 20} more files*\n`;
    }
  }
  
  // Add instructions for improving traceability
  content += `\n## How to Improve Traceability\n\n`;
  content += `1. **Add task references to code files**: Include a comment with the task ID at the top of each file or relevant function.\n`;
  content += `   Example: \`// Task: TS123 - Feature implementation\`\n\n`;
  content += `2. **Include task IDs in commit messages**: Start commit messages with the task ID in square brackets.\n`;
  content += `   Example: \`[TS123] Implement feature X\`\n\n`;
  content += `3. **Update this mapping**: Run \`node scripts/task-management/task-traceability.js\` to update this document.\n\n`;
  content += `4. **Address gaps**: Focus on adding references to completed tasks that are missing code references.\n`;
  
  // Write the mapping document
  fs.writeFileSync(MAPPING_FILE_PATH, content);
}

// Run the main function
runTraceabilityAnalysis(); 