#!/usr/bin/env node

/**
 * Task Metrics Dashboard Generator
 * 
 * This script analyzes the task-to-code relationships and generates metrics
 * for reporting and visualization purposes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const OUTPUT_DIR = path.join(process.cwd(), 'reports', 'task-management');
const METRICS_FILE = path.join(OUTPUT_DIR, 'task-metrics.json');
const HTML_DASHBOARD = path.join(OUTPUT_DIR, 'task-metrics-dashboard.html');

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Parse the task.md file to extract task information
 * @returns {Map} A map of task IDs to task objects
 */
function parseTasks() {
  try {
    const taskContent = fs.readFileSync(TASK_FILE_PATH, 'utf-8');
    const taskMap = new Map();
    
    // Regular expression to match task entries
    const taskRegex = /\|\s*(TS\d{3}|SEC\d{3}|AI\d{3}|PERF\d{3}|DEV\d{3})\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*(\d+)\s*\|/g;
    
    let match;
    while ((match = taskRegex.exec(taskContent)) !== null) {
      const taskId = match[1].trim();
      const title = match[2].trim();
      const status = match[3].trim();
      const priority = match[4].trim();
      const dependencies = match[5].trim();
      const loc = parseInt(match[6].trim(), 10) || 0;
      
      // Determine category based on task ID prefix
      let category = 'Core';
      if (taskId.startsWith('SEC')) category = 'Security';
      else if (taskId.startsWith('AI')) category = 'AI/ML';
      else if (taskId.startsWith('PERF')) category = 'Performance';
      else if (taskId.startsWith('DEV')) category = 'DevOps';
      
      taskMap.set(taskId, {
        id: taskId,
        title,
        status,
        priority,
        dependencies: dependencies !== '-' ? dependencies.split(',').map(d => d.trim()) : [],
        loc,
        category,
        files: []
      });
    }
    
    return taskMap;
  } catch (error) {
    console.error(`Error parsing task file: ${error.message}`);
    return new Map();
  }
}

/**
 * Find files with task references
 * @param {Map} taskMap The map of tasks
 * @returns {Map} Updated task map with file references
 */
