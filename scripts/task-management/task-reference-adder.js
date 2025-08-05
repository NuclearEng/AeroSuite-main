#!/usr/bin/env node

/**
 * Task Reference Adder for AeroSuite
 * 
 * This script helps developers add task references to existing code files.
 * It can:
 * 1. Search for files that might be related to a specific task
 * 2. Add task reference comments to selected files
 * 3. Batch process multiple files
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');

// Task ID patterns for validation
const TASK_ID_PATTERN = /^(TS|SEC|AI|PERF|DEV)\d{3}$/;

// File extensions we can safely add comments to
const SUPPORTED_EXTENSIONS = {
  '.js': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.jsx': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.ts': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.tsx': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.py': { lineComment: '#', blockStart: '"""', blockEnd: '"""' },
  '.java': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.php': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.html': { lineComment: '<!--', blockEnd: '-->' },
  '.css': { lineComment: '/*', blockEnd: '*/' },
  '.scss': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.vue': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.go': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.rb': { lineComment: '#', blockStart: '=begin', blockEnd: '=end' },
  '.c': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.cpp': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function
async function addTaskReferences() {
  console.log('🔖 AeroSuite Task Reference Adder\n');
  
  try {
    // Get tasks from task.md
    const tasks = await extractTasksFromTaskFile();
    
    // Prompt for task ID
    const taskId = await promptForTaskId(tasks);
    if (!taskId) return;
    
    // Get task details
    const task = tasks.get(taskId);
    console.log(`\nSelected task: ${taskId} - ${task.title}`);
    console.log(`Status: ${task.status}`);
    
    // Search for related files
    const relatedFiles = await searchRelatedFiles(task);
    
    if (relatedFiles.length === 0) {
      console.log('\nNo related files found based on task title keywords.');
      const manualPath = await promptForFilePath();
      if (manualPath) {
        await addReferenceToFile(manualPath, taskId, task.title);
      }
    } else {
      console.log(`\nFound ${relatedFiles.length} potentially related files:`);
      for (let i = 0; i < relatedFiles.length; i++) {
        console.log(`${i + 1}. ${relatedFiles[i]}`);
      }
      
      // Prompt for file selection
      const selectedIndices = await promptForFileSelection(relatedFiles.length);
      
      if (selectedIndices.length > 0) {
        for (const index of selectedIndices) {
          const filePath = relatedFiles[index - 1];
          await addReferenceToFile(filePath, taskId, task.title);
        }
      } else {
        console.log('No files selected.');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
}

// Extract tasks from task.md
async function extractTasksFromTaskFile() {
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
          if (TASK_ID_PATTERN.test(id)) {
            taskMap.set(id, {
              id,
              title,
              status,
              priority,
              dependencies
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

// Prompt for task ID
function promptForTaskId(tasks) {
  return new Promise((resolve) => {
    rl.question('Enter task ID (e.g., TS123) or part of task title to search: ', (input) => {
      input = input.trim();
      
      // Direct task ID match
      if (TASK_ID_PATTERN.test(input) && tasks.has(input)) {
        resolve(input);
        return;
      }
      
      // Search by partial task ID or title
      const matches = [];
      for (const [id, task] of tasks.entries()) {
        if (id.includes(input) || task.title.toLowerCase().includes(input.toLowerCase())) {
          matches.push({ id, title: task.title, status: task.status });
        }
      }
      
      if (matches.length === 0) {
        console.log('No matching tasks found.');
        resolve(null);
      } else if (matches.length === 1) {
        console.log(`Found task: ${matches[0].id} - ${matches[0].title}`);
        resolve(matches[0].id);
      } else {
        console.log('\nFound multiple matching tasks:');
        matches.forEach((match, index) => {
          console.log(`${index + 1}. ${match.id} - ${match.title} (${match.status})`);
        });
        
        rl.question('\nSelect task number: ', (selection) => {
          const index = parseInt(selection) - 1;
          if (index >= 0 && index < matches.length) {
            resolve(matches[index].id);
          } else {
            console.log('Invalid selection.');
            resolve(null);
          }
        });
      }
    });
  });
}

// Search for files related to the task
async function searchRelatedFiles(task) {
  try {
    // Extract keywords from task title
    const keywords = extractKeywords(task.title);
    
    if (keywords.length === 0) {
      return [];
    }
    
    // Build grep command to search for keywords in code files
    const extensions = Object.keys(SUPPORTED_EXTENSIONS).join(',');
    const keywordPattern = keywords.join('|');
    
    // Use git grep for performance
    const cmd = `git grep -l -E "${keywordPattern}" -- "*.{${extensions.substring(1)}}"`;
    
    try {
      const result = execSync(cmd, { encoding: 'utf8' });
      return result.split('\n').filter(Boolean);
    } catch (error) {
      // Git grep returns non-zero exit code when no matches are found
      return [];
    }
  } catch (error) {
    console.error('Error searching for related files:', error);
    return [];
  }
}

// Extract meaningful keywords from task title
function extractKeywords(title) {
  // Convert to lowercase and remove common words
  const words = title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !['implementation', 'core', 'framework', 'system', 'the', 'and', 'for'].includes(word)
    );
  
  return words;
}

// Prompt for manual file path
function promptForFilePath() {
  return new Promise((resolve) => {
    rl.question('Enter file path to add task reference (or press Enter to skip): ', (input) => {
      const filePath = input.trim();
      
      if (!filePath) {
        resolve(null);
        return;
      }
      
      if (!fs.existsSync(filePath)) {
        console.log('File does not exist.');
        resolve(null);
        return;
      }
      
      resolve(filePath);
    });
  });
}

// Prompt for file selection
function promptForFileSelection(fileCount) {
  return new Promise((resolve) => {
    rl.question('\nSelect file number(s) to add task reference (comma-separated, or "all"): ', (input) => {
      input = input.trim().toLowerCase();
      
      if (input === 'all') {
        resolve(Array.from({ length: fileCount }, (_, i) => i + 1));
        return;
      }
      
      if (!input) {
        resolve([]);
        return;
      }
      
      const indices = input.split(',')
        .map(num => parseInt(num.trim()))
        .filter(num => !isNaN(num) && num > 0 && num <= fileCount);
      
      resolve(indices);
    });
  });
}

// Add task reference to file
async function addReferenceToFile(filePath, taskId, taskTitle) {
  try {
    const ext = path.extname(filePath);
    
    // Check if we support this file type
    if (!SUPPORTED_EXTENSIONS[ext]) {
      console.log(`\nSkipping ${filePath}: Unsupported file type.`);
      return;
    }
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Check if task reference already exists
    const taskRefPattern = new RegExp(`Task:\\s*${taskId}`, 'i');
    if (content.match(taskRefPattern)) {
      console.log(`\nSkipping ${filePath}: Task reference already exists.`);
      return;
    }
    
    // Determine comment style
    const { lineComment, blockStart, blockEnd } = SUPPORTED_EXTENSIONS[ext];
    
    // Determine insertion position
    let insertionPoint = 0;
    
    // Skip shebang if present
    if (lines[0] && lines[0].startsWith('#!')) {
      insertionPoint = 1;
    }
    
    // Check for existing comment block
    const hasCommentBlock = lines.some((line, index) => {
      if (index > 5) return false; // Only check first few lines
      return line.includes('/**') || line.includes('/*');
    });
    
    // Create task reference comment
    let taskComment;
    if (blockStart && blockEnd && !hasCommentBlock) {
      // Use block comment
      taskComment = [
        `${blockStart}`,
        ` * Task: ${taskId} - ${taskTitle}`,
        ` */${blockEnd ? '' : blockEnd}`
      ].join('\n');
    } else {
      // Use line comment
      taskComment = `${lineComment} Task: ${taskId} - ${taskTitle}`;
    }
    
    // Insert task reference
    lines.splice(insertionPoint, 0, taskComment, '');
    
    // Write updated content
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`\n✅ Added task reference to ${filePath}`);
  } catch (error) {
    console.error(`\nError adding reference to ${filePath}:`, error.message);
  }
}

// Run the main function
addTaskReferences(); 