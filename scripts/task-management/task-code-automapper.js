#!/usr/bin/env node

/**
 * Task-Code Automapper for AeroSuite
 * 
 * This script automatically:
 * 1. Scans all code files in the codebase
 * 2. Maps code files to existing tasks in task.md
 * 3. Creates new tasks for unmapped code files
 * 4. Updates task.md with an indented structure showing files under each task
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const BACKUP_PATH = path.join(process.cwd(), 'task.md.bak');

// Task ID patterns for scanning
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

// File extensions to process
const CODE_FILE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.php',
  '.html', '.css', '.scss', '.vue', '.go', '.rb', '.c', '.cpp'
];

// Directories to ignore
const IGNORE_DIRS = [
  'node_modules', 'build', 'dist', '.git',
  'coverage', '.vscode', '.idea', 'public/assets'
];

// Status and priority defaults for new tasks
const DEFAULT_STATUS = '⬜ Todo';
const DEFAULT_PRIORITY = '🟠 Medium';

// Create readline interface for user prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Task ID counters for creating new tasks
const taskCounters = {
  TS: 500, // Start new TS tasks from TS500
  SEC: 50, // Start new SEC tasks from SEC050
  AI: 50,  // Start new AI tasks from AI050
  PERF: 50, // Start new PERF tasks from PERF050
  DEV: 50   // Start new DEV tasks from DEV050
};

// Main function
async function automapTasks() {
  try {
    console.log('🔍 Starting Task-Code Automapper...');
    
    // Backup task.md first
    backupTaskFile();
    
    // Parse the task file
    const { tasks, taskContent } = parseTaskFile();
    console.log(`Found ${Object.keys(tasks).length} existing tasks in task.md`);
    
    // Scan all code files
    const codeFiles = scanCodeFiles();
    console.log(`Found ${codeFiles.length} code files in the codebase`);
    
    // Extract task references from code files
    const { fileTaskMap, unmappedFiles } = extractTaskReferencesFromFiles(codeFiles);
    console.log(`${Object.keys(fileTaskMap).length} files already have task references`);
    console.log(`${unmappedFiles.length} files need task assignments`);
    
    // Map files to tasks
    const { 
      updatedTasks, 
      newTasks, 
      taskFileMap 
    } = await mapFilesToTasks(tasks, fileTaskMap, unmappedFiles);
    
    console.log(`Created ${Object.keys(newTasks).length} new tasks for unmapped files`);
    
    // Generate updated task file content
    const updatedContent = generateUpdatedTaskFile(
      taskContent, 
      { ...updatedTasks, ...newTasks }, 
      taskFileMap
    );
    
    // Write updated task file
    fs.writeFileSync(TASK_FILE_PATH, updatedContent, 'utf8');
    
    console.log('\n✅ Task-code automapping complete!');
    console.log(`- ${Object.keys(fileTaskMap).length} files with existing task references`);
    console.log(`- ${Object.keys(newTasks).length} new tasks created`);
    console.log(`- ${Object.keys(taskFileMap).length} total tasks with file mappings`);
    console.log(`- Updated task.md with file references under each task`);
    console.log(`\nBackup saved to: ${BACKUP_PATH}`);
    
  } catch (error) {
    console.error('Error automapping tasks:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Backup the task file
function backupTaskFile() {
  try {
    if (fs.existsSync(TASK_FILE_PATH)) {
      fs.copyFileSync(TASK_FILE_PATH, BACKUP_PATH);
      console.log(`Backed up task.md to ${BACKUP_PATH}`);
    } else {
      console.error('task.md not found. Will create a new one.');
    }
  } catch (error) {
    console.error('Error backing up task file:', error);
  }
}

// Parse the task file
function parseTaskFile() {
  const tasks = {};
  let taskContent = {
    header: '',
    sections: []
  };
  
  try {
    if (!fs.existsSync(TASK_FILE_PATH)) {
      // Create a basic task file if it doesn't exist
      const basicContent = `# AeroSuite Task Tracker

## Status and Priority Legend

- Status:
  - ✅ Completed - Implemented, tested, and documented
  - 🔄 In Progress - Actively being worked on
  - 🔍 In Review - Implementation complete, pending review
  - 🧪 Testing - Implementation complete, undergoing testing
  - 📝 Documentation - Implementation complete, documentation in progress
  - ⚠️ Blocked - Cannot proceed due to dependencies
  - ⬜ Todo - Not yet started

- Priority:
  - 🔴 High - Critical for system functionality or security
  - 🟠 Medium - Important for full feature set
  - 🔵 Low - Enhances system but not critical path
  - ⚫ Next Release - Deferred to future release

## Core System Tasks

| ID     | Title                                        | Status        | Priority    | Dependencies     | LOC   |
|--------|----------------------------------------------|---------------|-------------|------------------|-------|

## Security & Compliance

| ID     | Title                                        | Status        | Priority    | Dependencies     | LOC   |
|--------|----------------------------------------------|---------------|-------------|------------------|-------|

## AI/ML Integration

| ID     | Title                                        | Status        | Priority    | Dependencies     | LOC   |
|--------|----------------------------------------------|---------------|-------------|------------------|-------|

## Performance & Scalability

| ID     | Title                                        | Status        | Priority    | Dependencies     | LOC   |
|--------|----------------------------------------------|---------------|-------------|------------------|-------|

## Developer Experience

| ID     | Title                                        | Status        | Priority    | Dependencies     | LOC   |
|--------|----------------------------------------------|---------------|-------------|------------------|-------|

`;
      taskContent = parseTaskContent(basicContent);
      return { tasks, taskContent };
    }
    
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    
    // Parse the content structure
    taskContent = parseTaskContent(content);
    
    // Extract tasks
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
          const loc = columns[5] || '0';
          
          // Only add if it's a valid task ID
          if (/^(TS|SEC|AI|PERF|DEV)\d{3}$/.test(id)) {
            tasks[id] = {
              id,
              title,
              status,
              priority,
              dependencies,
              loc,
              files: [] // Will store related files here
            };
            
            // Track the highest task number for each prefix
            const prefix = id.match(/^[A-Z]+/)[0];
            const num = parseInt(id.match(/\d+/)[0]);
            if (taskCounters[prefix] < num) {
              taskCounters[prefix] = num;
            }
          }
        }
      }
    }
    
    return { tasks, taskContent };
  } catch (error) {
    console.error('Error parsing task file:', error);
    return { tasks: {}, taskContent: { header: '', sections: [] } };
  }
}

// Parse task content structure
function parseTaskContent(content) {
  const lines = content.split('\n');
  const result = {
    header: '',
    sections: []
  };
  
  let currentSection = null;
  let headerDone = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('## ')) {
      // New section
      headerDone = true;
      currentSection = {
        title: line.substring(3).trim(),
        content: [line],
        tasks: []
      };
      result.sections.push(currentSection);
    } else if (!headerDone) {
      // Part of the header
      result.header += line + '\n';
    } else if (currentSection) {
      // Part of current section
      if (line.startsWith('|') && !line.includes('---') && !line.includes('ID')) {
        // This is a task row
        const taskMatch = line.match(/^\|\s*([A-Z]+\d{3})\s*\|/);
        if (taskMatch) {
          const taskId = taskMatch[1];
          currentSection.tasks.push(taskId);
        }
      }
      currentSection.content.push(line);
    }
  }
  
  return result;
}

// Scan all code files in the codebase
function scanCodeFiles() {
  const codeFiles = [];
  
  function scanDirectory(dir) {
    try {
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
        if (CODE_FILE_EXTENSIONS.includes(ext)) {
          const relativePath = path.relative(process.cwd(), fullPath);
          const fileInfo = {
            path: relativePath,
            extension: ext,
            name: path.basename(relativePath),
            loc: countLinesOfCode(fullPath),
            title: generateFileTitle(relativePath)
          };
          codeFiles.push(fileInfo);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error.message);
    }
  }
  
  // Start scanning from project root
  scanDirectory(process.cwd());
  return codeFiles;
}

// Count lines of code in a file
function countLinesOfCode(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Simple count of non-empty, non-comment lines
    const lines = content.split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && 
               !trimmed.startsWith('//') && 
               !trimmed.startsWith('#') && 
               !trimmed.startsWith('/*') && 
               !trimmed.startsWith('*') && 
               !trimmed.startsWith('*/');
      });
    return lines.length;
  } catch (error) {
    console.error(`Error counting lines in ${filePath}:`, error.message);
    return 0;
  }
}

