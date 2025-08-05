#!/usr/bin/env node

/**
 * Task-to-JIRA Synchronization Tool
 * 
 * This script synchronizes task data between the local task.md file and JIRA.
 * It allows two-way synchronization:
 * 1. Export tasks to JIRA (create/update JIRA issues based on task.md)
 * 2. Import tasks from JIRA (update task.md based on JIRA issues)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const https = require('https');
const querystring = require('querystring');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const CONFIG_FILE_PATH = path.join(process.cwd(), '.jira-sync-config.json');

// Default configuration
const DEFAULT_CONFIG = {
  jiraUrl: 'https://your-jira-instance.atlassian.net',
  jiraApiPath: '/rest/api/3',
  jiraProject: 'AERO',
  jiraUsername: 'your-jira-email@example.com',
  jiraApiToken: '',
  taskToIssueTypeMap: {
    'TS': 'Task',
    'SEC': 'Security',
    'AI': 'Task',
    'PERF': 'Task',
    'DEV': 'Task'
  },
  statusMap: {
    '✅ Completed': 'Done',
    '🔄 In Progress': 'In Progress',
    '🔍 In Review': 'Review',
    '⬜ Todo': 'To Do'
  },
  priorityMap: {
    '🔴 High': 'High',
    '🟠 Medium': 'Medium',
    '🔵 Low': 'Low'
  },
  fieldMappings: {
    taskId: 'customfield_10001',
    dependencies: 'customfield_10002'
  },
  lastSync: null
};

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
      
      taskMap.set(taskId, {
        id: taskId,
        title,
        status,
        priority,
        dependencies: dependencies !== '-' ? dependencies.split(',').map(d => d.trim()) : [],
        loc
      });
    }
    
    return taskMap;
  } catch (error) {
    console.error(`Error parsing task file: ${error.message}`);
    return new Map();
  }
}

/**
 * Load configuration
 * @returns {Object} Configuration object
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));
      return { ...DEFAULT_CONFIG, ...config };
    } else {
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error(`Error loading configuration: ${error.message}`);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save configuration
 * @param {Object} config Configuration object
 */
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
    console.log(`Configuration saved to ${CONFIG_FILE_PATH}`);
  } catch (error) {
    console.error(`Error saving configuration: ${error.message}`);
  }
}

/**
 * Setup JIRA configuration
 * @param {Object} config Current configuration
 * @returns {Promise<Object>} Updated configuration
 */
async function setupJiraConfig(config) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const ask = (question, defaultValue) => {
    return new Promise(resolve => {
      rl.question(`${question} [${defaultValue}]: `, answer => {
        resolve(answer.trim() || defaultValue);
      });
    });
  };
  
  console.log('\nJIRA Configuration Setup:');
  console.log('-------------------------');
  
  config.jiraUrl = await ask('JIRA URL', config.jiraUrl);
  config.jiraProject = await ask('JIRA Project Key', config.jiraProject);
  config.jiraUsername = await ask('JIRA Username/Email', config.jiraUsername);
  
  const apiToken = await ask('JIRA API Token (leave empty to keep existing)', '');
  if (apiToken) {
    config.jiraApiToken = apiToken;
  }
  
  console.log('\nConfiguration complete!');
  
  rl.close();
  return config;
}

/**
 * Make a JIRA API request
 * @param {Object} config Configuration object
 * @param {string} method HTTP method
 * @param {string} endpoint API endpoint
 * @param {Object} data Request data
 * @returns {Promise<Object>} Response data
 */
