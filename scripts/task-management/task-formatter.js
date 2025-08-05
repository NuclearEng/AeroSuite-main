#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const OUTPUT_FILE_PATH = path.join(process.cwd(), 'task.md');

// Main function
async function formatTaskFile() {
  try {
    console.log('Reading task file...');
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    
    // Extract sections
    const sections = extractSections(content);
    
    // Format and write back
    const formattedContent = formatSections(sections);
    fs.writeFileSync(OUTPUT_FILE_PATH, formattedContent, 'utf8');
    
    console.log('Task file formatted successfully!');
  } catch (error) {
    console.error('Error formatting task file:', error);
    process.exit(1);
  }
}

// Extract sections from content
function extractSections(content) {
  const sections = {
    header: '',
    legend: '',
    tasks: [],
    missingTasks: [],
    security: [],
    aiml: [],
    performance: [],
    devExperience: []
  };
  
  // Basic parsing of sections
  const lines = content.split('\n');
  let currentSection = 'header';
  let currentTask = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Section detection
    if (line.startsWith('# ')) {
      sections.header += line + '\n';
      continue;
    } else if (line.startsWith('## Status and Priority Legend')) {
      currentSection = 'legend';
      sections.legend += line + '\n';
      continue;
    } else if (line.startsWith('## Tasks')) {
      currentSection = 'tasks';
      sections.tasks.push(line);
      continue;
    } else if (line.startsWith('## Missing Critical Tasks')) {
      currentSection = 'missingTasks';
      sections.missingTasks.push(line);
      continue;
    } else if (line.startsWith('## Security & Compliance')) {
      currentSection = 'security';
      sections.security.push(line);
      continue;
    } else if (line.startsWith('## AI/ML Integration')) {
      currentSection = 'aiml';
      sections.aiml.push(line);
      continue;
    } else if (line.startsWith('## Performance & Scalability')) {
      currentSection = 'performance';
      sections.performance.push(line);
      continue;
    } else if (line.startsWith('## Developer Experience')) {
      currentSection = 'devExperience';
      sections.devExperience.push(line);
      continue;
    }
    
    // Add line to current section
    if (currentSection === 'legend') {
      sections.legend += line + '\n';
    } else if (currentSection === 'tasks') {
      sections.tasks.push(line);
    } else if (currentSection === 'missingTasks') {
      sections.missingTasks.push(line);
    } else if (currentSection === 'security') {
      sections.security.push(line);
    } else if (currentSection === 'aiml') {
      sections.aiml.push(line);
    } else if (currentSection === 'performance') {
      sections.performance.push(line);
    } else if (currentSection === 'devExperience') {
      sections.devExperience.push(line);
    } else {
      sections.header += line + '\n';
    }
  }
  
  return sections;
}

// Format sections
function formatSections(sections) {
  let formattedContent = '';
  
  // Header
  formattedContent += sections.header;
  
  // Legend
  formattedContent += sections.legend;
  
  // Tasks
  formattedContent += formatTaskTable(sections.tasks, 'Tasks');
  
  // Missing Critical Tasks
  if (sections.missingTasks.length > 0) {
    formattedContent += formatTaskTable(sections.missingTasks, 'Missing Critical Tasks');
  }
  
  // Security & Compliance
  if (sections.security.length > 0) {
    formattedContent += formatTaskTable(sections.security, 'Security & Compliance');
  }
  
  // AI/ML Integration
  if (sections.aiml.length > 0) {
    formattedContent += formatTaskTable(sections.aiml, 'AI/ML Integration');
  }
  
  // Performance & Scalability
  if (sections.performance.length > 0) {
    formattedContent += formatTaskTable(sections.performance, 'Performance & Scalability');
  }
  
  // Developer Experience
  if (sections.devExperience.length > 0) {
    formattedContent += formatTaskTable(sections.devExperience, 'Developer Experience');
  }
  
  return formattedContent;
}

// Format a task table
function formatTaskTable(taskLines, sectionTitle) {
  if (taskLines.length === 0) return '';
  
  let result = '';
  const headerLine = taskLines[0].startsWith('##') ? taskLines[0] : `## ${sectionTitle}`;
  result += `\n${headerLine}\n\n`;
  
  // Find table header row
  let headerRowIndex = -1;
  for (let i = 0; i < taskLines.length; i++) {
    if (taskLines[i].trim().startsWith('| ID')) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    // No table found, just return the lines
    return result + taskLines.slice(1).join('\n') + '\n';
  }
  
  // Get and format header row
  const headerRow = taskLines[headerRowIndex];
  result += headerRow + '\n';
  
  // Get and format separator row
  const separatorRow = taskLines[headerRowIndex + 1];
  result += separatorRow + '\n';
  
  // Parse and format task rows
  const tasks = [];
  for (let i = headerRowIndex + 2; i < taskLines.length; i++) {
    const line = taskLines[i].trim();
    if (line.startsWith('|') && !line.startsWith('|--') && line.includes('|')) {
      const task = parseTaskRow(line);
      if (task) {
        tasks.push(task);
      }
    }
  }
  
  // Sort tasks by ID
  tasks.sort((a, b) => {
    // Extract numeric part of IDs
    const aId = a.id.match(/\d+/);
    const bId = b.id.match(/\d+/);
    
    if (aId && bId) {
      return parseInt(aId[0]) - parseInt(bId[0]);
    }
    
    return a.id.localeCompare(b.id);
  });
  
  // Format task rows
  for (const task of tasks) {
    result += formatTaskRow(task) + '\n';
  }
  
  return result;
}

// Parse a task row from the table
function parseTaskRow(line) {
  const parts = line.split('|').map(part => part.trim());
  
  if (parts.length < 6) return null;
  
  return {
    id: parts[1],
    title: parts[2],
    status: parts[3],
    priority: parts[4],
    dependencies: parts[5],
    loc: parts[6]
  };
}

// Format a task row for the table
function formatTaskRow(task) {
  return `| ${task.id.padEnd(5)} | ${task.title.padEnd(40)} | ${task.status.padEnd(13)} | ${task.priority.padEnd(11)} | ${task.dependencies.padEnd(16)} | ${task.loc.padEnd(5)} |`;
}

// Run the main function
formatTaskFile(); 