// Generate a title for a file based on its path
function generateFileTitle(filePath) {
  // Extract meaningful parts from the path
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  
  // Remove extension
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  
  // Convert camelCase or snake_case to Title Case with spaces
  const titled = nameWithoutExt
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ')         // Replace underscores with spaces
    .replace(/-/g, ' ')         // Replace hyphens with spaces
    .replace(/\s+/g, ' ')       // Replace multiple spaces with single space
    .trim();
  
  // Capitalize first letter
  return titled.charAt(0).toUpperCase() + titled.slice(1);
}

// Extract task references from code files
function extractTaskReferencesFromFiles(codeFiles) {
  const fileTaskMap = {};
  const unmappedFiles = [];
  
  for (const file of codeFiles) {
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      const taskIds = extractTaskIdsFromContent(content);
      
      if (taskIds.length > 0) {
        // File has task references
        fileTaskMap[file.path] = {
          ...file,
          taskIds
        };
      } else {
        // File has no task references
        unmappedFiles.push(file);
      }
    } catch (error) {
      console.error(`Error reading file ${file.path}:`, error.message);
      unmappedFiles.push(file);
    }
  }
  
  return { fileTaskMap, unmappedFiles };
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

// Map files to tasks
async function mapFilesToTasks(tasks, fileTaskMap, unmappedFiles) {
  const updatedTasks = { ...tasks };
  const newTasks = {};
  const taskFileMap = {};
  
  // First, map files with existing task references
  for (const [filePath, fileInfo] of Object.entries(fileTaskMap)) {
    for (const taskId of fileInfo.taskIds) {
      if (updatedTasks[taskId]) {
        // Task exists, add file to it
        updatedTasks[taskId].files.push(fileInfo);
        
        // Update task file map
        if (!taskFileMap[taskId]) {
          taskFileMap[taskId] = [];
        }
        taskFileMap[taskId].push(filePath);
      } else {
        // Referenced task doesn't exist, create it
        console.log(`\nCreating missing task ${taskId} referenced in ${filePath}`);
        const newTask = await createNewTask(taskId, fileInfo);
        newTasks[taskId] = newTask;
        
        // Update task file map
        if (!taskFileMap[taskId]) {
          taskFileMap[taskId] = [];
        }
        taskFileMap[taskId].push(filePath);
      }
    }
  }
  
  // Next, handle unmapped files
  if (unmappedFiles.length > 0) {
    console.log(`\nAssigning ${unmappedFiles.length} unmapped files to tasks...`);
    
    // Group files by directory for better organization
    const filesByDirectory = groupFilesByDirectory(unmappedFiles);
    
    // Create tasks for each directory group
    for (const [directory, files] of Object.entries(filesByDirectory)) {
      if (files.length === 0) continue;
      
      console.log(`\nProcessing ${files.length} files in ${directory || 'root directory'}`);
      
      // For each directory, create tasks for files
      const taskId = await findOrCreateTaskForFiles(directory, files, updatedTasks, newTasks);
      
      // Update task file map
      if (!taskFileMap[taskId]) {
        taskFileMap[taskId] = [];
      }
      
      // Add all files to the task
      for (const file of files) {
        if (updatedTasks[taskId]) {
          updatedTasks[taskId].files.push(file);
        } else if (newTasks[taskId]) {
          newTasks[taskId].files.push(file);
        }
        taskFileMap[taskId].push(file.path);
      }
    }
  }
  
  return { updatedTasks, newTasks, taskFileMap };
}

