#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');

// Main function
async function validateTaskFile() {
  try {
    console.log('Reading task file...');
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    
    // Perform validations
    const issues = validateContent(content);
    
    // Print results
    if (issues.length > 0) {
      console.error('\nTask validation failed. Please fix the following issues:');
      issues.forEach((issue, index) => {
        console.error(`${index + 1}. ${issue.message} (Line ${issue.line})`);
      });
      process.exit(1);
    } else {
      console.log('\nTask validation successful! No issues found.');
    }
    
  } catch (error) {
    console.error('Error validating task file:', error);
    process.exit(1);
  }
}

// Validate content
function validateContent(content) {
  const lines = content.split('\n');
  const issues = [];
  
  // Track if we're in a table
  let inTable = false;
  let tableHeaderSeen = false;
  let tableDividerSeen = false;
  
  // Validate each line
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i];
    
    // Check for table headers
    if (line.trim().startsWith('| ID')) {
      inTable = true;
      tableHeaderSeen = true;
      
      // Validate header format
      if (!line.includes('Status') || !line.includes('Priority') || !line.includes('Dependencies')) {
        issues.push({
          line: lineNumber,
          message: 'Table header is missing required columns'
        });
      }
      
      // Check next line for table divider
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!nextLine.includes('---|---') || !nextLine.startsWith('|---')) {
          issues.push({
            line: lineNumber + 1,
            message: 'Table header must be followed by a divider row'
          });
        } else {
          tableDividerSeen = true;
        }
      }
      continue;
    }
    
    // Skip non-task rows
    if (!line.trim().startsWith('|') || line.includes('---|---')) {
      inTable = line.trim().startsWith('|');
      continue;
    }
    
    // Validate task rows
    if (inTable && tableHeaderSeen && tableDividerSeen) {
      const task = parseTaskRow(line);
      
      if (!task) {
        issues.push({
          line: lineNumber,
          message: 'Invalid task row format'
        });
        continue;
      }
      
      // Validate task ID format
      if (!task.id.match(/^[A-Za-z0-9]+[0-9]+$/)) {
        issues.push({
          line: lineNumber,
          message: `Invalid task ID format: ${task.id}`
        });
      }
      
      // Validate status emoji
      if (!isValidStatus(task.status)) {
        issues.push({
          line: lineNumber,
          message: `Invalid status format: ${task.status}`
        });
      }
      
      // Validate priority emoji
      if (!isValidPriority(task.priority)) {
        issues.push({
          line: lineNumber,
          message: `Invalid priority format: ${task.priority}`
        });
      }
      
      // Validate LOC is a number or 0
      if (task.loc !== '0' && !task.loc.match(/^[0-9]+$/)) {
        issues.push({
          line: lineNumber,
          message: `LOC must be a number: ${task.loc}`
        });
      }
    }
  }
  
  return issues;
}

// Parse a task row from the table
function parseTaskRow(line) {
  const parts = line.split('|').map(part => part.trim());
  
  if (parts.length < 7) return null;
  
  return {
    id: parts[1],
    title: parts[2],
    status: parts[3],
    priority: parts[4],
    dependencies: parts[5],
    loc: parts[6]
  };
}

// Validate status format
function isValidStatus(status) {
  const validStatuses = [
    '✅ Completed',
    '🔄 In Progress',
    '🔍 In Review',
    '🧪 Testing',
    '📝 Documentation',
    '⚠️ Blocked',
    '⬜ Todo'
  ];
  
  return validStatuses.some(valid => status.includes(valid));
}

// Validate priority format
function isValidPriority(priority) {
  const validPriorities = [
    '🔴 High',
    '🟠 Medium',
    '🔵 Low',
    '⚫ Next Release'
  ];
  
  return validPriorities.some(valid => priority.includes(valid));
}

// Run the main function
validateTaskFile(); 