#!/usr/bin/env node

/**
 * Refactoring Workflow Script
 * 
 * This script works methodically through the refactor-tasks.md file,
 * prompting for code review and implementation of each task.
 * It requires manual approval before moving to the next task.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Use colors directly without chalk
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: {
    blue: (text) => `\x1b[1m\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[1m\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[1m\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[1m\x1b[33m${text}\x1b[0m`,
    cyan: (text) => `\x1b[1m\x1b[36m${text}\x1b[0m`
  }
};

// Configuration
const TASKS_FILE = path.join(__dirname, '..', 'refactor-tasks.md');
const COMPLETED_STATUS = '✅ Completed';
const TODO_STATUS = '⬜ Todo';
const IN_PROGRESS_STATUS = '🔄 In Progress';
const IN_REVIEW_STATUS = '🔍 In Review';

/**
 * Parse the refactor tasks file
 * @returns {Array} Parsed tasks
 */
function parseTasks() {
  const content = fs.readFileSync(TASKS_FILE, 'utf8');
  const lines = content.split('\n');
  
  const tasks = [];
  let currentPhase = null;
  
  for (const line of lines) {
    // Extract phase headers
    if (line.startsWith('## ') && !line.includes('Status') && !line.includes('Priority') && !line.includes('Definition')) {
      currentPhase = line.replace('## ', '').trim();
      continue;
    }
    
    // Extract task data from table rows
    if (line.startsWith('| RF') && line.includes('|')) {
      const columns = line.split('|').map(col => col.trim()).filter(col => col);
      
      if (columns.length >= 6) {
        const [id, title, status, priority, dependencies, loc] = columns;
        
        tasks.push({
          id,
          title,
          status,
          priority,
          dependencies: dependencies.split(',').map(dep => dep.trim()).filter(dep => dep !== '-'),
          loc: parseInt(loc) || 0,
          phase: currentPhase,
          lineNumber: lines.indexOf(line)
        });
      }
    }
  }
  
  return tasks;
}

/**
 * Check if all dependencies are completed
 * @param {Object} task - Task to check
 * @param {Array} allTasks - All tasks
 * @returns {boolean} - True if all dependencies are completed
 */
function areDependenciesCompleted(task, allTasks) {
  if (!task.dependencies || task.dependencies.length === 0) {
    return true;
  }
  
  return task.dependencies.every(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return depTask && depTask.status.includes(COMPLETED_STATUS);
  });
}

/**
 * Update task status
 * @param {string} taskId - Task ID to update
 * @param {string} status - New status
 * @param {number} loc - Lines of code (optional)
 */
function updateTaskStatus(taskId, status, loc) {
  const args = [taskId, status];
  if (loc !== undefined) {
    args.push(loc);
  }
  
  try {
    execSync(`node ${path.join(__dirname, 'update-task-status.js')} ${args.join(' ')}`, {
      stdio: 'inherit'
    });
  } catch (error) {
    console.error(colors.red(`Error updating task status: ${error.message}`));
  }
}

/**
 * Create interactive CLI
 */
