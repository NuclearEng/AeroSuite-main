#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');

// Main function
async function validateDependencies() {
  try {
    console.log('Reading task file...');
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    
    // Extract tasks
    const tasks = extractTasks(content);
    
    // Validate dependencies
    const { missingDependencies, circularDependencies, blockedTasks } = checkDependencies(tasks);
    
    // Print results
    printResults(tasks, missingDependencies, circularDependencies, blockedTasks);
    
  } catch (error) {
    console.error('Error validating task dependencies:', error);
    process.exit(1);
  }
}

// Extract tasks from content
function extractTasks(content) {
  const tasks = {};
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Only process table rows
    if (line.startsWith('|') && line.includes('|')) {
      // Skip table headers and dividers
      if (line.includes('ID') || line.includes('------')) continue;
      
      const task = parseTaskRow(line);
      if (task) {
        tasks[task.id] = task;
      }
    }
  }
  
  return tasks;
}

// Parse a task row from the table
function parseTaskRow(line) {
  const parts = line.split('|').map(part => part.trim());
  
  if (parts.length < 7) return null;
  
  // Skip header rows and divider rows
  if (parts[1] === 'ID' || parts[1].includes('-----')) return null;
  
  return {
    id: parts[1],
    title: parts[2],
    status: parts[3],
    priority: parts[4],
    dependencies: parseDependencies(parts[5]),
    loc: parts[6]
  };
}

// Parse dependencies field
function parseDependencies(dependenciesStr) {
  if (dependenciesStr === '-' || !dependenciesStr) return [];
  
  // Handle comma-separated dependencies
  return dependenciesStr.split(',').map(dep => dep.trim()).filter(Boolean);
}

// Check for dependency issues
function checkDependencies(tasks) {
  const missingDependencies = [];
  const circularDependencies = [];
  const blockedTasks = [];
  
  // Check for missing dependencies
  for (const taskId in tasks) {
    const task = tasks[taskId];
    
    for (const depId of task.dependencies) {
      if (!tasks[depId] && depId !== '-') {
        missingDependencies.push({ taskId, depId });
      }
    }
    
    // Check if task should be blocked
    if (task.status !== '⚠️ Blocked' && task.dependencies.length > 0) {
      const shouldBeBlocked = task.dependencies.some(depId => {
        return tasks[depId] && !isTaskCompleted(tasks[depId].status);
      });
      
      if (shouldBeBlocked) {
        blockedTasks.push(taskId);
      }
    }
  }
  
  // Check for circular dependencies
  for (const taskId in tasks) {
    const task = tasks[taskId];
    const visited = new Set();
    const path = [taskId];
    
    if (findCircularDependency(tasks, taskId, visited, path)) {
      circularDependencies.push([...path]);
    }
  }
  
  return { missingDependencies, circularDependencies, blockedTasks };
}

// Helper function to find circular dependencies
function findCircularDependency(tasks, taskId, visited, path) {
  if (!tasks[taskId]) return false;
  
  visited.add(taskId);
  
  for (const depId of tasks[taskId].dependencies) {
    if (!tasks[depId]) continue;
    
    if (visited.has(depId)) {
      path.push(depId);
      return true;
    }
    
    path.push(depId);
    if (findCircularDependency(tasks, depId, new Set([...visited]), path)) {
      return true;
    }
    path.pop();
  }
  
  return false;
}

// Check if a task is completed
function isTaskCompleted(status) {
  return status === '✅ Completed';
}

// Print validation results
function printResults(tasks, missingDependencies, circularDependencies, blockedTasks) {
  console.log('\nDependency Validation Results:');
  console.log('=============================\n');
  
  // Missing dependencies
  if (missingDependencies.length > 0) {
    console.log(`Found ${missingDependencies.length} missing dependencies:`);
    missingDependencies.forEach(({ taskId, depId }) => {
      console.log(`  - Task ${taskId} (${tasks[taskId].title}) depends on ${depId} which does not exist`);
    });
  } else {
    console.log('No missing dependencies found.');
  }
  
  console.log('');
  
  // Circular dependencies
  if (circularDependencies.length > 0) {
    console.log(`Found ${circularDependencies.length} circular dependencies:`);
    circularDependencies.forEach(path => {
      console.log(`  - Circular dependency: ${path.join(' → ')}`);
    });
  } else {
    console.log('No circular dependencies found.');
  }
  
  console.log('');
  
  // Tasks that should be blocked
  if (blockedTasks.length > 0) {
    console.log(`Found ${blockedTasks.length} tasks that should be marked as blocked:`);
    blockedTasks.forEach(taskId => {
      console.log(`  - Task ${taskId} (${tasks[taskId].title}) depends on incomplete tasks`);
    });
  } else {
    console.log('All tasks have correct blocked status.');
  }
  
  console.log('\nTotal issues found:');
  console.log(`  - Missing dependencies: ${missingDependencies.length}`);
  console.log(`  - Circular dependencies: ${circularDependencies.length}`);
  console.log(`  - Tasks needing blocked status: ${blockedTasks.length}`);
}

// Run the main function
validateDependencies(); 