#!/usr/bin/env node

/**
 * Task Status Summary
 * 
 * This script generates a summary of task statuses from the task.md file.
 * 
 * Usage:
 *   node task-status-summary.js
 */

const fs = require('fs');
const path = require('path');

// Read the task.md file
const taskFilePath = path.join(__dirname, '../../task.md');
const taskFileContent = fs.readFileSync(taskFilePath, 'utf8');

// Parse task statuses
function parseTaskStatuses(content) {
  const statusMap = {
    '✅': 'Completed',
    '🔄': 'In Progress',
    '🔍': 'In Review',
    '🧪': 'Testing',
    '📝': 'Documentation',
    '⚠️': 'Blocked',
    '⬜': 'Todo'
  };

  const priorityMap = {
    '🔴': 'High',
    '🟠': 'Medium',
    '🔵': 'Low'
  };

  // Find all task lines - adjusted to better match the actual format in task.md
  const taskLineRegex = /^\| ([A-Z]+\d+) \| (.*?) \| ([✅🔄🔍🧪📝⚠️⬜]) (.*?) \| ([🔴🟠🔵]) (.*?) \| (.*?) \| (\d+) \|/gm;
  
  const tasks = [];
  let match;
  
  while ((match = taskLineRegex.exec(content)) !== null) {
    tasks.push({
      id: match[1],
      title: match[2],
      statusEmoji: match[3],
      status: statusMap[match[3]] || 'Unknown',
      priorityEmoji: match[5],
      priority: priorityMap[match[5]] || 'Unknown',
      dependencies: match[7],
      loc: parseInt(match[8], 10)
    });
  }
  
  // Debug task count
  console.log(`Found ${tasks.length} tasks in task.md`);
  
  return tasks;
}

// Generate summary
function generateSummary(tasks) {
  // Count by status
  const statusCounts = {};
  const priorityCounts = {};
  const categoryCount = {};
  
  tasks.forEach(task => {
    // Status count
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    
    // Priority count
    priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    
    // Category count (based on task ID prefix)
    const category = task.id.match(/^[A-Z]+/)[0];
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  // Count completed by category
  const completedByCategory = {};
  tasks.filter(task => task.status === 'Completed').forEach(task => {
    const category = task.id.match(/^[A-Z]+/)[0];
    completedByCategory[category] = (completedByCategory[category] || 0) + 1;
  });
  
  // Calculate overall progress
  const totalTasks = tasks.length;
  const completedTasks = statusCounts['Completed'] || 0;
  const progressPercentage = (completedTasks / totalTasks * 100).toFixed(1);
  
  return {
    totalTasks,
    completedTasks,
    progressPercentage,
    statusCounts,
    priorityCounts,
    categoryCount,
    completedByCategory
  };
}

// Format the summary for console output
function formatSummary(summary, tasks) {
  const { totalTasks, completedTasks, progressPercentage, statusCounts, priorityCounts, categoryCount, completedByCategory } = summary;
  
  // Create progress bar
  const progressBarLength = 30;
  const filledLength = Math.round(progressBarLength * completedTasks / totalTasks);
  const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);
  
  let output = `
=============================================
  AeroSuite Task Status Summary
=============================================

Overall Progress: ${completedTasks}/${totalTasks} tasks (${progressPercentage}%)
[${progressBar}]

Status Breakdown:
${Object.entries(statusCounts)
  .sort(([, a], [, b]) => b - a)
  .map(([status, count]) => `  ${status}: ${count} tasks (${(count / totalTasks * 100).toFixed(1)}%)`)
  .join('\n')
}

Priority Breakdown:
${Object.entries(priorityCounts)
  .sort(([a, ], [b, ]) => {
    const order = { 'High': 0, 'Medium': 1, 'Low': 2, 'Unknown': 3 };
    return order[a] - order[b];
  })
  .map(([priority, count]) => `  ${priority}: ${count} tasks (${(count / totalTasks * 100).toFixed(1)}%)`)
  .join('\n')
}

Category Breakdown:
${Object.entries(categoryCount)
  .sort(([, a], [, b]) => b - a)
  .map(([category, count]) => {
    const completedCount = completedByCategory[category] || 0;
    const categoryProgress = (completedCount / count * 100).toFixed(1);
    return `  ${category}: ${completedCount}/${count} tasks (${categoryProgress}%)`;
  })
  .join('\n')
}

Completed Tasks:
${tasks.filter(task => task.status === 'Completed')
  .map(task => `  ${task.id}: ${task.title}`)
  .join('\n')
}

=============================================
`;
  
  return output;
}

// Main function
function main() {
  try {
    const tasks = parseTaskStatuses(taskFileContent);
    const summary = generateSummary(tasks);
    const formattedSummary = formatSummary(summary, tasks);
    
    console.log(formattedSummary);
  } catch (error) {
    console.error('Error generating task summary:', error);
    process.exit(1);
  }
}

// Run the script
main(); 