function findTaskReferences(taskMap) {
  try {
    console.log('Scanning codebase for task references...');
    
    // Count total files in the project (excluding certain directories)
    const totalFilesCmd = `find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/build/*" -not -path "*/dist/*" | wc -l`;
    const totalFiles = parseInt(execSync(totalFilesCmd, { encoding: 'utf-8' }).trim(), 10);
    
    // Find all files with task references
    taskMap.forEach((task, taskId) => {
      try {
        const grepCmd = `grep -r "@task\\s*${taskId}\\b" --include="*.{js,jsx,ts,tsx,py,java,md,html,css,scss}" . | grep -v "node_modules" | grep -v ".git"`;
        const result = execSync(grepCmd, { encoding: 'utf-8' }).trim();
        
        if (result) {
          const files = result.split('\n')
            .map(line => line.split(':')[0])
            .filter(Boolean);
          
          task.files = Array.from(new Set(files)); // Remove duplicates
        }
      } catch (err) {
        // grep returns non-zero exit code if no matches found, which is not an error for us
        if (err.status !== 1) {
          console.error(`Error scanning for task ${taskId}: ${err.message}`);
        }
      }
    });
    
    // Calculate overall metrics
    const metrics = {
      totalTasks: taskMap.size,
      totalFiles,
      filesWithReferences: 0,
      tasksByStatus: {
        completed: 0,
        inProgress: 0,
        todo: 0
      },
      tasksByCategory: {},
      tasksByPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      coveragePercentage: 0,
      taskCompletionRate: 0,
      averageFilesPerTask: 0,
      topTasksByFileCount: [],
      taskCoverage: {},
      recentActivity: []
    };
    
    // Set of files with references to avoid double-counting
    const filesWithReferences = new Set();
    
    // Process tasks and calculate metrics
    taskMap.forEach(task => {
      // Count by status
      if (task.status.includes('✅')) metrics.tasksByStatus.completed++;
      else if (task.status.includes('🔄')) metrics.tasksByStatus.inProgress++;
      else metrics.tasksByStatus.todo++;
      
      // Count by category
      metrics.tasksByCategory[task.category] = (metrics.tasksByCategory[task.category] || 0) + 1;
      
      // Count by priority
      if (task.priority.includes('🔴')) metrics.tasksByPriority.high++;
      else if (task.priority.includes('🟠')) metrics.tasksByPriority.medium++;
      else metrics.tasksByPriority.low++;
      
      // Track files with references
      task.files.forEach(file => filesWithReferences.add(file));
      
      // Task coverage (percentage of expected LOC that has file references)
      const expectedFileCount = Math.ceil(task.loc / 100); // Rough estimate: 1 file per 100 LOC
      const actualFileCount = task.files.length;
      task.coverage = task.loc > 0 ? Math.min(100, Math.round((actualFileCount / expectedFileCount) * 100)) : 0;
      
      metrics.taskCoverage[task.id] = {
        id: task.id,
        title: task.title,
        status: task.status,
        expectedFileCount,
        actualFileCount,
        coverage: task.coverage
      };
    });
    
    metrics.filesWithReferences = filesWithReferences.size;
    metrics.coveragePercentage = metrics.totalFiles > 0 ? Math.round((metrics.filesWithReferences / metrics.totalFiles) * 100) : 0;
    metrics.taskCompletionRate = metrics.totalTasks > 0 ? Math.round((metrics.tasksByStatus.completed / metrics.totalTasks) * 100) : 0;
    metrics.averageFilesPerTask = metrics.totalTasks > 0 ? Math.round((metrics.filesWithReferences / metrics.totalTasks) * 10) / 10 : 0;
    
    // Get top tasks by file count
    metrics.topTasksByFileCount = Array.from(taskMap.values())
      .sort((a, b) => b.files.length - a.files.length)
      .slice(0, 10)
      .map(task => ({
        id: task.id,
        title: task.title,
        fileCount: task.files.length
      }));
    
    // Get recent activity from git log
    try {
      const gitLogCmd = `git log --pretty=format:"%h|%an|%at|%s" -n 20`;
      const gitLog = execSync(gitLogCmd, { encoding: 'utf-8' }).trim().split('\n');
      
      metrics.recentActivity = gitLog.map(line => {
        const [hash, author, timestamp, message] = line.split('|');
        const date = new Date(parseInt(timestamp, 10) * 1000);
        
        // Extract task ID from commit message
        const taskIdMatch = message.match(/\[(TS|SEC|AI|PERF|DEV)\d{3}\]/);
        const taskId = taskIdMatch ? taskIdMatch[0].replace(/[\[\]]/g, '') : null;
        
        return {
          hash,
          author,
          date: date.toISOString(),
          message,
          taskId
        };
      });
    } catch (err) {
      console.error(`Error getting git log: ${err.message}`);
    }
    
    // Save metrics to JSON file
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
    console.log(`Metrics saved to ${METRICS_FILE}`);
    
    // Generate HTML dashboard
    generateHtmlDashboard(metrics, taskMap);
    
    return taskMap;
  } catch (error) {
    console.error(`Error finding task references: ${error.message}`);
    return taskMap;
  }
}

/**
 * Generate HTML dashboard
 * @param {Object} metrics The metrics object
 * @param {Map} taskMap The map of tasks
 */
