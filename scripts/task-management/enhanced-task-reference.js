#!/usr/bin/env node

/**
 * Enhanced Task Reference Manager
 * 
 * This script provides advanced functionality for maintaining task references:
 * 1. Automatic detection of files related to specific tasks
 * 2. Adding standardized task references to files
 * 3. Generating visualization of task-to-code relationships
 * 4. Integration with git hooks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const TASK_VISUALIZATION_DIR = path.join(process.cwd(), 'reports', 'task-management');
const SUPPORTED_EXTENSIONS = {
  '.js': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.jsx': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.ts': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.tsx': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.py': { lineComment: '#', blockStart: '"""', blockEnd: '"""' },
  '.java': { lineComment: '//', blockStart: '/**', blockEnd: ' */' },
  '.md': { lineComment: '<!--', blockEnd: '-->' },
  '.html': { blockStart: '<!--', blockEnd: '-->' },
  '.css': { blockStart: '/*', blockEnd: '*/' },
  '.scss': { blockStart: '/*', blockEnd: '*/' }
};

// Task ID patterns for validation
const TASK_ID_PATTERN = /^(TS|SEC|AI|PERF|DEV)\d{3}$/;

// Create reports directory if it doesn't exist
if (!fs.existsSync(TASK_VISUALIZATION_DIR)) {
  fs.mkdirSync(TASK_VISUALIZATION_DIR, { recursive: true });
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
      const loc = parseInt(match[6].trim(), 10);
      
      taskMap.set(taskId, {
        id: taskId,
        title,
        status,
        priority,
        dependencies: dependencies !== '-' ? dependencies.split(',').map(d => d.trim()) : [],
        loc,
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
 * Find files related to a specific task based on keywords
 * @param {string} taskId The task ID
 * @param {object} taskInfo The task information
 * @returns {Array} Array of file paths
 */
function findRelatedFiles(taskId, taskInfo) {
  try {
    // Generate keywords from task title
    const titleWords = taskInfo.title.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 3); // Only words longer than 3 chars
    
    // Add the task ID to the keywords
    const keywords = [taskId.toLowerCase(), ...titleWords];
    
    // Find files containing the keywords
    const excludeDirs = ['node_modules', 'dist', 'build', '.git'];
    const excludePattern = excludeDirs.map(dir => `--exclude-dir=${dir}`).join(' ');
    
    const fileSet = new Set();
    
    // Search for each keyword
    for (const keyword of keywords) {
      try {
        // Use grep to find files containing the keyword
        const grepCmd = `grep -r ${excludePattern} -l "${keyword}" --include="*.{js,jsx,ts,tsx,py,java,md,html,css,scss}" .`;
        const result = execSync(grepCmd, { encoding: 'utf-8' }).trim();
        
        if (result) {
          result.split('\n').forEach(file => fileSet.add(file));
        }
      } catch (err) {
        // grep returns non-zero exit code if no matches found, which is not an error for us
        if (err.status !== 1) {
          console.error(`Error searching for keyword ${keyword}: ${err.message}`);
        }
      }
    }
    
    // Filter out irrelevant files and return as array
    return Array.from(fileSet)
      .filter(file => !file.includes('node_modules'))
      .filter(file => !file.includes('package-lock.json'))
      .filter(file => path.basename(file) !== 'task.md');
  } catch (error) {
    console.error(`Error finding related files: ${error.message}`);
    return [];
  }
}

/**
 * Check if a file already contains a task reference
 * @param {string} filePath The file path
 * @param {string} taskId The task ID
 * @returns {boolean} True if reference exists
 */
function hasTaskReference(filePath, taskId) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const pattern = new RegExp(`@task\\s+${taskId}\\b`, 'i');
    return pattern.test(content);
  } catch (error) {
    console.error(`Error checking task reference in ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Add task reference to a file
 * @param {string} filePath The file path
 * @param {string} taskId The task ID
 * @param {string} taskTitle The task title
 * @returns {boolean} True if successful
 */
function addTaskReference(filePath, taskId, taskTitle) {
  try {
    if (hasTaskReference(filePath, taskId)) {
      console.log(`Task reference already exists in ${filePath}`);
      return true;
    }
    
    const fileExt = path.extname(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    if (!SUPPORTED_EXTENSIONS[fileExt]) {
      console.log(`Unsupported file extension for ${filePath}`);
      return false;
    }
    
    const { blockStart, blockEnd } = SUPPORTED_EXTENSIONS[fileExt];
    const taskReference = `${blockStart}\n * @task ${taskId} - ${taskTitle}\n${blockEnd}\n`;
    
    // Add reference to the beginning of the file
    fs.writeFileSync(filePath, taskReference + fileContent);
    console.log(`Added task reference to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error adding task reference to ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Generate visualization of task-to-code relationships
 * @param {Map} taskMap The map of tasks
 */
function generateVisualization(taskMap) {
  try {
    // Generate a markdown report
    let markdown = '# Task-to-Code Relationship Report\n\n';
    markdown += 'This report shows the relationship between tasks and code files.\n\n';
    
    // Add a table with task information and file counts
    markdown += '| Task ID | Title | Status | # of Files | Files |\n';
    markdown += '|---------|-------|--------|------------|-------|\n';
    
    taskMap.forEach(task => {
      const fileCount = task.files.length;
      markdown += `| ${task.id} | ${task.title} | ${task.status} | ${fileCount} | [View List](#${task.id.toLowerCase()}) |\n`;
    });
    
    markdown += '\n\n';
    
    // Add detailed sections for each task
    taskMap.forEach(task => {
      markdown += `## <a id="${task.id.toLowerCase()}"></a>${task.id}: ${task.title}\n\n`;
      markdown += `**Status:** ${task.status}  \n`;
      markdown += `**Priority:** ${task.priority}  \n`;
      markdown += `**Dependencies:** ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}  \n\n`;
      
      markdown += '### Associated Files\n\n';
      
      if (task.files.length === 0) {
        markdown += '_No files associated with this task yet._\n\n';
      } else {
        markdown += '| File Path | Type |\n';
        markdown += '|-----------|------|\n';
        
        task.files.forEach(file => {
          const fileExt = path.extname(file);
          let fileType = 'Unknown';
          
          // Determine file type based on extension or path
          if (file.includes('/components/')) fileType = 'Component';
          else if (file.includes('/services/')) fileType = 'Service';
          else if (file.includes('/utils/')) fileType = 'Utility';
          else if (file.includes('/models/')) fileType = 'Model';
          else if (file.includes('/routes/')) fileType = 'Route';
          else if (file.includes('/controllers/')) fileType = 'Controller';
          else if (file.includes('/middleware/')) fileType = 'Middleware';
          else if (fileExt === '.js' || fileExt === '.ts') fileType = 'Script';
          
          markdown += `| ${file} | ${fileType} |\n`;
        });
      }
      
      markdown += '\n';
    });
    
    // Save the markdown report
    const reportPath = path.join(TASK_VISUALIZATION_DIR, 'task-code-mapping.md');
    fs.writeFileSync(reportPath, markdown);
    console.log(`Task-to-code visualization report generated at ${reportPath}`);
    
    // Generate a DOT file for GraphViz visualization
    let dotContent = 'digraph TaskCodeRelationship {\n';
    dotContent += '  rankdir=LR;\n';
    dotContent += '  node [shape=box, style=filled, fontname="Arial"];\n\n';
    
    // Add nodes for tasks
    taskMap.forEach(task => {
      let color = '';
      if (task.status.includes('✅')) color = 'fillcolor="#C5E1A5"'; // Light green for completed
      else if (task.status.includes('🔄')) color = 'fillcolor="#FFECB3"'; // Light yellow for in progress
      else if (task.status.includes('⬜')) color = 'fillcolor="#EEEEEE"'; // Light gray for todo
      
      dotContent += `  "${task.id}" [label="${task.id}\\n${task.title.slice(0, 30)}${task.title.length > 30 ? '...' : ''}", ${color}];\n`;
    });
    
    dotContent += '\n';
    
    // Add edges for dependencies
    taskMap.forEach(task => {
      task.dependencies.forEach(dep => {
        if (dep && taskMap.has(dep.trim())) {
          dotContent += `  "${dep.trim()}" -> "${task.id}" [style=dashed];\n`;
        }
      });
    });
    
    // Add edges for files (group files by directory to reduce clutter)
    const fileGroups = new Map();
    
    taskMap.forEach(task => {
      task.files.forEach(file => {
        const dir = path.dirname(file).split(path.sep)[0];
        if (!fileGroups.has(dir)) {
          fileGroups.set(dir, { tasks: new Set(), count: 0 });
        }
        fileGroups.get(dir).tasks.add(task.id);
        fileGroups.get(dir).count++;
      });
    });
    
    // Add file group nodes
    fileGroups.forEach((group, dir) => {
      dotContent += `  "${dir}" [label="${dir}\\n(${group.count} files)", shape=folder, fillcolor="#E3F2FD"];\n`;
      
      // Connect tasks to file groups
      group.tasks.forEach(taskId => {
        dotContent += `  "${taskId}" -> "${dir}" [color="#2196F3"];\n`;
      });
    });
    
    dotContent += '}\n';
    
    // Save the DOT file
    const dotPath = path.join(TASK_VISUALIZATION_DIR, 'task-dependencies.dot');
    fs.writeFileSync(dotPath, dotContent);
    console.log(`Task dependency visualization DOT file generated at ${dotPath}`);
    
    // Try to generate PNG if GraphViz is installed
    try {
      const pngPath = path.join(TASK_VISUALIZATION_DIR, 'task-dependencies.png');
      execSync(`dot -Tpng -o "${pngPath}" "${dotPath}"`);
      console.log(`Task dependency visualization PNG generated at ${pngPath}`);
    } catch (error) {
      console.log('GraphViz not found. Install it to generate PNG visualizations.');
    }
    
  } catch (error) {
    console.error(`Error generating visualization: ${error.message}`);
  }
}

/**
 * Main function to execute the script
 */
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  try {
    console.log('🔍 Enhanced Task Reference Manager');
    console.log('=================================');
    
    // Parse tasks
    const taskMap = parseTasks();
    console.log(`Found ${taskMap.size} tasks in task.md\n`);
    
    // Process command line arguments
    const args = process.argv.slice(2);
    const autoMode = args.includes('--auto');
    const taskId = args.find(arg => TASK_ID_PATTERN.test(arg));
    const visualizeOnly = args.includes('--visualize-only');
    
    if (visualizeOnly) {
      console.log('Generating visualization only...');
      
      // Find all files with task references
      console.log('Scanning codebase for existing task references...');
      
      taskMap.forEach((task, id) => {
        // Find files with existing references
        try {
          const grepCmd = `grep -r "@task ${id}\\b" --include="*.{js,jsx,ts,tsx,py,java,md,html,css,scss}" .`;
          const result = execSync(grepCmd, { encoding: 'utf-8' }).trim();
          
          if (result) {
            const files = result.split('\n')
              .map(line => line.split(':')[0])
              .filter(file => !file.includes('node_modules'));
            
            task.files = files;
          }
        } catch (err) {
          // grep returns non-zero exit code if no matches found, which is not an error for us
          if (err.status !== 1) {
            console.error(`Error scanning for task ${id}: ${err.message}`);
          }
        }
      });
      
      generateVisualization(taskMap);
      rl.close();
      return;
    }
    
    // If no specific task ID is provided, prompt the user
    if (!taskId && !autoMode) {
      console.log('Available tasks:');
      const taskArray = Array.from(taskMap.values());
      
      // Group tasks by status
      const completedTasks = taskArray.filter(task => task.status.includes('✅'));
      const inProgressTasks = taskArray.filter(task => task.status.includes('🔄'));
      const todoTasks = taskArray.filter(task => task.status.includes('⬜'));
      
      console.log('\nIn Progress:');
      inProgressTasks.forEach(task => {
        console.log(`  ${task.id} - ${task.title}`);
      });
      
      console.log('\nTodo:');
      todoTasks.forEach(task => {
        console.log(`  ${task.id} - ${task.title}`);
      });
      
      console.log('\nCompleted:');
      completedTasks.slice(0, 5).forEach(task => {
        console.log(`  ${task.id} - ${task.title}`);
      });
      
      if (completedTasks.length > 5) {
        console.log(`  ... and ${completedTasks.length - 5} more completed tasks`);
      }
      
      const askTaskId = () => {
        return new Promise(resolve => {
          rl.question('\nEnter task ID or keyword to search: ', answer => {
            if (TASK_ID_PATTERN.test(answer)) {
              resolve(answer.toUpperCase());
            } else if (answer.trim()) {
              // Search for tasks matching the keyword
              const keyword = answer.toLowerCase().trim();
              const matches = taskArray.filter(task => 
                task.id.toLowerCase().includes(keyword) || 
                task.title.toLowerCase().includes(keyword)
              );
              
              if (matches.length === 0) {
                console.log('No matching tasks found. Try again.');
                resolve(askTaskId());
              } else if (matches.length === 1) {
                console.log(`Found matching task: ${matches[0].id} - ${matches[0].title}`);
                resolve(matches[0].id);
              } else {
                console.log('Multiple matching tasks:');
                matches.forEach((task, index) => {
                  console.log(`  ${index + 1}. ${task.id} - ${task.title}`);
                });
                
                rl.question('Enter number to select task: ', indexStr => {
                  const index = parseInt(indexStr, 10) - 1;
                  if (isNaN(index) || index < 0 || index >= matches.length) {
                    console.log('Invalid selection. Try again.');
                    resolve(askTaskId());
                  } else {
                    resolve(matches[index].id);
                  }
                });
              }
            } else {
              console.log('Invalid input. Try again.');
              resolve(askTaskId());
            }
          });
        });
      };
      
      const selectedTaskId = await askTaskId();
      processTask(selectedTaskId, taskMap);
    } else if (autoMode) {
      // Process all tasks in automatic mode
      console.log('Running in automatic mode for all tasks...');
      
      for (const [id, task] of taskMap.entries()) {
        console.log(`\nProcessing task ${id}: ${task.title}`);
        const relatedFiles = findRelatedFiles(id, task);
        
        if (relatedFiles.length === 0) {
          console.log(`No files found related to task ${id}`);
          continue;
        }
        
        console.log(`Found ${relatedFiles.length} potentially related files`);
        
        let filesWithReferences = 0;
        for (const file of relatedFiles) {
          if (addTaskReference(file, id, task.title)) {
            filesWithReferences++;
            task.files.push(file);
          }
        }
        
        console.log(`Added task references to ${filesWithReferences} files for task ${id}`);
      }
      
      // Generate visualization
      generateVisualization(taskMap);
    } else {
      // Process a specific task
      processTask(taskId, taskMap);
    }
    
    rl.close();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    rl.close();
  }
}

/**
 * Process a specific task
 * @param {string} taskId The task ID
 * @param {Map} taskMap The map of tasks
 */
function processTask(taskId, taskMap) {
  if (!taskMap.has(taskId)) {
    console.error(`Task ${taskId} not found in task.md`);
    return;
  }
  
  const task = taskMap.get(taskId);
  console.log(`\nSelected task: ${task.id} - ${task.title}`);
  console.log(`Status: ${task.status}`);
  
  // Find related files
  console.log('\nSearching for files related to this task...');
  const relatedFiles = findRelatedFiles(taskId, task);
  
  if (relatedFiles.length === 0) {
    console.log('No files found related to this task.');
    return;
  }
  
  console.log(`\nFound ${relatedFiles.length} potentially related files:`);
  relatedFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nAdd task references to all files? (y/n): ', answer => {
    if (answer.toLowerCase() === 'y') {
      // Add task references to all files
      console.log('\nAdding task references...');
      
      let filesWithReferences = 0;
      for (const file of relatedFiles) {
        if (addTaskReference(file, task.id, task.title)) {
          filesWithReferences++;
          task.files.push(file);
        }
      }
      
      console.log(`\nAdded task references to ${filesWithReferences} files`);
      
      // Generate visualization
      generateVisualization(taskMap);
    } else {
      // Let the user select files
      console.log('\nEnter file numbers to add task references (comma-separated, e.g., "1,3,5"), or "all" for all files:');
      rl.question('> ', selection => {
        let selectedFiles = [];
        
        if (selection.toLowerCase() === 'all') {
          selectedFiles = relatedFiles;
        } else {
          const fileIndices = selection.split(',')
            .map(s => parseInt(s.trim(), 10) - 1)
            .filter(i => !isNaN(i) && i >= 0 && i < relatedFiles.length);
          
          selectedFiles = fileIndices.map(i => relatedFiles[i]);
        }
        
        if (selectedFiles.length === 0) {
          console.log('No valid files selected. Exiting.');
          rl.close();
          return;
        }
        
        console.log(`\nAdding task references to ${selectedFiles.length} files...`);
        
        let filesWithReferences = 0;
        for (const file of selectedFiles) {
          if (addTaskReference(file, task.id, task.title)) {
            filesWithReferences++;
            task.files.push(file);
          }
        }
        
        console.log(`\nAdded task references to ${filesWithReferences} files`);
        
        // Generate visualization
        generateVisualization(taskMap);
        rl.close();
      });
    }
  });
}

// Run the main function
main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
}); 