// Group files by directory
function groupFilesByDirectory(files) {
  const filesByDirectory = {};
  
  for (const file of files) {
    const dir = path.dirname(file.path);
    if (!filesByDirectory[dir]) {
      filesByDirectory[dir] = [];
    }
    filesByDirectory[dir].push(file);
  }
  
  return filesByDirectory;
}

// Find or create a task for files
async function findOrCreateTaskForFiles(directory, files, existingTasks, newTasks) {
  // First try to guess an appropriate task prefix based on directory
  let taskPrefix = 'TS'; // Default
  
  if (directory.includes('security') || directory.includes('auth')) {
    taskPrefix = 'SEC';
  } else if (directory.includes('ai') || directory.includes('ml')) {
    taskPrefix = 'AI';
  } else if (directory.includes('perf') || directory.includes('performance')) {
    taskPrefix = 'PERF';
  } else if (directory.includes('dev') || directory.includes('tools')) {
    taskPrefix = 'DEV';
  }
  
  // Generate task title based on directory and files
  const title = generateTaskTitle(directory, files);
  
  // Create new task
  taskCounters[taskPrefix]++;
  const taskId = `${taskPrefix}${taskCounters[taskPrefix].toString().padStart(3, '0')}`;
  
  console.log(`Creating new task ${taskId} for files in ${directory || 'root directory'}`);
  
  // Calculate total LOC
  const totalLoc = files.reduce((sum, file) => sum + file.loc, 0);
  
  // Create the task
  const newTask = {
    id: taskId,
    title,
    status: DEFAULT_STATUS,
    priority: DEFAULT_PRIORITY,
    dependencies: '-',
    loc: totalLoc.toString(),
    files: []
  };
  
  newTasks[taskId] = newTask;
  return taskId;
}

