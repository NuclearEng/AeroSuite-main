#!/usr/bin/env node

/**
 * Task Deduplication Script for AeroSuite
 * 
 * This script:
 * 1. Identifies duplicate task entries for the same files
 * 2. Consolidates them into a single task entry per unique file
 * 3. Removes redundant task entries
 * 4. Updates the task.md file with the cleaned-up content
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const BACKUP_PATH = path.join(process.cwd(), 'task.md.original');

// Main function
async function deduplicateTasks() {
  try {
    console.log('🔍 Starting task deduplication...');
    
    // Backup task.md first
    fs.copyFileSync(TASK_FILE_PATH, BACKUP_PATH);
    console.log(`📋 Backed up task.md to ${BACKUP_PATH}`);
    
    // Read task file
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    
    // Split by sections
    const sections = splitContentIntoSections(content);
    
    // Process each section
    const processedSections = sections.map(section => {
      // Only process task tables
      if (isTaskTableSection(section)) {
        return processTaskSection(section);
      }
      return section;
    });
    
    // Join sections back together
    const processedContent = processedSections.join('\n\n');
    
    // Write back the processed content
    fs.writeFileSync(TASK_FILE_PATH, processedContent, 'utf8');
    
    console.log('✅ Task deduplication complete!');
    console.log(`📋 Original task file backed up to ${BACKUP_PATH}`);
    
  } catch (error) {
    console.error('❌ Error during task deduplication:', error);
    process.exit(1);
  }
}

// Split content into sections based on markdown headers
function splitContentIntoSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // If this is a main section header, start a new section
    if (line.startsWith('## ')) {
      if (currentSection.length > 0) {
        sections.push(currentSection.join('\n'));
        currentSection = [];
      }
    }
    
    currentSection.push(line);
  }
  
  // Add the last section
  if (currentSection.length > 0) {
    sections.push(currentSection.join('\n'));
  }
  
  return sections;
}

// Check if a section contains a task table
function isTaskTableSection(section) {
  return section.includes('| ID     | Title') && section.includes('|--------|');
}

// Process a task table section to deduplicate tasks
function processTaskSection(section) {
  const lines = section.split('\n');
  const processedLines = [];
  const fileTaskMap = {}; // Map files to task IDs
  const fileContentMap = {}; // Map files to their lines in the task file
  let currentTaskId = null;
  
  // First pass: build maps of files to tasks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Task ID line (main task row)
    if (line.match(/^\| (TS|SEC|AI|PERF|DEV)\d{3} \|/)) {
      const taskIdMatch = line.match(/^\| (TS|SEC|AI|PERF|DEV)\d{3} \|/);
      if (taskIdMatch) {
        currentTaskId = taskIdMatch[0].replace(/^\| |\s\|$/g, '');
      }
    } 
    // File reference line
    else if (line.match(/^\|\s+\| &nbsp;&nbsp;&nbsp;&nbsp;↳ `(.+)` \|/)) {
      const fileMatch = line.match(/^\|\s+\| &nbsp;&nbsp;&nbsp;&nbsp;↳ `(.+)` \|/);
      if (fileMatch && currentTaskId) {
        const filePath = fileMatch[1];
        
        if (!fileTaskMap[filePath]) {
          fileTaskMap[filePath] = [];
          fileContentMap[filePath] = [];
        }
        
        fileTaskMap[filePath].push(currentTaskId);
        fileContentMap[filePath].push(line);
      }
    }
  }
  
  // Find duplicate file references
  const duplicateFiles = Object.keys(fileTaskMap).filter(file => fileTaskMap[file].length > 1);
  
  console.log(`📊 Found ${duplicateFiles.length} files with duplicate task references`);
  
  // Create a map of files to their "best" task ID
  const fileBestTaskMap = {};
  for (const file of duplicateFiles) {
    // Choose the task with the lowest number as the "best" one
    const tasks = fileTaskMap[file];
    tasks.sort((a, b) => {
      const aNum = parseInt(a.replace(/\D/g, ''));
      const bNum = parseInt(b.replace(/\D/g, ''));
      return aNum - bNum;
    });
    
    // Choose the original task (lowest number) as the "best" one
    fileBestTaskMap[file] = tasks[0];
    
    console.log(`🔄 Consolidating file "${file}" under task ${tasks[0]}`);
  }
  
  // Second pass: rebuild the section with deduplicated tasks
  currentTaskId = null;
  let shouldIncludeLine = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Task ID line (main task row)
    if (line.match(/^\| (TS|SEC|AI|PERF|DEV)\d{3} \|/)) {
      const taskIdMatch = line.match(/^\| (TS|SEC|AI|PERF|DEV)\d{3} \|/);
      if (taskIdMatch) {
        currentTaskId = taskIdMatch[0].replace(/^\| |\s\|$/g, '');
        shouldIncludeLine = true;
        processedLines.push(line);
      }
    } 
    // File reference line
    else if (line.match(/^\|\s+\| &nbsp;&nbsp;&nbsp;&nbsp;↳ `(.+)` \|/)) {
      const fileMatch = line.match(/^\|\s+\| &nbsp;&nbsp;&nbsp;&nbsp;↳ `(.+)` \|/);
      if (fileMatch && currentTaskId) {
        const filePath = fileMatch[1];
        
        // Only include this file reference if it belongs to the "best" task for this file
        // or if it's not a duplicate
        if (!fileBestTaskMap[filePath] || fileBestTaskMap[filePath] === currentTaskId) {
          processedLines.push(line);
        }
      }
    } 
    // Any other line
    else {
      if (shouldIncludeLine) {
        processedLines.push(line);
      }
    }
  }
  
  return processedLines.join('\n');
}

// Run the script
deduplicateTasks(); 