async function runWorkflow() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Promisify readline question
  const question = (query) => new Promise((resolve) => rl.question(query, resolve));
  
  console.log(colors.bold.blue('\n===== AeroSuite Refactoring Workflow =====\n'));
  
  let tasks = parseTasks();
  let todoTasks = tasks.filter(task => !task.status.includes(COMPLETED_STATUS));
  
  if (todoTasks.length === 0) {
    console.log(colors.green('All tasks are completed! 🎉'));
    rl.close();
    return;
  }
  
  console.log(colors.yellow(`${todoTasks.length} tasks remaining to be completed.\n`));
  
  // Sort tasks by dependencies and priority
  todoTasks.sort((a, b) => {
    // First check if dependencies are completed
    const aDepsCompleted = areDependenciesCompleted(a, tasks);
    const bDepsCompleted = areDependenciesCompleted(b, tasks);
    
    if (aDepsCompleted && !bDepsCompleted) return -1;
    if (!aDepsCompleted && bDepsCompleted) return 1;
    
    // Then check priority (High > Medium > Low)
    const priorityOrder = { '🔴 High': 0, '🟠 Medium': 1, '🔵 Low': 2 };
    const aPriority = priorityOrder[a.priority] || 3;
    const bPriority = priorityOrder[b.priority] || 3;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Finally, sort by ID
    return a.id.localeCompare(b.id);
  });
  
  // Filter for tasks that have all dependencies completed
  const readyTasks = todoTasks.filter(task => areDependenciesCompleted(task, tasks));
  
  if (readyTasks.length === 0) {
    console.log(colors.yellow('No tasks are ready to be worked on. Complete the dependencies first.'));
    rl.close();
    return;
  }
  
  // Show the next task to work on
  const nextTask = readyTasks[0];
  
  console.log(colors.bold.cyan('Next task to work on:'));
  console.log(colors.cyan(`ID: ${nextTask.id}`));
  console.log(colors.cyan(`Title: ${nextTask.title}`));
  console.log(colors.cyan(`Priority: ${nextTask.priority}`));
  console.log(colors.cyan(`Phase: ${nextTask.phase}`));
  
  if (nextTask.dependencies.length > 0) {
    console.log(colors.cyan(`Dependencies: ${nextTask.dependencies.join(', ')}`));
  }
  
  // Ask if the user wants to work on this task
  const workOnTask = await question(colors.bold.yellow('\nDo you want to work on this task? (y/n): '));
  
  if (workOnTask.toLowerCase() !== 'y') {
    console.log(colors.yellow('\nWorkflow stopped. Run the script again when ready.'));
    rl.close();
    return;
  }
  
  // Mark the task as in progress
  updateTaskStatus(nextTask.id, 'in-progress');
  
  // Display the prompt for code review and implementation
  console.log(colors.bold.green('\n===== Task Implementation =====\n'));
  console.log(colors.bold.cyan(`Review and write code for ${nextTask.id}: ${nextTask.title}`));
  console.log(colors.yellow('\nImplement the task and then continue with this workflow.'));
  
  // Ask if the implementation is complete
  const implementationComplete = await question(colors.bold.yellow('\nIs the implementation complete? (y/n): '));
  
  if (implementationComplete.toLowerCase() !== 'y') {
    console.log(colors.yellow('\nTask marked as in progress. Continue implementation and run the script again when ready.'));
    rl.close();
    return;
  }
  
  // Ask for lines of code
  const locInput = await question(colors.bold.yellow('\nHow many lines of code were written? '));
  const loc = parseInt(locInput);
  
  // Ask if the code needs review
  const needsReview = await question(colors.bold.yellow('\nDoes the code need review before marking as completed? (y/n): '));
  
  if (needsReview.toLowerCase() === 'y') {
    // Mark the task as in review
    updateTaskStatus(nextTask.id, 'in-review', loc);
    console.log(colors.yellow('\nTask marked as in review. Run the script again after review.'));
  } else {
    // Mark the task as completed
    updateTaskStatus(nextTask.id, 'completed', loc);
    console.log(colors.green('\nTask marked as completed! 🎉'));
    
    // Show progress
    tasks = parseTasks();
    const completedCount = tasks.filter(task => task.status.includes(COMPLETED_STATUS)).length;
    const totalCount = tasks.length;
    const progressPercentage = (completedCount / totalCount * 100).toFixed(2);
    
    console.log(colors.bold.green(`\nOverall Progress: ${completedCount}/${totalCount} (${progressPercentage}%)`));
  }
  
  // Ask if the user wants to continue with the next task
  const continueWorkflow = await question(colors.bold.yellow('\nDo you want to continue with the next task? (y/n): '));
  
  if (continueWorkflow.toLowerCase() === 'y') {
    rl.close();
    // Run the workflow again
    runWorkflow();
  } else {
    console.log(colors.yellow('\nWorkflow stopped. Run the script again when ready.'));
    rl.close();
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await runWorkflow();
  } catch (error) {
    console.error(colors.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

// Run the script
main(); 