function jiraApiRequest(config, method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${config.jiraUsername}:${config.jiraApiToken}`).toString('base64');
    
    const options = {
      hostname: config.jiraUrl.replace(/^https?:\/\//, ''),
      port: 443,
      path: `${config.jiraApiPath}${endpoint}`,
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, res => {
      let responseData = '';
      
      res.on('data', chunk => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = responseData ? JSON.parse(responseData) : {};
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${error.message}`));
          }
        } else {
          reject(new Error(`JIRA API error (${res.statusCode}): ${responseData}`));
        }
      });
    });
    
    req.on('error', error => {
      reject(new Error(`JIRA API request failed: ${error.message}`));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Test JIRA connection
 * @param {Object} config Configuration object
 * @returns {Promise<boolean>} Connection success
 */
async function testJiraConnection(config) {
  try {
    console.log('Testing JIRA connection...');
    
    // Check if API token is set
    if (!config.jiraApiToken) {
      console.error('Error: JIRA API token not set. Please set it up first.');
      return false;
    }
    
    // Get current user to test authentication
    const userData = await jiraApiRequest(config, 'GET', '/myself');
    console.log(`✅ Connection successful! Connected as: ${userData.displayName}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Convert task to JIRA issue data
 * @param {Object} task Task object
 * @param {Object} config Configuration object
 * @returns {Object} JIRA issue data
 */
function taskToJiraIssue(task, config) {
  const taskType = task.id.substring(0, 2);
  const issueType = config.taskToIssueTypeMap[taskType] || 'Task';
  
  const status = config.statusMap[task.status] || 'To Do';
  const priority = config.priorityMap[task.priority] || 'Medium';
  
  // Create issue data
  const issueData = {
    fields: {
      project: {
        key: config.jiraProject
      },
      summary: `${task.id}: ${task.title}`,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                text: `Task ID: ${task.id}`,
                type: 'text'
              }
            ]
          },
          {
            type: 'paragraph',
            content: [
              {
                text: `Dependencies: ${task.dependencies.join(', ') || 'None'}`,
                type: 'text'
              }
            ]
          },
          {
            type: 'paragraph',
            content: [
              {
                text: `LOC: ${task.loc}`,
                type: 'text'
              }
            ]
          }
        ]
      },
      issuetype: {
        name: issueType
      },
      priority: {
        name: priority
      }
    }
  };
  
  // Add custom fields if configured
  if (config.fieldMappings.taskId) {
    issueData.fields[config.fieldMappings.taskId] = task.id;
  }
  
  if (config.fieldMappings.dependencies && task.dependencies.length > 0) {
    issueData.fields[config.fieldMappings.dependencies] = task.dependencies.join(',');
  }
  
  return issueData;
}

/**
 * Export tasks to JIRA
 * @param {Map} taskMap Map of tasks
 * @param {Object} config Configuration object
 */
async function exportTasksToJira(taskMap, config) {
  try {
    console.log('Exporting tasks to JIRA...');
    
    // Test connection first
    const connectionSuccess = await testJiraConnection(config);
    if (!connectionSuccess) {
      return;
    }
    
    // Get existing issues from JIRA
    const jql = `project = ${config.jiraProject} ORDER BY created DESC`;
    const searchData = await jiraApiRequest(config, 'POST', '/search', {
      jql,
      maxResults: 1000,
      fields: ['summary', 'status', 'priority', config.fieldMappings.taskId]
    });
    
    // Create a map of task IDs to JIRA issues
    const jiraIssueMap = new Map();
    if (searchData.issues) {
      for (const issue of searchData.issues) {
        const taskId = issue.fields[config.fieldMappings.taskId];
        if (taskId) {
          jiraIssueMap.set(taskId, issue);
        }
      }
    }
    
    // Process each task
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const [taskId, task] of taskMap.entries()) {
      const existingIssue = jiraIssueMap.get(taskId);
      
      if (existingIssue) {
        // Update existing issue
        try {
          const issueData = taskToJiraIssue(task, config);
          await jiraApiRequest(config, 'PUT', `/issue/${existingIssue.id}`, {
            fields: issueData.fields
          });
          
          console.log(`Updated JIRA issue for task ${taskId}`);
          updated++;
        } catch (error) {
          console.error(`Error updating JIRA issue for task ${taskId}: ${error.message}`);
          skipped++;
        }
      } else {
        // Create new issue
        try {
          const issueData = taskToJiraIssue(task, config);
          const newIssue = await jiraApiRequest(config, 'POST', '/issue', issueData);
          
          console.log(`Created JIRA issue ${newIssue.key} for task ${taskId}`);
          created++;
        } catch (error) {
          console.error(`Error creating JIRA issue for task ${taskId}: ${error.message}`);
          skipped++;
        }
      }
    }
    
    console.log(`\nExport complete!`);
    console.log(`Created: ${created} issues`);
    console.log(`Updated: ${updated} issues`);
    console.log(`Skipped: ${skipped} issues`);
    
    // Update last sync time
    config.lastSync = new Date().toISOString();
    saveConfig(config);
  } catch (error) {
    console.error(`Error exporting tasks to JIRA: ${error.message}`);
  }
}

/**
 * Import tasks from JIRA
 * @param {Object} config Configuration object
 */
async function importTasksFromJira(config) {
  try {
    console.log('Importing tasks from JIRA...');
    
    // Test connection first
    const connectionSuccess = await testJiraConnection(config);
    if (!connectionSuccess) {
      return;
    }
    
    // Get existing tasks from task.md
    const taskMap = parseTasks();
    
    // Get issues from JIRA
    let jql = `project = ${config.jiraProject}`;
    if (config.fieldMappings.taskId) {
      jql += ` AND ${config.fieldMappings.taskId} IS NOT EMPTY`;
    }
    
    const searchData = await jiraApiRequest(config, 'POST', '/search', {
      jql,
      maxResults: 1000,
      fields: ['summary', 'status', 'priority', 'description', config.fieldMappings.taskId, config.fieldMappings.dependencies]
    });
    
    if (!searchData.issues || searchData.issues.length === 0) {
      console.log('No issues found in JIRA.');
      return;
    }
    
    console.log(`Found ${searchData.issues.length} issues in JIRA.`);
    
    // Process each issue
    let updated = 0;
    let added = 0;
    let skipped = 0;
    
    for (const issue of searchData.issues) {
      const taskId = issue.fields[config.fieldMappings.taskId];
      
      if (!taskId || !taskId.match(/^(TS|SEC|AI|PERF|DEV)\d{3}$/)) {
        console.log(`Skipping issue ${issue.key}: Invalid or missing task ID`);
        skipped++;
        continue;
      }
      
      // Get JIRA status and priority
      const status = issue.fields.status.name;
      const priority = issue.fields.priority ? issue.fields.priority.name : 'Medium';
      
      // Map back to task status and priority
      let taskStatus = '⬜ Todo';
      for (const [key, value] of Object.entries(config.statusMap)) {
        if (value === status) {
          taskStatus = key;
          break;
        }
      }
      
      let taskPriority = '🟠 Medium';
      for (const [key, value] of Object.entries(config.priorityMap)) {
        if (value === priority) {
          taskPriority = key;
          break;
        }
      }
      
      // Get dependencies
      let dependencies = [];
      if (config.fieldMappings.dependencies && issue.fields[config.fieldMappings.dependencies]) {
        dependencies = issue.fields[config.fieldMappings.dependencies].split(',').map(d => d.trim());
      }
      
      // Extract title from summary (removing task ID prefix if present)
      let title = issue.fields.summary;
      const titleMatch = title.match(/^(TS|SEC|AI|PERF|DEV)\d{3}:\s*(.+)$/);
      if (titleMatch) {
        title = titleMatch[2].trim();
      }
      
      // Update or add task
      if (taskMap.has(taskId)) {
        const task = taskMap.get(taskId);
        
        // Only update if there are changes
        if (task.title !== title || task.status !== taskStatus || task.priority !== taskPriority) {
          task.title = title;
          task.status = taskStatus;
          task.priority = taskPriority;
          task.dependencies = dependencies;
          
          console.log(`Updated task ${taskId} from JIRA`);
          updated++;
        } else {
          console.log(`Skipped task ${taskId} (no changes)`);
          skipped++;
        }
      } else {
        // Add new task
        taskMap.set(taskId, {
          id: taskId,
          title,
          status: taskStatus,
          priority: taskPriority,
          dependencies,
          loc: 0 // Default LOC for new tasks
        });
        
        console.log(`Added new task ${taskId} from JIRA`);
        added++;
      }
    }
    
    // Update task.md file
    updateTaskFile(taskMap);
    
    console.log(`\nImport complete!`);
    console.log(`Added: ${added} tasks`);
    console.log(`Updated: ${updated} tasks`);
    console.log(`Skipped: ${skipped} tasks`);
    
    // Update last sync time
    config.lastSync = new Date().toISOString();
    saveConfig(config);
  } catch (error) {
    console.error(`Error importing tasks from JIRA: ${error.message}`);
  }
}

/**
 * Update the task.md file with new task data
 * @param {Map} taskMap Map of tasks
 */
function updateTaskFile(taskMap) {
  try {
    // Read the existing file
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf-8');
    
    // Split into lines
    const lines = content.split('\n');
    
    // Find all task table rows and update them
    const taskPattern = /^\|\s*(TS\d{3}|SEC\d{3}|AI\d{3}|PERF\d{3}|DEV\d{3})\s*\|/;
    let updated = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(taskPattern);
      
      if (match) {
        const taskId = match[1].trim();
        
        if (taskMap.has(taskId)) {
          const task = taskMap.get(taskId);
          
          // Format dependencies
          const deps = task.dependencies.length > 0 ? task.dependencies.join(', ') : '-';
          
          // Update the line
          lines[i] = `| ${task.id} | ${task.title} | ${task.status} | ${task.priority} | ${deps} | ${task.loc} |`;
          updated++;
          
          // Remove from map to track which tasks are left to add
          taskMap.delete(taskId);
        }
      }
    }
    
    // If there are new tasks to add, find the appropriate table and add them
    if (taskMap.size > 0) {
      // Find the end of the first task table
      const tableEndIndex = lines.findIndex((line, index) => {
        return line.startsWith('|---') && 
               lines[index + 1] && !lines[index + 1].startsWith('|');
      });
      
      if (tableEndIndex > 0) {
        // Add new tasks after the table
        const newTaskLines = [];
        
        for (const [taskId, task] of taskMap.entries()) {
          // Format dependencies
          const deps = task.dependencies.length > 0 ? task.dependencies.join(', ') : '-';
          
          // Create the line
          newTaskLines.push(`| ${task.id} | ${task.title} | ${task.status} | ${task.priority} | ${deps} | ${task.loc} |`);
        }
        
        // Insert new tasks
        lines.splice(tableEndIndex + 1, 0, ...newTaskLines);
      }
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(TASK_FILE_PATH, lines.join('\n'));
    
    console.log(`Updated ${updated} tasks in ${TASK_FILE_PATH}`);
    console.log(`Added ${taskMap.size} new tasks to ${TASK_FILE_PATH}`);
  } catch (error) {
    console.error(`Error updating task file: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 AeroSuite Task-to-JIRA Synchronization Tool');
  console.log('============================================');
  
  // Load configuration
  let config = loadConfig();
  
  // Process command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--setup')) {
    // Setup JIRA configuration
    config = await setupJiraConfig(config);
    saveConfig(config);
    return;
  }
  
  if (args.includes('--test-connection')) {
    // Test JIRA connection
    await testJiraConnection(config);
    return;
  }
  
  if (args.includes('--export')) {
    // Export tasks to JIRA
    const taskMap = parseTasks();
    await exportTasksToJira(taskMap, config);
    return;
  }
  
  if (args.includes('--import')) {
    // Import tasks from JIRA
    await importTasksFromJira(config);
    return;
  }
  
  // If no arguments provided, show usage
  console.log('\nUsage:');
  console.log('  node task-jira-sync.js --setup             Setup JIRA configuration');
  console.log('  node task-jira-sync.js --test-connection   Test JIRA connection');
  console.log('  node task-jira-sync.js --export            Export tasks to JIRA');
  console.log('  node task-jira-sync.js --import            Import tasks from JIRA');
}

// Run the main function
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
}); 