#!/usr/bin/env node

/**
 * This script validates that task dependencies in task.md refer to valid task IDs
 * It is triggered automatically by Cursor when task.md is changed
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TASK_FILE = path.join(process.cwd(), 'task.md');

/**
 * Parse the task.md file and extract tasks and dependencies
 * @returns {Object} Object containing tasks and their dependencies
 */
function parseTaskFile() {
  try {
    const taskContent = fs.readFileSync(TASK_FILE, 'utf8');
    const taskIds = new Set();
    const taskDependencies = new Map();
    
    // Extract tasks using regex
    const taskRegex = /\|\s*(TS\d+)\s*\|.*?\|.*?\|.*?\|\s*(.*?)\s*\|/g;
    
    let match;
    while ((match = taskRegex.exec(taskContent)) !== null) {
      const taskId = match[1].trim();
      const dependencies = match[2].trim();
      
      taskIds.add(taskId);
      
      if (dependencies && dependencies !== '-') {
        // Split and clean dependencies
        const deps = dependencies.split(',').map(dep => dep.trim()).filter(dep => dep !== '');
        taskDependencies.set(taskId, deps);
      } else {
        taskDependencies.set(taskId, []);
      }
    }
    
    return { taskIds, taskDependencies };
  } catch (error) {
    console.error(`Error parsing task file: ${error.message}`);
    return { taskIds: new Set(), taskDependencies: new Map() };
  }
}

/**
 * Validate that all task dependencies reference valid task IDs
 * @returns {Object} Validation result
 */
function validateTaskDependencies() {
  const { taskIds, taskDependencies } = parseTaskFile();
  
  if (taskIds.size === 0) {
    return { valid: false, errors: ['No tasks found in task.md'] };
  }
  
  const errors = [];
  
  // Check each task's dependencies
  for (const [taskId, dependencies] of taskDependencies.entries()) {
    for (const dependency of dependencies) {
      if (!taskIds.has(dependency)) {
        errors.push(`Task ${taskId} has invalid dependency: ${dependency}`);
      }
    }
  }
  
  // Check for circular dependencies
  const circularDeps = findCircularDependencies(taskDependencies);
  circularDeps.forEach(cycle => {
    errors.push(`Circular dependency detected: ${cycle.join(' -> ')}`);
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Find circular dependencies in the task dependency graph
 * @param {Map<string, string[]>} taskDependencies Map of task IDs to their dependencies
 * @returns {Array<string[]>} Array of circular dependency chains
 */
function findCircularDependencies(taskDependencies) {
  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();
  
  function dfs(taskId, path = []) {
    if (recursionStack.has(taskId)) {
      // Found a cycle
      const cycleStart = path.indexOf(taskId);
      cycles.push(path.slice(cycleStart).concat(taskId));
      return;
    }
    
    if (visited.has(taskId)) {
      return;
    }
    
    visited.add(taskId);
    recursionStack.add(taskId);
    path.push(taskId);
    
    const dependencies = taskDependencies.get(taskId) || [];
    for (const dep of dependencies) {
      dfs(dep, [...path]);
    }
    
    recursionStack.delete(taskId);
  }
  
  // Run DFS from each task
  for (const taskId of taskDependencies.keys()) {
    dfs(taskId);
  }
  
  return cycles;
}

/**
 * Main function
 */
function main() {
  console.log('Validating task dependencies...');
  
  const validation = validateTaskDependencies();
  
  if (validation.valid) {
    console.log('All task dependencies are valid');
    process.exit(0);
  } else {
    console.error('Task dependency validation failed:');
    validation.errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
}

// Run the main function
main(); 