#!/usr/bin/env node

/**
 * Task Title Deduplication Script for AeroSuite
 * 
 * This script:
 * 1. Identifies tasks with identical or similar titles
 * 2. Consolidates them into single task entries
 * 3. Updates the task.md file with the cleaned-up content
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const BACKUP_PATH = path.join(process.cwd(), 'task.md.title-dedup');

// Main function
async function deduplicateTaskTitles() {
  try {
    console.log('🔍 Starting task title deduplication...');
    
    // Backup task.md first
    fs.copyFileSync(TASK_FILE_PATH, BACKUP_PATH);
    console.log(`📋 Backed up task.md to ${BACKUP_PATH}`);
    
    // Read task file
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    const lines = content.split('\n');
    
    // Extract tasks
    const tasks = extractTasks(lines);
    console.log(`📊 Extracted ${Object.keys(tasks).length} tasks from task.md`);
    
    // Find duplicate titles
    const {duplicateTitles, titleToTasksMap} = findDuplicateTitles(tasks);
    console.log(`📊 Found ${duplicateTitles.length} duplicate task titles`);
    
    // Consolidate duplicate tasks
    const updatedTasks = consolidateDuplicateTasks(tasks, titleToTasksMap);
    
    // Rebuild the task file content
    const updatedContent = rebuildTaskFile(lines, updatedTasks);
    
    // Write back the processed content
    fs.writeFileSync(TASK_FILE_PATH, updatedContent, 'utf8');
    
    console.log('✅ Task title deduplication complete!');
    console.log(`📋 Original task file backed up to ${BACKUP_PATH}`);
    
  } catch (error) {
    console.error('❌ Error during task title deduplication:', error);
    process.exit(1);
  }
}

// Extract tasks from lines
function extractTasks(lines) {
  const tasks = {};
  let currentTask = null;
  let fileLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Task ID line (main task row)
    if (line.match(/^\| (TS|SEC|AI|PERF|DEV)\d{3} \|/)) {
      // Save previous task
      if (currentTask) {
        tasks[currentTask.id].files = fileLines;
        fileLines = [];
      }
      
      // Parse task information
      const columns = line.split('|').filter(col => col.trim().length > 0);
      if (columns.length >= 5) {
        const taskId = columns[0].trim();
        const title = columns[1].trim();
        const status = columns[2].trim();
        const priority = columns[3].trim();
        const dependencies = columns[4].trim();
        const loc = columns.length > 5 ? columns[5].trim() : '0';
        
        tasks[taskId] = {
          id: taskId,
          title,
          status,
          priority,
          dependencies,
          loc,
          line: i,
          files: []
        };
        
        currentTask = tasks[taskId];
      }
    } 
    // File reference line
    else if (line.match(/^\|\s+\| &nbsp;&nbsp;&nbsp;&nbsp;↳ `(.+)` \|/)) {
      if (currentTask) {
        fileLines.push({
          line: i,
          content: lines[i]
        });
      }
    }
  }
  
  // Save the last task's files
  if (currentTask) {
    tasks[currentTask.id].files = fileLines;
  }
  
  return tasks;
}

// Find duplicate titles
function findDuplicateTitles(tasks) {
  const titleToTasksMap = {};
  
  // Group tasks by normalized title
  Object.values(tasks).forEach(task => {
    // Normalize title: lowercase, remove extra spaces, and strip redundant words
    let normalizedTitle = task.title.toLowerCase()
                             .replace(/\s+/g, ' ')
                             .replace(/components\s+components/g, 'components')
                             .replace(/hooks\s+hooks/g, 'hooks')
                             .replace(/utilities\s+utilities/g, 'utilities')
                             .replace(/implementation\s+implementation/g, 'implementation')
                             .replace(/routes\s+routes/g, 'routes')
                             .trim();
    
    if (!titleToTasksMap[normalizedTitle]) {
      titleToTasksMap[normalizedTitle] = [];
    }
    
    titleToTasksMap[normalizedTitle].push(task.id);
  });
  
  // Find titles that have multiple tasks
  const duplicateTitles = Object.keys(titleToTasksMap)
                               .filter(title => titleToTasksMap[title].length > 1);
  
  return {duplicateTitles, titleToTasksMap};
}

// Consolidate duplicate tasks
function consolidateDuplicateTasks(tasks, titleToTasksMap) {
  const updatedTasks = {...tasks};
  
  Object.keys(titleToTasksMap).forEach(title => {
    const taskIds = titleToTasksMap[title];
    
    if (taskIds.length > 1) {
      console.log(`🔄 Consolidating ${taskIds.length} tasks with title "${title}"`);
      
      // Sort task IDs numerically
      taskIds.sort((a, b) => {
        const aNum = parseInt(a.replace(/\D/g, ''));
        const bNum = parseInt(b.replace(/\D/g, ''));
        return aNum - bNum;
      });
      
      // The first task ID is the primary one to keep
      const primaryTaskId = taskIds[0];
      const primaryTask = updatedTasks[primaryTaskId];
      
      // Merge files from all duplicate tasks into the primary task
      for (let i = 1; i < taskIds.length; i++) {
        const duplicateTaskId = taskIds[i];
        const duplicateTask = updatedTasks[duplicateTaskId];
        
        // Add files from duplicate task to primary task
        primaryTask.files = [...primaryTask.files, ...duplicateTask.files];
        
        // Mark the duplicate task for removal by setting keep to false
        updatedTasks[duplicateTaskId].keep = false;
        
        console.log(`  - Moving files from ${duplicateTaskId} to ${primaryTaskId}`);
      }
      
      // Clean title for primary task (remove redundant words)
      primaryTask.title = cleanTitle(primaryTask.title);
      
      // Update LOC by summing all merged tasks
      const totalLOC = taskIds.reduce((sum, id) => sum + parseInt(tasks[id].loc || '0'), 0);
      primaryTask.loc = totalLOC.toString();
    }
  });
  
  return updatedTasks;
}

// Clean up a task title
function cleanTitle(title) {
  return title
    .replace(/Components\s+Components/g, 'Components')
    .replace(/Hooks\s+Hooks/g, 'Hooks')
    .replace(/Utilities\s+Utilities/g, 'Utilities')
    .replace(/Implementation\s+Implementation/g, 'Implementation')
    .replace(/Routes\s+Routes/g, 'Routes')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Rebuild the task file content
function rebuildTaskFile(originalLines, updatedTasks) {
  const lines = [...originalLines];
  const taskLines = {};
  const fileLines = {};
  
  // Collect all lines to remove (tasks marked for removal and their files)
  Object.values(updatedTasks).forEach(task => {
    if (task.keep === false) {
      // Mark the task line for removal
      taskLines[task.line] = true;
      
      // Mark all file lines for removal
      task.files.forEach(file => {
        fileLines[file.line] = true;
      });
    }
  });
  
  // Update lines of primary tasks that have been modified
  Object.values(updatedTasks).forEach(task => {
    if (task.keep !== false) {
      // Update the task line with the new title and LOC
      const taskLine = lines[task.line];
      const columns = taskLine.split('|');
      
      if (columns.length >= 7) {
        columns[2] = ` ${task.title} `;
        columns[6] = ` ${task.loc} `;
        lines[task.line] = columns.join('|');
      }
    }
  });
  
  // Filter out lines marked for removal
  const updatedLines = lines.filter((_, index) => !taskLines[index] && !fileLines[index]);
  
  return updatedLines.join('\n');
}

// Run the script
deduplicateTaskTitles(); 