// Generate a task title based on directory and files
function generateTaskTitle(directory, files) {
  if (!directory || directory === '.') {
    // Files in root directory
    return 'Root Directory Components';
  }
  
  // Extract meaningful parts from the directory
  const parts = directory.split('/');
  const lastPart = parts[parts.length - 1];
  
  // Convert to Title Case
  const formatted = lastPart
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ')         // Replace underscores with spaces
    .replace(/-/g, ' ')         // Replace hyphens with spaces
    .replace(/\s+/g, ' ')       // Replace multiple spaces with single space
    .trim();
  
  const titled = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  
  // Add common suffix based on context
  if (directory.includes('components')) {
    return `${titled} Components`;
  } else if (directory.includes('services')) {
    return `${titled} Services`;
  } else if (directory.includes('utils')) {
    return `${titled} Utilities`;
  } else if (directory.includes('hooks')) {
    return `${titled} Hooks`;
  } else if (directory.includes('models')) {
    return `${titled} Models`;
  } else if (directory.includes('controllers')) {
    return `${titled} Controllers`;
  } else if (directory.includes('middleware')) {
    return `${titled} Middleware`;
  } else if (directory.includes('routes')) {
    return `${titled} Routes`;
  } else {
    return `${titled} Implementation`;
  }
}

// Create a new task
async function createNewTask(taskId, fileInfo) {
  // Generate a title based on the file
  const title = fileInfo.title || `Implementation of ${path.basename(fileInfo.path)}`;
  
  const newTask = {
    id: taskId,
    title,
    status: DEFAULT_STATUS,
    priority: DEFAULT_PRIORITY,
    dependencies: '-',
    loc: fileInfo.loc.toString(),
    files: [fileInfo]
  };
  
  return newTask;
}

// Generate the updated task file content
function generateUpdatedTaskFile(taskContent, tasks, taskFileMap) {
  let content = taskContent.header;
  
  // Group tasks by their prefix
  const tasksByPrefix = {
    TS: [],   // Core System Tasks
    SEC: [],  // Security & Compliance
    AI: [],   // AI/ML Integration
    PERF: [], // Performance & Scalability
    DEV: []   // Developer Experience
  };
  
  // Categorize tasks
  for (const taskId in tasks) {
    const prefix = taskId.match(/^[A-Z]+/)[0];
    if (tasksByPrefix[prefix]) {
      tasksByPrefix[prefix].push(tasks[taskId]);
    } else {
      tasksByPrefix.TS.push(tasks[taskId]); // Default to Core System
    }
  }
  
  // Sort each category by ID
  for (const prefix in tasksByPrefix) {
    tasksByPrefix[prefix].sort((a, b) => {
      const aNum = parseInt(a.id.match(/\d+/)[0]);
      const bNum = parseInt(b.id.match(/\d+/)[0]);
      return aNum - bNum;
    });
  }
  
  // Map section titles to prefixes
  const sectionPrefixMap = {
    'Core System Tasks': 'TS',
    'Security & Compliance': 'SEC',
    'AI/ML Integration': 'AI',
    'Performance & Scalability': 'PERF',
    'Developer Experience': 'DEV'
  };
  
  // Generate sections
  for (const section of taskContent.sections) {
    // Add section title
    content += `\n## ${section.title}\n\n`;
    
    // Add table header
    content += '| ID     | Title                                        | Status        | Priority    | Dependencies     | LOC   |\n';
    content += '|--------|----------------------------------------------|---------------|-------------|------------------|-------|\n';
    
    // Find tasks for this section
    const prefix = sectionPrefixMap[section.title];
    const sectionTasks = prefix ? tasksByPrefix[prefix] : [];
    
    if (sectionTasks.length === 0) {
      // Empty section
      content += '\n';
      continue;
    }
    
    // Add task rows
    for (const task of sectionTasks) {
      // Main task row
      content += `| ${task.id} | ${task.title} | ${task.status} | ${task.priority} | ${task.dependencies} | ${task.loc} |\n`;
      
      // Add indented file rows if there are files
      if (task.files && task.files.length > 0) {
        for (const file of task.files) {
          const fileName = path.basename(file.path);
          const fileDir = path.dirname(file.path);
          const displayPath = fileDir === '.' ? fileName : `${fileDir}/${fileName}`;
          const fileLoc = file.loc || '0';
          
          content += `|        | &nbsp;&nbsp;&nbsp;&nbsp;↳ \`${displayPath}\` | | | | ${fileLoc} |\n`;
        }
      }
    }
    
    // Add newline after section
    content += '\n';
  }
  
  return content;
}

// Run the automapper
automapTasks(); 