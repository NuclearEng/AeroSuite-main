#!/usr/bin/env node

/**
 * Refactor Progress Tracking Script
 * 
 * This script analyzes the refactor-tasks.md file and generates
 * progress reports for the refactoring effort.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const TASKS_FILE = path.join(__dirname, '..', 'refactor-tasks.md');
const OUTPUT_DIR = path.join(__dirname, '..', 'reports');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Status emoji mapping
const STATUS_EMOJI = {
  '✅ Completed': '✅',
  '🔄 In Progress': '🔄',
  '🔍 In Review': '🔍',
  '⬜ Todo': '⬜'
};

// Priority emoji mapping
const PRIORITY_EMOJI = {
  '🔴 High': '🔴',
  '🟠 Medium': '🟠',
  '🔵 Low': '🔵'
};

/**
 * Parse the refactor tasks file
 * @returns {Object} Parsed task data
 */
function parseTasks() {
  const content = fs.readFileSync(TASKS_FILE, 'utf8');
  const lines = content.split('\n');
  
  const tasks = [];
  let currentPhase = null;
  
  for (const line of lines) {
    // Extract phase headers
    if (line.startsWith('## ') && !line.includes('Status') && !line.includes('Priority') && !line.includes('Definition')) {
      currentPhase = line.replace('## ', '').trim();
      continue;
    }
    
    // Extract task data from table rows
    if (line.startsWith('| RF') && line.includes('|')) {
      const columns = line.split('|').map(col => col.trim()).filter(col => col);
      
      if (columns.length >= 6) {
        const [id, title, status, priority, dependencies, loc] = columns;
        
        tasks.push({
          id,
          title,
          status,
          priority,
          dependencies: dependencies.split(',').map(dep => dep.trim()).filter(dep => dep !== '-'),
          loc: parseInt(loc) || 0,
          phase: currentPhase
        });
      }
    }
  }
  
  return tasks;
}

/**
 * Generate overall progress report
 * @param {Array} tasks - Parsed tasks
 * @returns {Object} Progress statistics
 */
function generateProgressReport(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status.includes('Completed')).length;
  const inProgress = tasks.filter(task => task.status.includes('In Progress')).length;
  const inReview = tasks.filter(task => task.status.includes('In Review')).length;
  const todo = tasks.filter(task => task.status.includes('Todo')).length;
  
  const completionPercentage = (completed / total * 100).toFixed(2);
  
  // Group by phase
  const phaseProgress = {};
  tasks.forEach(task => {
    if (!phaseProgress[task.phase]) {
      phaseProgress[task.phase] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        inReview: 0,
        todo: 0
      };
    }
    
    phaseProgress[task.phase].total++;
    
    if (task.status.includes('Completed')) {
      phaseProgress[task.phase].completed++;
    } else if (task.status.includes('In Progress')) {
      phaseProgress[task.phase].inProgress++;
    } else if (task.status.includes('In Review')) {
      phaseProgress[task.phase].inReview++;
    } else if (task.status.includes('Todo')) {
      phaseProgress[task.phase].todo++;
    }
  });
  
  // Calculate phase completion percentages
  Object.keys(phaseProgress).forEach(phase => {
    phaseProgress[phase].completionPercentage = 
      (phaseProgress[phase].completed / phaseProgress[phase].total * 100).toFixed(2);
  });
  
  // Group by priority
  const priorityStats = {
    high: tasks.filter(task => task.priority.includes('High')).length,
    medium: tasks.filter(task => task.priority.includes('Medium')).length,
    low: tasks.filter(task => task.priority.includes('Low')).length
  };
  
  const highPriorityCompleted = tasks.filter(
    task => task.priority.includes('High') && task.status.includes('Completed')
  ).length;
  
  const highPriorityCompletionPercentage = 
    (highPriorityCompleted / priorityStats.high * 100).toFixed(2);
  
  return {
    total,
    completed,
    inProgress,
    inReview,
    todo,
    completionPercentage,
    phaseProgress,
    priorityStats,
    highPriorityCompleted,
    highPriorityCompletionPercentage
  };
}

/**
 * Print progress report to console
 * @param {Object} progress - Progress statistics
 */
