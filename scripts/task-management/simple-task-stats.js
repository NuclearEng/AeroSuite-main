#!/usr/bin/env node

/**
 * Simple Task Stats
 * 
 * A basic script to count tasks by status
 */

const fs = require('fs');
const path = require('path');

// Read the task.md file
const taskFilePath = path.join(__dirname, '../../task.md');
const taskFileContent = fs.readFileSync(taskFilePath, 'utf8');

// Count tasks by status emoji
const completedCount = (taskFileContent.match(/\| ✅ Completed \|/g) || []).length;
const inProgressCount = (taskFileContent.match(/\| 🔄 In Progress \|/g) || []).length;
const blockedCount = (taskFileContent.match(/\| ⚠️ Blocked \|/g) || []).length;
const todoCount = (taskFileContent.match(/\| ⬜ Todo \|/g) || []).length;

// Count tasks by category
const securityCount = (taskFileContent.match(/\| SEC\d+ \|/g) || []).length;
const aiCount = (taskFileContent.match(/\| AI\d+ \|/g) || []).length;
const perfCount = (taskFileContent.match(/\| PERF\d+ \|/g) || []).length;
const devCount = (taskFileContent.match(/\| DEV\d+ \|/g) || []).length;

// Total tasks
const totalTasks = completedCount + inProgressCount + blockedCount + todoCount;

// Output results
console.log(`
AeroSuite Task Statistics
========================

Total Tasks: ${totalTasks}

Status Counts:
  Completed:    ${completedCount}
  In Progress:  ${inProgressCount}
  Blocked:      ${blockedCount}
  Todo:         ${todoCount}

Category Counts:
  Security:     ${securityCount}
  AI/ML:        ${aiCount}
  Performance:  ${perfCount}
  Dev Exp:      ${devCount}

Progress: ${(completedCount / totalTasks * 100).toFixed(1)}% complete
`); 