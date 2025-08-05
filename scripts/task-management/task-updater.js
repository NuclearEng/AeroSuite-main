#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const DEPENDENCY_ANALYSIS_PATH = path.join(__dirname, '../../dependency-analysis.md');

// Status constants
const STATUS = {
  COMPLETED: '✅ Completed - Implemented, tested, and documented',
  IN_PROGRESS: '🔄 In Progress - Actively being worked on',
  IN_REVIEW: '🔍 In Review - Implementation complete, pending review',
  TESTING: '🧪 Testing - Implementation complete, undergoing testing',
  DOCUMENTATION: '📝 Documentation - Implementation complete, documentation in progress',
  BLOCKED: '⚠️ Blocked - Cannot proceed due to dependencies',
  TODO: '⬜ Todo - Not yet started'
};

// Main function
async function updateTaskFile() {
  try {
    console.log('Reading task file...');
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    
    // Extract tasks
    const { tasks, sections } = extractTasksAndSections(content);
    
    // Update task statuses
    const { updatedTasks, updateCount } = updateTaskStatuses(tasks);
    
    // Write back the updated content
    if (updateCount > 0) {
      const updatedContent = generateUpdatedContent(sections, updatedTasks);
      fs.writeFileSync(TASK_FILE_PATH, updatedContent, 'utf8');
      console.log(`\nUpdated ${updateCount} task statuses successfully!`);
    } else {
      console.log('\nNo tasks needed status updates.');
    }
    
  } catch (error) {
    console.error('Error updating task statuses:', error);
    process.exit(1);
  }
}

// Extract tasks and section content from the file
function extractTasksAndSections(content) {
  const tasks = {};
  const sections = {
    header: '',
    legend: '',
    tasks: [],
    rest: []
  };
  
  const lines = content.split('\n');
  let currentSection = 'header';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('## Status and Priority Legend')) {
      currentSection = 'legend';
      sections.legend += line + '\n';
    } else if (line.startsWith('## Tasks')) {
      currentSection = 'tasks';
      sections.tasks.push(line);
    } else if (line.startsWith('##') && currentSection === 'tasks') {
      currentSection = 'rest';
      sections.rest.push(line);
    } else if (currentSection === 'header') {
      sections.header += line + '\n';
    } else if (currentSection === 'legend') {
      sections.legend += line + '\n';
    } else if (currentSection === 'tasks') {
      sections.tasks.push(line);
      
      // Parse task rows
      if (line.startsWith('|') && !line.includes('ID') && !line.includes('---')) {
        const task = parseTaskRow(line);
        if (task) {
          tasks[task.id] = task;
        }
      }
    } else if (currentSection === 'rest') {
      sections.rest.push(line);
    }
  }
  
  return { tasks, sections };
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
    loc: parts[6],
    originalLine: line
  };
}

// Parse dependencies field
function parseDependencies(dependenciesStr) {
  if (dependenciesStr === '-' || !dependenciesStr) return [];
  
  // Handle comma-separated dependencies
  return dependenciesStr.split(',').map(dep => dep.trim()).filter(Boolean);
}

// Update task statuses based on dependencies
function updateTaskStatuses(tasks) {
  const updatedTasks = { ...tasks };
  let updateCount = 0;
  
  // First pass: check which tasks should be blocked
  for (const taskId in updatedTasks) {
    const task = updatedTasks[taskId];
    
    // Skip completed tasks
    if (task.status === '✅ Completed') continue;
    
    // Check if task should be blocked
    if (task.dependencies.length > 0) {
      const shouldBeBlocked = task.dependencies.some(depId => {
        return tasks[depId] && !isTaskCompleted(tasks[depId].status);
      });
      
      if (shouldBeBlocked && task.status !== '⚠️ Blocked') {
        task.status = '⚠️ Blocked';
        updateCount++;
        console.log(`Setting ${taskId} to Blocked due to incomplete dependencies`);
      }
    }
  }
  
  return { updatedTasks, updateCount };
}

// Check if a task is completed
function isTaskCompleted(status) {
  return status === '✅ Completed';
}

// Generate updated content
function generateUpdatedContent(sections, updatedTasks) {
  let content = sections.header + sections.legend;
  
  // Rebuild the tasks section
  content += sections.tasks[0] + '\n'; // Tasks heading
  
  // Add the table header and separator
  let tableHeaderFound = false;
  let tableDividerFound = false;
  
  for (let i = 1; i < sections.tasks.length; i++) {
    const line = sections.tasks[i];
    
    if (line.startsWith('| ID') && !tableHeaderFound) {
      content += line + '\n';
      tableHeaderFound = true;
      continue;
    }
    
    if (line.startsWith('|---') && tableHeaderFound && !tableDividerFound) {
      content += line + '\n';
      tableDividerFound = true;
      continue;
    }
    
    if (tableHeaderFound && tableDividerFound) {
      // Skip task rows as we'll add the updated ones later
      if (line.startsWith('|') && !line.includes('ID') && !line.includes('---')) {
        continue;
      }
    } else {
      content += line + '\n';
    }
  }
  
  // Add the updated tasks in order
  const taskIds = Object.keys(updatedTasks).sort((a, b) => {
    // Extract numeric part of IDs for sorting
    const aNum = parseInt(a.replace(/\D/g, ''));
    const bNum = parseInt(b.replace(/\D/g, ''));
    return aNum - bNum;
  });
  
  for (const taskId of taskIds) {
    const task = updatedTasks[taskId];
    const updatedLine = formatTaskRow(task);
    content += updatedLine + '\n';
  }
  
  // Add the rest of the sections
  content += '\n' + sections.rest.join('\n');
  
  return content;
}

// Format a task row for the table
function formatTaskRow(task) {
  return `| ${task.id} | ${task.title} | ${task.status} | ${task.priority} | ${task.dependencies.length > 0 ? task.dependencies.join(', ') : '-'} | ${task.loc} |`;
}

// Function to update a specific task status
async function updateTaskStatus(taskId, newStatus) {
  try {
    // Read the task file
    const taskFileContent = await fs.promises.readFile(TASK_FILE_PATH, 'utf8');
    
    // Regular expression to find the task row
    const taskRegex = new RegExp(`\\|\\s*${taskId}\\s*\\|([^|]*)\\|([^|]*)\\|`, 'g');
    
    // Check if task exists
    if (!taskFileContent.match(taskRegex)) {
      console.error(`Task ${taskId} not found in task.md`);
      return false;
    }
    
    // Replace the status with the new status
    const updatedContent = taskFileContent.replace(taskRegex, (match, title, currentStatus) => {
      return `| ${taskId} |${title}| ${newStatus} |`;
    });
    
    // Write back to the file
    await fs.promises.writeFile(TASK_FILE_PATH, updatedContent);
    
    console.log(`Successfully updated task ${taskId} to status: ${newStatus}`);
    return true;
    
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    return false;
  }
}

// Export functions for use in other scripts
module.exports = {
  updateTaskStatus,
  updateTaskFile
};

// If script is run directly, execute the main function
if (require.main === module) {
  updateTaskFile();
} 