function generateHtmlDashboard(metrics, taskMap) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AeroSuite Task Traceability Dashboard</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f7fa;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2c3e50;
      color: white;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .header p {
      margin: 5px 0 0;
      opacity: 0.8;
    }
    .metrics-overview {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      grid-gap: 20px;
      margin-bottom: 20px;
    }
    .metric-card {
      background-color: white;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .metric-card h2 {
      margin: 0 0 10px;
      font-size: 18px;
      color: #2c3e50;
    }
    .metric-value {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 5px;
      color: #3498db;
    }
    .metric-description {
      font-size: 12px;
      color: #7f8c8d;
    }
    .progress-container {
      margin-top: 10px;
    }
    .progress-bar {
      height: 8px;
      background-color: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-value {
      height: 100%;
      background-color: #3498db;
      border-radius: 4px;
    }
    .charts-container {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-gap: 20px;
      margin-bottom: 20px;
    }
    .chart-card {
      background-color: white;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .chart-card h2 {
      margin: 0 0 15px;
      font-size: 18px;
      color: #2c3e50;
    }
    .coverage-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .coverage-table th,
    .coverage-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .coverage-table th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: #2c3e50;
    }
    .coverage-table tbody tr:hover {
      background-color: #f5f7fa;
    }
    .coverage-bar {
      height: 8px;
      width: 100%;
      background-color: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }
    .coverage-value {
      height: 100%;
      border-radius: 4px;
    }
    .recent-activity {
      background-color: white;
      border-radius: 5px;
      padding: 15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
    .recent-activity h2 {
      margin: 0 0 15px;
      font-size: 18px;
      color: #2c3e50;
    }
    .activity-item {
      padding: 12px 0;
      border-bottom: 1px solid #ecf0f1;
    }
    .activity-item:last-child {
      border-bottom: none;
    }
    .activity-message {
      font-weight: 500;
      margin-bottom: 5px;
    }
    .activity-details {
      font-size: 12px;
      color: #7f8c8d;
    }
    .task-badge {
      display: inline-block;
      background-color: #3498db;
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
      margin-right: 5px;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
    }
    .status-completed {
      background-color: #2ecc71;
      color: white;
    }
    .status-in-progress {
      background-color: #f39c12;
      color: white;
    }
    .status-todo {
      background-color: #95a5a6;
      color: white;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      font-size: 12px;
      color: #7f8c8d;
    }
    @media (max-width: 768px) {
      .charts-container {
        grid-template-columns: 1fr;
      }
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AeroSuite Task Traceability Dashboard</h1>
      <p>Last updated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="metrics-overview">
      <div class="metric-card">
        <h2>Task Completion</h2>
        <div class="metric-value">${metrics.taskCompletionRate}%</div>
        <div class="metric-description">${metrics.tasksByStatus.completed} of ${metrics.totalTasks} tasks completed</div>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-value" style="width: ${metrics.taskCompletionRate}%"></div>
          </div>
        </div>
      </div>
      
      <div class="metric-card">
        <h2>Code Coverage</h2>
        <div class="metric-value">${metrics.coveragePercentage}%</div>
        <div class="metric-description">${metrics.filesWithReferences} of ${metrics.totalFiles} files have task references</div>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-value" style="width: ${metrics.coveragePercentage}%"></div>
          </div>
        </div>
      </div>
      
      <div class="metric-card">
        <h2>Tasks by Status</h2>
        <div class="metric-value">${metrics.totalTasks}</div>
        <div class="metric-description">
          <span class="status-badge status-completed">${metrics.tasksByStatus.completed} Completed</span>
          <span class="status-badge status-in-progress">${metrics.tasksByStatus.inProgress} In Progress</span>
          <span class="status-badge status-todo">${metrics.tasksByStatus.todo} Todo</span>
        </div>
      </div>
      
      <div class="metric-card">
        <h2>Traceability</h2>
        <div class="metric-value">${metrics.averageFilesPerTask}</div>
        <div class="metric-description">Average files per task</div>
      </div>
    </div>
    
    <div class="charts-container">
      <div class="chart-card">
        <h2>Tasks by Category</h2>
        <canvas id="categoryChart"></canvas>
      </div>
      
      <div class="chart-card">
        <h2>Tasks by Priority</h2>
        <canvas id="priorityChart"></canvas>
      </div>
    </div>
    
    <div class="chart-card">
      <h2>Top Tasks by File Count</h2>
      <canvas id="topTasksChart"></canvas>
    </div>
    
    <div class="chart-card">
      <h2>Task Coverage Analysis</h2>
      <table class="coverage-table">
        <thead>
          <tr>
            <th>Task ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Files</th>
            <th>Coverage</th>
          </tr>
        </thead>
        <tbody>
          ${Object.values(metrics.taskCoverage)
            .sort((a, b) => b.coverage - a.coverage)
            .slice(0, 10)
            .map(task => {
              let statusClass = '';
              if (task.status.includes('✅')) statusClass = 'status-completed';
              else if (task.status.includes('🔄')) statusClass = 'status-in-progress';
              else statusClass = 'status-todo';
              
              let coverageColor = '#e74c3c'; // Red for low coverage
              if (task.coverage >= 80) coverageColor = '#2ecc71'; // Green for high coverage
              else if (task.coverage >= 50) coverageColor = '#f39c12'; // Orange for medium coverage
              
              return `
                <tr>
                  <td><span class="task-badge">${task.id}</span></td>
                  <td>${task.title}</td>
                  <td><span class="status-badge ${statusClass}">${task.status}</span></td>
                  <td>${task.actualFileCount} / ${task.expectedFileCount}</td>
                  <td>
                    <div class="coverage-bar">
                      <div class="coverage-value" style="width: ${task.coverage}%; background-color: ${coverageColor}"></div>
                    </div>
                    ${task.coverage}%
                  </td>
                </tr>
              `;
            }).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="recent-activity">
      <h2>Recent Activity</h2>
      ${metrics.recentActivity.slice(0, 5).map(activity => {
        const date = new Date(activity.date);
        return `
          <div class="activity-item">
            <div class="activity-message">
              ${activity.taskId ? `<span class="task-badge">${activity.taskId}</span>` : ''}
              ${activity.message}
            </div>
            <div class="activity-details">
              ${activity.author} on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()} (${activity.hash})
            </div>
          </div>
        `;
      }).join('')}
    </div>
    
    <div class="footer">
      <p>Generated by AeroSuite Task Metrics Dashboard Generator</p>
    </div>
  </div>
  
  <script>
    // Tasks by Category Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    const categoryChart = new Chart(categoryCtx, {
      type: 'pie',
      data: {
        labels: ${JSON.stringify(Object.keys(metrics.tasksByCategory))},
        datasets: [{
          data: ${JSON.stringify(Object.values(metrics.tasksByCategory))},
          backgroundColor: [
            '#3498db',
            '#2ecc71',
            '#e74c3c',
            '#f39c12',
            '#9b59b6',
            '#1abc9c'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
    
    // Tasks by Priority Chart
    const priorityCtx = document.getElementById('priorityChart').getContext('2d');
    const priorityChart = new Chart(priorityCtx, {
      type: 'doughnut',
      data: {
        labels: ['High', 'Medium', 'Low'],
        datasets: [{
          data: [
            ${metrics.tasksByPriority.high},
            ${metrics.tasksByPriority.medium},
            ${metrics.tasksByPriority.low}
          ],
          backgroundColor: [
            '#e74c3c',
            '#f39c12',
            '#3498db'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
    
    // Top Tasks by File Count Chart
    const topTasksCtx = document.getElementById('topTasksChart').getContext('2d');
    const topTasksChart = new Chart(topTasksCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(metrics.topTasksByFileCount.map(t => t.id))},
        datasets: [{
          label: 'Number of Files',
          data: ${JSON.stringify(metrics.topTasksByFileCount.map(t => t.fileCount))},
          backgroundColor: '#3498db'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(tooltipItems) {
                const index = tooltipItems[0].dataIndex;
                return ${JSON.stringify(metrics.topTasksByFileCount)}.map(t => t.id)[index];
              },
              label: function(context) {
                const index = context.dataIndex;
                const title = ${JSON.stringify(metrics.topTasksByFileCount)}.map(t => t.title)[index];
                return title + ': ' + context.raw + ' files';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Files'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Task ID'
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync(HTML_DASHBOARD, html);
  console.log(`HTML dashboard generated at ${HTML_DASHBOARD}`);
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Task Metrics Dashboard Generator');
  console.log('=================================');
  
  try {
    // Parse tasks
    const taskMap = parseTasks();
    console.log(`Found ${taskMap.size} tasks in task.md`);
    
    // Find task references
    findTaskReferences(taskMap);
    
    console.log('✅ Task metrics dashboard generated successfully');
  } catch (error) {
    console.error(`Error generating task metrics dashboard: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 