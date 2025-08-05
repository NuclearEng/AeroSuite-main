#!/usr/bin/env node

/**
 * This script checks for task references in code files that are missing from task.md
 * It is triggered automatically by Cursor when a file with task references is changed
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const TASK_FILE = path.join(process.cwd(), 'task.md');
const CODE_TASK_COMMENT_REGEX = /\/\/\s*Task:\s*(TS\d+)(\s*-\s*Status:\s*(Todo|In Progress|In Review|Completed))?/g;

/**
 * Parse the task.md file and extract task IDs
 * @returns {Set<string>} Set of task IDs
 */
function parseTaskFile() {
  try {
    const taskContent = fs.readFileSync(TASK_FILE, 'utf8');
    const taskIds = new Set();
    
    // Extract tasks using regex
    const taskRegex = /\|\s*(TS\d+)\s*\|/g;
    
    let match;
    while ((match = taskRegex.exec(taskContent)) !== null) {
      taskIds.add(match[1].trim());
    }
    
    return taskIds;
  } catch (error) {
    console.error(`Error parsing task file: ${error.message}`);
    return new Set();
  }
}

/**
 * Extract task references from a file
 * @param {string} filePath Path to the file
 * @returns {Set<string>} Set of task IDs
 */
function extractTaskReferences(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const taskRefs = new Set();
    
    // Find all task references in the file
    const matches = [...content.matchAll(CODE_TASK_COMMENT_REGEX)];
    
    for (const match of matches) {
      taskRefs.add(match[1].trim());
    }
    
    return taskRefs;
  } catch (error) {
    console.error(`Error extracting task references from ${filePath}: ${error.message}`);
    return new Set();
  }
}

/**
 * Prompt user to add a missing task
 * @param {string} taskId Task ID
 * @returns {Promise<boolean>} True if the task was added, false otherwise
 */
async function promptAddMissingTask(taskId) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`Task ${taskId} is referenced in code but missing in task.md. Add it? (y/n) `, async (answer) => {
      if (answer.toLowerCase() === 'y') {
        const title = await promptQuestion(rl, 'Enter task title: ');
        const priority = await promptQuestion(rl, 'Enter priority (High/Medium/Low): ');
        const dependencies = await promptQuestion(rl, 'Enter dependencies (comma-separated task IDs or - for none): ');
        
        // Add the task to task.md
        addTaskToFile(taskId, title, priority, dependencies);
        rl.close();
        resolve(true);
      } else {
        rl.close();
        resolve(false);
      }
    });
  });
}

/**
 * Prompt for a question
 * @param {readline.Interface} rl Readline interface
 * @param {string} question Question to ask
 * @returns {Promise<string>} User's answer
 */
function promptQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Add a task to the task.md file
 * @param {string} taskId Task ID
 * @param {string} title Task title
 * @param {string} priority Task priority
 * @param {string} dependencies Task dependencies
 */
function addTaskToFile(taskId, title, priority, dependencies) {
  try {
    const taskContent = fs.readFileSync(TASK_FILE, 'utf8');
    
    // Find the task table
    const tableEndRegex = /\|\s*---+\s*\|[\s\S]*?\n\n/;
    const match = taskContent.match(tableEndRegex);
    
    if (!match) {
      console.error('Could not find the end of the task table');
      return;
    }
    
    // Format the new task row
    const cleanTitle = title.trim();
    const cleanPriority = ['High', 'Medium', 'Low'].includes(priority.trim()) ? priority.trim() : 'Medium';
    const cleanDeps = dependencies.trim() === '' || dependencies.trim() === '-' ? '-' : dependencies.trim();
    
    const newTaskRow = `| ${taskId} | ${cleanTitle} | Todo | ${cleanPriority} | ${cleanDeps} |\n`;
    
    // Insert the new task row at the end of the table
    const tableEndIndex = match.index + match[0].length;
    const updatedContent = 
      taskContent.substring(0, tableEndIndex) + 
      newTaskRow + 
      taskContent.substring(tableEndIndex);
    
    // Write the updated content back to the file
    fs.writeFileSync(TASK_FILE, updatedContent, 'utf8');
    console.log(`Added task ${taskId} to task.md`);
  } catch (error) {
    console.error(`Error adding task to file: ${error.message}`);
  }
}

/**
 * Check for missing tasks in task.md
 * @param {string} filePath Path to the file with task references
 */
async function checkMissingTasks(filePath) {
  // Get task references from the file
  const fileTaskRefs = extractTaskReferences(filePath);
  if (fileTaskRefs.size === 0) {
    console.log(`No task references found in ${filePath}`);
    return;
  }
  
  console.log(`Found ${fileTaskRefs.size} task references in ${filePath}`);
  
  // Get tasks from task.md
  const taskIds = parseTaskFile();
  if (taskIds.size === 0) {
    console.log('No tasks found in task.md');
    return;
  }
  
  // Check for missing tasks
  const missingTasks = [...fileTaskRefs].filter(taskId => !taskIds.has(taskId));
  
  if (missingTasks.length === 0) {
    console.log('All referenced tasks exist in task.md');
    return;
  }
  
  console.log(`Found ${missingTasks.length} tasks referenced in code but missing in task.md`);
  
  // Prompt user to add missing tasks
  for (const taskId of missingTasks) {
    await promptAddMissingTask(taskId);
  }
}

/**
 * Main function
 */
async function main() {
  // Get the file path from command line arguments
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('No file path provided');
    process.exit(1);
  }
  
  console.log(`Checking for missing tasks in ${filePath}...`);
  await checkMissingTasks(filePath);
}

// Run the main function
main().catch(err => console.error(err)); 