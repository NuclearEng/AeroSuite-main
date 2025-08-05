#!/usr/bin/env node

/**
 * This script updates task references in code files when task statuses change in task.md
 * It is triggered automatically by Cursor when a task status is changed in task.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TASK_FILE = path.join(process.cwd(), 'task.md');
const TASK_REGEX = /\|\s*(TS\d+)\s*\|(.*?)\|\s*(Todo|In Progress|In Review|Completed)\s*\|/g;
const CODE_TASK_COMMENT_REGEX = /\/\/\s*Task:\s*(TS\d+)(\s*-\s*Status:\s*(Todo|In Progress|In Review|Completed))?/g;

/**
 * Parse the task.md file and extract task IDs and their statuses
 * @returns {Map<string, string>} Map of task IDs to their statuses
 */
function parseTaskFile() {
  try {
    const taskContent = fs.readFileSync(TASK_FILE, 'utf8');
    const taskMap = new Map();
    
    let match;
    while ((match = TASK_REGEX.exec(taskContent)) !== null) {
      const [, taskId, , status] = match;
      taskMap.set(taskId.trim(), status.trim());
    }
    
    return taskMap;
  } catch (error) {
    console.error(`Error parsing task file: ${error.message}`);
    return new Map();
  }
}

/**
 * Find all code files that reference tasks
 * @returns {string[]} Array of file paths
 */
function findFilesWithTaskReferences() {
  try {
    // Use find and grep to find files containing task references
    // Note: This uses Unix commands and may need adaptation for Windows
    const findCommand = "find . -type f -name '*.js' -o -name '*.jsx' -o -name '*.ts' -o -name '*.tsx' | xargs grep -l 'Task: TS' 2>/dev/null || echo ''";
    const result = execSync(findCommand, { cwd: process.cwd(), encoding: 'utf8' });
    
    if (!result.trim()) {
      return [];
    }
    
    // Parse the output to extract file paths
    return result
      .split('\n')
      .filter(line => line.trim() !== '')
      .filter(line => !line.includes('node_modules')) // Exclude node_modules
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  } catch (error) {
    console.error(`Error finding files with task references: ${error.message}`);
    return [];
  }
}

/**
 * Update task status comments in a file
 * @param {string} filePath Path to the file
 * @param {Map<string, string>} taskMap Map of task IDs to their statuses
 * @returns {boolean} True if the file was updated, false otherwise
 */
function updateFileTaskReferences(filePath, taskMap) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let updated = false;
    
    // Find all task references in the file
    const matches = [...content.matchAll(CODE_TASK_COMMENT_REGEX)];
    
    for (const match of matches) {
      const [fullMatch, taskId, , currentStatus] = match;
      const taskStatus = taskMap.get(taskId);
      
      // If the task exists in the task map and its status differs from the comment
      if (taskStatus && (!currentStatus || currentStatus !== taskStatus)) {
        const newComment = `// Task: ${taskId} - Status: ${taskStatus}`;
        updatedContent = updatedContent.replace(fullMatch, newComment);
        updated = true;
      }
    }
    
    // Write the updated content back to the file if changes were made
    if (updated) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated task references in ${filePath}`);
    }
    
    return updated;
  } catch (error) {
    console.error(`Error updating file ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('Updating task references in code files...');
  
  // Parse the task file
  const taskMap = parseTaskFile();
  if (taskMap.size === 0) {
    console.log('No tasks found in task.md');
    return;
  }
  
  console.log(`Found ${taskMap.size} tasks in task.md`);
  
  // Find files with task references
  const files = findFilesWithTaskReferences();
  if (files.length === 0) {
    console.log('No files with task references found');
    return;
  }
  
  console.log(`Found ${files.length} files with task references`);
  
  // Update task references in each file
  let updatedFiles = 0;
  for (const file of files) {
    if (updateFileTaskReferences(file, taskMap)) {
      updatedFiles++;
    }
  }
  
  console.log(`Updated task references in ${updatedFiles} files`);
}

// Run the main function
main(); 