function printProgressReport(progress) {
  console.log(chalk.bold.blue('\n===== AeroSuite Refactoring Progress Report =====\n'));
  
  console.log(chalk.bold('Overall Progress:'));
  console.log(`Total Tasks: ${progress.total}`);
  console.log(`Completed: ${chalk.green(progress.completed)} (${chalk.green(progress.completionPercentage)}%)`);
  console.log(`In Progress: ${chalk.yellow(progress.inProgress)}`);
  console.log(`In Review: ${chalk.cyan(progress.inReview)}`);
  console.log(`Todo: ${chalk.red(progress.todo)}`);
  
  console.log(chalk.bold('\nHigh Priority Progress:'));
  console.log(`High Priority Tasks: ${progress.priorityStats.high}`);
  console.log(`Completed: ${chalk.green(progress.highPriorityCompleted)} (${chalk.green(progress.highPriorityCompletionPercentage)}%)`);
  
  console.log(chalk.bold('\nProgress by Phase:'));
  Object.keys(progress.phaseProgress).forEach(phase => {
    const phaseData = progress.phaseProgress[phase];
    console.log(chalk.bold(`\n${phase}:`));
    console.log(`Total Tasks: ${phaseData.total}`);
    console.log(`Completed: ${chalk.green(phaseData.completed)} (${chalk.green(phaseData.completionPercentage)}%)`);
    console.log(`In Progress: ${chalk.yellow(phaseData.inProgress)}`);
    console.log(`In Review: ${chalk.cyan(phaseData.inReview)}`);
    console.log(`Todo: ${chalk.red(phaseData.todo)}`);
  });
  
  console.log(chalk.bold.blue('\n=================================================\n'));
}

/**
 * Generate next tasks recommendation
 * @param {Array} tasks - Parsed tasks
 * @returns {Array} Recommended next tasks
 */
