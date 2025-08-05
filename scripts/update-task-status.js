#!/usr/bin/env node

/**
 * Task Status Update Script
 * 
 * This script updates the status of tasks in the refactor-tasks.md file.
 * It allows marking tasks as completed, in progress, in review, or todo.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const TASKS_FILE = path.join(__dirname, '..', 'refactor-tasks.md');

// Status mapping
const STATUS_MAP = {
  'completed': '✅ Completed',
  'in-progress': '🔄 In Progress',
  'in-review': '🔍 In Review',
  'todo': '⬜ Todo'
};

/**
 * Parse the refactor tasks file
 * @returns {Array} Lines of the file
 */
function parseTasksFile() {
  const content = fs.readFileSync(TASKS_FILE, 'utf8');
  return content.split('\n');
}

/**
 * Find a task by ID
 * @param {Array} lines - Lines of the file
 * @param {string} taskId - Task ID to find
 * @returns {number} Line number of the task, or -1 if not found
 */
function findTaskLine(lines, taskId) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(`| ${taskId} |`)) {
      return i;
    }
  }
  return -1;
}

/**
 * Update task status
 * @param {Array} lines - Lines of the file
 * @param {number} lineNumber - Line number of the task
 * @param {string} newStatus - New status to set
 * @returns {Array} Updated lines
 */
function updateTaskStatus(lines, lineNumber, newStatus) {
  const line = lines[lineNumber];
  const parts = line.split('|');
  
  if (parts.length < 4) {
    throw new Error(`Invalid task line format at line ${lineNumber + 1}`);
  }
  
  // Update the status part (index 3)
  parts[3] = ` ${newStatus} `;
  
  // Join the parts back together
  lines[lineNumber] = parts.join('|');
  
  return lines;
}

/**
 * Update task LOC
 * @param {Array} lines - Lines of the file
 * @param {number} lineNumber - Line number of the task
 * @param {number} loc - Lines of code
 * @returns {Array} Updated lines
 */
function updateTaskLOC(lines, lineNumber, loc) {
  const line = lines[lineNumber];
  const parts = line.split('|');
  
  if (parts.length < 7) {
    throw new Error(`Invalid task line format at line ${lineNumber + 1}`);
  }
  
  // Update the LOC part (index 6)
  parts[6] = ` ${loc} `;
  
  // Join the parts back together
  lines[lineNumber] = parts.join('|');
  
  return lines;
}

/**
 * Save the updated file
 * @param {Array} lines - Lines of the file
 */
function saveTasksFile(lines) {
  fs.writeFileSync(TASKS_FILE, lines.join('\n'));
}

/**
 * Create interactive CLI
 */
function createCLI() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('AeroSuite Refactor Task Status Update Tool\n');
  
  rl.question('Enter task ID (e.g., RF001): ', (taskId) => {
    const lines = parseTasksFile();
    const lineNumber = findTaskLine(lines, taskId);
    
    if (lineNumber === -1) {
      console.error(`Task ${taskId} not found in ${TASKS_FILE}`);
      rl.close();
      return;
    }
    
    console.log('\nCurrent task line:');
    console.log(lines[lineNumber]);
    console.log('\nAvailable statuses:');
    console.log('1. ✅ Completed');
    console.log('2. 🔄 In Progress');
    console.log('3. 🔍 In Review');
    console.log('4. ⬜ Todo');
    
    rl.question('\nSelect new status (1-4): ', (statusChoice) => {
      let newStatus;
      
      switch (statusChoice) {
        case '1':
          newStatus = STATUS_MAP['completed'];
          break;
        case '2':
          newStatus = STATUS_MAP['in-progress'];
          break;
        case '3':
          newStatus = STATUS_MAP['in-review'];
          break;
        case '4':
          newStatus = STATUS_MAP['todo'];
          break;
        default:
          console.error('Invalid status choice');
          rl.close();
          return;
      }
      
      rl.question('\nEnter lines of code (LOC) or press Enter to keep current: ', (loc) => {
        try {
          // Update status
          let updatedLines = updateTaskStatus(lines, lineNumber, newStatus);
          
          // Update LOC if provided
          if (loc.trim() !== '') {
            const locNumber = parseInt(loc);
            if (isNaN(locNumber)) {
              console.error('Invalid LOC value. Must be a number.');
              rl.close();
              return;
            }
            updatedLines = updateTaskLOC(updatedLines, lineNumber, locNumber);
          }
          
          // Save the file
          saveTasksFile(updatedLines);
          
          console.log('\nTask updated successfully:');
          console.log(updatedLines[lineNumber]);
        } catch (error) {
          console.error(`Error updating task: ${error.message}`);
        } finally {
          rl.close();
        }
      });
    });
  });
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  // Check if arguments are provided
  if (args.length >= 2) {
    const taskId = args[0];
    const status = args[1];
    let loc = null;
    
    if (args.length >= 3) {
      loc = parseInt(args[2]);
      if (isNaN(loc)) {
        console.error('Invalid LOC value. Must be a number.');
        process.exit(1);
      }
    }
    
    if (!STATUS_MAP[status]) {
      console.error(`Invalid status. Must be one of: ${Object.keys(STATUS_MAP).join(', ')}`);
      process.exit(1);
    }
    
    try {
      const lines = parseTasksFile();
      const lineNumber = findTaskLine(lines, taskId);
      
      if (lineNumber === -1) {
        console.error(`Task ${taskId} not found in ${TASKS_FILE}`);
        process.exit(1);
      }
      
      // Update status
      let updatedLines = updateTaskStatus(lines, lineNumber, STATUS_MAP[status]);
      
      // Update LOC if provided
      if (loc !== null) {
        updatedLines = updateTaskLOC(updatedLines, lineNumber, loc);
      }
      
      // Save the file
      saveTasksFile(updatedLines);
      
      console.log(`Task ${taskId} updated successfully.`);
      console.log(updatedLines[lineNumber]);
    } catch (error) {
      console.error(`Error updating task: ${error.message}`);
      process.exit(1);
    }
  } else {
    // Interactive mode
    createCLI();
  }
}

// Run the script
main(); 