function generateNextTasksRecommendation(tasks) {
  // Find completed task IDs
  const completedTaskIds = new Set(
    tasks
      .filter(task => task.status.includes('Completed'))
      .map(task => task.id)
  );
  
  // Find tasks in progress
  const tasksInProgress = tasks.filter(task => task.status.includes('In Progress'));
  
  // Find tasks that are ready to start (all dependencies completed)
  const readyTasks = tasks.filter(task => {
    if (!task.status.includes('Todo')) {
      return false;
    }
    
    // Check if all dependencies are completed
    return task.dependencies.every(dep => completedTaskIds.has(dep));
  });
  
  // Sort ready tasks by priority (High > Medium > Low)
  const sortedReadyTasks = [...readyTasks].sort((a, b) => {
    const priorityOrder = { '🔴 High': 0, '🟠 Medium': 1, '🔵 Low': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  return {
    inProgress: tasksInProgress,
    readyTasks: sortedReadyTasks.slice(0, 5) // Top 5 recommended tasks
  };
}

/**
 * Print next tasks recommendation to console
 * @param {Object} recommendation - Next tasks recommendation
 */
function printNextTasksRecommendation(recommendation) {
  console.log(chalk.bold.green('\n===== Recommended Next Actions =====\n'));
  
  console.log(chalk.bold('Currently In Progress:'));
  if (recommendation.inProgress.length === 0) {
    console.log('No tasks currently in progress.');
  } else {
    recommendation.inProgress.forEach(task => {
      console.log(`${chalk.yellow(task.id)}: ${task.title} ${chalk.cyan('(' + task.phase + ')')}`);
    });
  }
  
  console.log(chalk.bold('\nReady to Start (All Dependencies Completed):'));
  if (recommendation.readyTasks.length === 0) {
    console.log('No tasks ready to start. Complete in-progress task dependencies first.');
  } else {
    recommendation.readyTasks.forEach(task => {
      console.log(`${chalk.green(task.id)}: ${task.title} ${chalk.magenta(task.priority)} ${chalk.cyan('(' + task.phase + ')')}`);
    });
  }
  
  console.log(chalk.bold.green('\n===================================\n'));
}

/**
 * Generate HTML report
 * @param {Array} tasks - Parsed tasks
 * @param {Object} progress - Progress statistics
 * @param {Object} recommendation - Next tasks recommendation
 * @returns {string} HTML report content
 */
function generateHtmlReport(tasks, progress, recommendation) {
  // Create progress bar HTML
  const progressBarHtml = `
    <div class="progress-bar">
      <div class="progress-segment completed" style="width: ${progress.completed / progress.total * 100}%" title="Completed: ${progress.completed}"></div>
      <div class="progress-segment in-review" style="width: ${progress.inReview / progress.total * 100}%" title="In Review: ${progress.inReview}"></div>
      <div class="progress-segment in-progress" style="width: ${progress.inProgress / progress.total * 100}%" title="In Progress: ${progress.inProgress}"></div>
      <div class="progress-segment todo" style="width: ${progress.todo / progress.total * 100}%" title="Todo: ${progress.todo}"></div>
    </div>
  `;
  
  // Create phase progress HTML
  let phaseProgressHtml = '';
  Object.keys(progress.phaseProgress).forEach(phase => {
    const phaseData = progress.phaseProgress[phase];
    phaseProgressHtml += `
      <div class="phase-progress">
        <h3>${phase}</h3>
        <div class="progress-bar">
          <div class="progress-segment completed" style="width: ${phaseData.completed / phaseData.total * 100}%" title="Completed: ${phaseData.completed}"></div>
          <div class="progress-segment in-review" style="width: ${phaseData.inReview / phaseData.total * 100}%" title="In Review: ${phaseData.inReview}"></div>
          <div class="progress-segment in-progress" style="width: ${phaseData.inProgress / phaseData.total * 100}%" title="In Progress: ${phaseData.inProgress}"></div>
          <div class="progress-segment todo" style="width: ${phaseData.todo / phaseData.total * 100}%" title="Todo: ${phaseData.todo}"></div>
        </div>
        <div class="phase-stats">
          <span>Completed: ${phaseData.completed}/${phaseData.total} (${phaseData.completionPercentage}%)</span>
        </div>
      </div>
    `;
  });
  
  // Create recommended tasks HTML
  let recommendedTasksHtml = '<h3>Currently In Progress:</h3>';
  if (recommendation.inProgress.length === 0) {
    recommendedTasksHtml += '<p>No tasks currently in progress.</p>';
  } else {
    recommendedTasksHtml += '<ul>';
    recommendation.inProgress.forEach(task => {
      recommendedTasksHtml += `<li><strong>${task.id}</strong>: ${task.title} <span class="phase-tag">${task.phase}</span></li>`;
    });
    recommendedTasksHtml += '</ul>';
  }
  
  recommendedTasksHtml += '<h3>Ready to Start:</h3>';
  if (recommendation.readyTasks.length === 0) {
    recommendedTasksHtml += '<p>No tasks ready to start. Complete in-progress task dependencies first.</p>';
  } else {
    recommendedTasksHtml += '<ul>';
    recommendation.readyTasks.forEach(task => {
      const priorityClass = task.priority.includes('High') ? 'high-priority' : 
                           task.priority.includes('Medium') ? 'medium-priority' : 'low-priority';
      recommendedTasksHtml += `
        <li>
          <strong>${task.id}</strong>: ${task.title} 
          <span class="priority-tag ${priorityClass}">${task.priority}</span>
          <span class="phase-tag">${task.phase}</span>
        </li>
      `;
    });
    recommendedTasksHtml += '</ul>';
  }
  
  // Create tasks table HTML
  let tasksTableHtml = '';
  const phases = [...new Set(tasks.map(task => task.phase))];
  
  phases.forEach(phase => {
    const phaseTasks = tasks.filter(task => task.phase === phase);
    
    tasksTableHtml += `
      <h3>${phase}</h3>
      <table class="tasks-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Dependencies</th>
            <th>LOC</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    phaseTasks.forEach(task => {
      const statusClass = task.status.includes('Completed') ? 'status-completed' :
                         task.status.includes('In Progress') ? 'status-in-progress' :
                         task.status.includes('In Review') ? 'status-in-review' : 'status-todo';
      
      const priorityClass = task.priority.includes('High') ? 'priority-high' :
                           task.priority.includes('Medium') ? 'priority-medium' : 'priority-low';
      
      tasksTableHtml += `
        <tr>
          <td>${task.id}</td>
          <td>${task.title}</td>
          <td class="${statusClass}">${task.status}</td>
          <td class="${priorityClass}">${task.priority}</td>
          <td>${task.dependencies.join(', ') || '-'}</td>
          <td>${task.loc}</td>
        </tr>
      `;
    });
    
    tasksTableHtml += `
        </tbody>
      </table>
    `;
  });
  
  // Full HTML report
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AeroSuite Refactoring Progress Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2, h3 {
          color: #2c3e50;
        }
        .report-header {
          background-color: #34495e;
          color: white;
          padding: 20px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .report-header h1 {
          color: white;
          margin: 0;
        }
        .report-header p {
          margin: 5px 0 0;
          opacity: 0.8;
        }
        .report-section {
          background-color: #fff;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          padding: 20px;
          margin-bottom: 20px;
        }
        .progress-bar {
          height: 30px;
          background-color: #ecf0f1;
          border-radius: 5px;
          overflow: hidden;
          margin: 15px 0;
        }
        .progress-segment {
          height: 100%;
          float: left;
        }
        .completed {
          background-color: #2ecc71;
        }
        .in-review {
          background-color: #3498db;
        }
        .in-progress {
          background-color: #f39c12;
        }
        .todo {
          background-color: #e74c3c;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .stat-box {
          background-color: #f8f9fa;
          border-radius: 5px;
          padding: 15px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          margin: 10px 0;
        }
        .phase-progress {
          margin-bottom: 20px;
        }
        .phase-stats {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #7f8c8d;
        }
        .tasks-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .tasks-table th, .tasks-table td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }
        .tasks-table th {
          background-color: #f2f2f2;
        }
        .tasks-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .status-completed {
          color: #27ae60;
          font-weight: bold;
        }
        .status-in-progress {
          color: #f39c12;
          font-weight: bold;
        }
        .status-in-review {
          color: #3498db;
          font-weight: bold;
        }
        .status-todo {
          color: #e74c3c;
        }
        .priority-high {
          color: #e74c3c;
          font-weight: bold;
        }
        .priority-medium {
          color: #f39c12;
          font-weight: bold;
        }
        .priority-low {
          color: #3498db;
        }
        .phase-tag {
          background-color: #34495e;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
          margin-left: 5px;
        }
        .priority-tag {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
          margin-left: 5px;
        }
        .high-priority {
          background-color: #e74c3c;
          color: white;
        }
        .medium-priority {
          background-color: #f39c12;
          color: white;
        }
        .low-priority {
          background-color: #3498db;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>AeroSuite Refactoring Progress Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="report-section">
        <h2>Overall Progress</h2>
        ${progressBarHtml}
        <div class="stats-grid">
          <div class="stat-box">
            <div>Total Tasks</div>
            <div class="stat-value">${progress.total}</div>
          </div>
          <div class="stat-box">
            <div>Completed</div>
            <div class="stat-value" style="color: #2ecc71">${progress.completed}</div>
            <div>${progress.completionPercentage}%</div>
          </div>
          <div class="stat-box">
            <div>In Progress</div>
            <div class="stat-value" style="color: #f39c12">${progress.inProgress}</div>
          </div>
          <div class="stat-box">
            <div>In Review</div>
            <div class="stat-value" style="color: #3498db">${progress.inReview}</div>
          </div>
          <div class="stat-box">
            <div>Todo</div>
            <div class="stat-value" style="color: #e74c3c">${progress.todo}</div>
          </div>
        </div>
      </div>
      
      <div class="report-section">
        <h2>Progress by Phase</h2>
        ${phaseProgressHtml}
      </div>
      
      <div class="report-section">
        <h2>Recommended Next Actions</h2>
        ${recommendedTasksHtml}
      </div>
      
      <div class="report-section">
        <h2>Tasks by Phase</h2>
        ${tasksTableHtml}
      </div>
      
      <footer style="text-align: center; margin-top: 30px; color: #7f8c8d;">
        <p>AeroSuite Refactoring Progress Report</p>
      </footer>
    </body>
    </html>
  `;
}

/**
 * Save HTML report to file
 * @param {string} html - HTML report content
 */
function saveHtmlReport(html) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `refactor-progress-${timestamp}.html`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  fs.writeFileSync(filepath, html);
  console.log(chalk.green(`\nHTML report saved to: ${filepath}`));
}

/**
 * Main function
 */
function main() {
  try {
    console.log(chalk.blue('Analyzing refactoring tasks...'));
    
    const tasks = parseTasks();
    const progress = generateProgressReport(tasks);
    const recommendation = generateNextTasksRecommendation(tasks);
    
    printProgressReport(progress);
    printNextTasksRecommendation(recommendation);
    
    const html = generateHtmlReport(tasks, progress, recommendation);
    saveHtmlReport(html);
    
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

// Run the script
main(); 