#!/usr/bin/env node

/**
 * Task Recommender for AeroSuite
 * 
 * This script:
 * 1. Takes user prompts about desired features or improvements
 * 2. Analyzes the existing codebase to understand context
 * 3. Generates task recommendations with details
 * 4. Adds the recommended tasks to task.md
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const BACKUP_PATH = path.join(process.cwd(), 'task.md.bak');

// Task ID counters (will be updated based on existing tasks)
const taskCounters = {
  TS: 500, // Start new TS tasks from TS500
  SEC: 50, // Start new SEC tasks from SEC050
  AI: 50,  // Start new AI tasks from AI050
  PERF: 50, // Start new PERF tasks from PERF050
  DEV: 50   // Start new DEV tasks from DEV050
};

// Default task statuses and priorities
const TASK_STATUS = '⬜ Todo';
const TASK_PRIORITIES = {
  HIGH: '🔴 High',
  MEDIUM: '🟠 Medium',
  LOW: '🔵 Low',
  NEXT: '⚫ Next Release'
};

// Task categories mapped to prefixes
const TASK_CATEGORIES = {
  'Core System': 'TS',
  'Security & Compliance': 'SEC',
  'AI/ML Integration': 'AI',
  'Performance & Scalability': 'PERF',
  'Developer Experience': 'DEV'
};

// Create readline interface for user prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Feature suggestion prompts by category
const FEATURE_PROMPTS = {
  'Core System': [
    'What core functionality would you like to add or improve?',
    'Are there any user interface improvements needed?',
    'What data management features would benefit the system?'
  ],
  'Security & Compliance': [
    'What security enhancements could improve the system?',
    'Are there compliance requirements that need addressing?',
    'What authentication or authorization improvements would help?'
  ],
  'AI/ML Integration': [
    'What AI capabilities could enhance the product?',
    'Are there any data analysis features that could benefit from ML?',
    'What automation could be added with AI/ML?'
  ],
  'Performance & Scalability': [
    'What performance bottlenecks need addressing?',
    'How could the system scale better?',
    'Are there caching or optimization opportunities?'
  ],
  'Developer Experience': [
    'What tooling would improve development efficiency?',
    'What documentation improvements are needed?',
    'Are there testing or CI/CD enhancements to consider?'
  ]
};

// Main function
async function suggestTasks() {
  try {
    console.log('🔍 Starting Task Recommender...');
    
    // Check for auto mode
    const args = process.argv.slice(2);
    const autoMode = args.includes('--auto');
    let inputFile = null;
    
    // Look for input file parameter
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--input=')) {
        inputFile = args[i].substring(8);
        break;
      }
    }
    
    // Backup task.md first
    backupTaskFile();
    
    // Parse the task file to get existing tasks and update counters
    const { taskContent, highestTaskIds } = parseTaskFile();
    updateTaskCounters(highestTaskIds);
    
    let category, description, recommendations;
    
    if (autoMode && inputFile) {
      // Automated mode with input file
      const inputData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
      category = inputData.category;
      description = inputData.description;
      
      // Generate recommendations
      recommendations = await generateTaskRecommendations(
        category, 
        description, 
        inputData.complexity,
        inputData.subtasks
      );
      
      console.log(`Auto-generating tasks for category: ${category}`);
    } else {
      // Interactive mode
      category = await promptTaskCategory();
      description = await promptTaskDescription(category);
      recommendations = await generateTaskRecommendations(category, description);
    }
    
    // Add tasks to task.md
    const updatedContent = addTasksToTaskFile(taskContent, recommendations);
    
    // Write updated task file
    fs.writeFileSync(TASK_FILE_PATH, updatedContent, 'utf8');
    
    // Show summary
    console.log('\n✅ Task recommendations added to task.md:');
    recommendations.forEach(task => {
      console.log(`- ${task.id}: ${task.title} (${task.priority})`);
    });
    
    console.log(`\nBackup saved to: ${BACKUP_PATH}`);
    
  } catch (error) {
    console.error('Error suggesting tasks:', error);
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
      return { 
        taskContent: basicContent,
        highestTaskIds: { TS: 0, SEC: 0, AI: 0, PERF: 0, DEV: 0 }
      };
    }
    
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    
    // Track highest task IDs for each prefix
    const highestTaskIds = { TS: 0, SEC: 0, AI: 0, PERF: 0, DEV: 0 };
    
    // Find all task IDs to get the highest numbers
    const taskIdRegex = /\| ((?:TS|SEC|AI|PERF|DEV)(\d{3})) \|/g;
    let match;
    
    while ((match = taskIdRegex.exec(content)) !== null) {
      const taskId = match[1];
      const prefix = taskId.match(/^[A-Z]+/)[0];
      const num = parseInt(taskId.match(/\d+/)[0]);
      
      if (highestTaskIds[prefix] < num) {
        highestTaskIds[prefix] = num;
      }
    }
    
    return { taskContent: content, highestTaskIds };
  } catch (error) {
    console.error('Error parsing task file:', error);
    return { 
      taskContent: '', 
      highestTaskIds: { TS: 0, SEC: 0, AI: 0, PERF: 0, DEV: 0 }
    };
  }
}

// Update task counters based on highest existing task IDs
function updateTaskCounters(highestTaskIds) {
  for (const prefix in highestTaskIds) {
    if (highestTaskIds[prefix] > 0) {
      taskCounters[prefix] = highestTaskIds[prefix] + 1;
    }
  }
  console.log('Updated task counters based on existing tasks:', taskCounters);
}

// Prompt user to select a task category
async function promptTaskCategory() {
  return new Promise((resolve) => {
    console.log('\nSelect a task category:');
    const categories = Object.keys(TASK_CATEGORIES);
    
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category}`);
    });
    
    rl.question('Enter category number: ', (answer) => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < categories.length) {
        resolve(categories[index]);
      } else {
        console.log('Invalid selection. Using "Core System" as default.');
        resolve('Core System');
      }
    });
  });
}

// Prompt user for task description
async function promptTaskDescription(category) {
  return new Promise((resolve) => {
    // Get random prompt for the selected category
    const prompts = FEATURE_PROMPTS[category];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    console.log(`\n${randomPrompt}`);
    rl.question('Enter your feature/improvement idea: ', (answer) => {
      if (answer.trim()) {
        resolve(answer.trim());
      } else {
        console.log('No description provided. Please enter a description.');
        promptTaskDescription(category).then(resolve);
      }
    });
  });
}

// Generate task recommendations based on category and description
async function generateTaskRecommendations(category, description, customComplexity = null, customSubtasks = null) {
  console.log('\n🧠 Analyzing codebase and generating task recommendations...');
  
  // Get the prefix for this category
  const prefix = TASK_CATEGORIES[category];
  
  // Simple algorithm to break down a feature into tasks
  const tasks = [];
  
  // Use provided complexity or analyze the feature description
  const complexity = customComplexity || analyzeComplexity(description);
  const numTasks = customSubtasks ? customSubtasks.length + 1 : determineNumberOfTasks(complexity);
  
  console.log(`Feature complexity: ${complexity} (${numTasks} tasks recommended)`);
  
  // Generate main task
  const mainTask = {
    id: generateTaskId(prefix),
    title: generateTitle(description),
    status: TASK_STATUS,
    priority: determinePriority(complexity, description),
    dependencies: '-',
    loc: '0'
  };
  
  tasks.push(mainTask);
  
  // Generate subtasks
  if (numTasks > 1) {
    let subtasks;
    
    if (customSubtasks) {
      // Use custom subtasks if provided
      subtasks = customSubtasks.map((subtaskTitle, index) => {
        return {
          id: generateTaskId(prefix),
          title: `${mainTask.title} - ${subtaskTitle}`,
          status: TASK_STATUS,
          priority: index === 0 ? mainTask.priority : downgradeTaskPriority(mainTask.priority),
          dependencies: mainTask.id,
          loc: '0'
        };
      });
    } else {
      // Generate standard subtasks
      subtasks = generateSubtasks(mainTask, description, numTasks - 1, prefix);
    }
    
    tasks.push(...subtasks);
  }
  
  return tasks;
}

// Analyze complexity of a feature description
function analyzeComplexity(description) {
  const length = description.length;
  const wordCount = description.split(' ').length;
  
  // Keywords that indicate complexity
  const complexityKeywords = [
    'complex', 'difficult', 'advanced', 'sophisticated', 'comprehensive',
    'intricate', 'elaborate', 'integrated', 'enterprise', 'system',
    'architecture', 'scale', 'distributed', 'microservices'
  ];
  
  // Keywords that indicate security concerns
  const securityKeywords = [
    'security', 'authentication', 'authorization', 'encryption', 'secure',
    'protect', 'vulnerability', 'hack', 'attack', 'breach', 'compliance',
    'audit', 'GDPR', 'PCI', 'HIPAA', 'SOC', 'ISO'
  ];
  
  // Count complexity indicators
  let complexityScore = 0;
  
  // Base score on length
  if (wordCount > 20) complexityScore += 1;
  if (wordCount > 40) complexityScore += 1;
  
  // Check for complexity keywords
  for (const keyword of complexityKeywords) {
    if (description.toLowerCase().includes(keyword)) {
      complexityScore += 1;
    }
  }
  
  // Security concerns add complexity
  for (const keyword of securityKeywords) {
    if (description.toLowerCase().includes(keyword)) {
      complexityScore += 2; // Security is weighted higher
    }
  }
  
  // Map score to complexity level
  if (complexityScore <= 1) return 'Low';
  if (complexityScore <= 3) return 'Medium';
  return 'High';
}

// Determine how many tasks to create based on complexity
function determineNumberOfTasks(complexity) {
  switch (complexity) {
    case 'Low': return 1;
    case 'Medium': return 3;
    case 'High': return 5;
    default: return 1;
  }
}

// Determine priority based on complexity and keywords
function determinePriority(complexity, description) {
  // Keywords that indicate high priority
  const highPriorityKeywords = [
    'critical', 'urgent', 'important', 'essential', 'necessary', 'required',
    'security', 'bug', 'fix', 'crash', 'performance', 'speed', 'optimize'
  ];
  
  // Check for high priority keywords
  for (const keyword of highPriorityKeywords) {
    if (description.toLowerCase().includes(keyword)) {
      return TASK_PRIORITIES.HIGH;
    }
  }
  
  // Base priority on complexity
  switch (complexity) {
    case 'Low': return TASK_PRIORITIES.LOW;
    case 'Medium': return TASK_PRIORITIES.MEDIUM;
    case 'High': return TASK_PRIORITIES.HIGH;
    default: return TASK_PRIORITIES.MEDIUM;
  }
}

// Generate a task ID with the given prefix
function generateTaskId(prefix) {
  const id = `${prefix}${taskCounters[prefix].toString().padStart(3, '0')}`;
  taskCounters[prefix]++; // Increment counter for next task
  return id;
}

// Generate a title from the description
function generateTitle(description) {
  // If description is short enough, use it directly
  if (description.length <= 50) {
    // Capitalize first letter
    return description.charAt(0).toUpperCase() + description.slice(1);
  }
  
  // For longer descriptions, extract first sentence or truncate
  const firstSentenceMatch = description.match(/^[^.!?]+[.!?]/);
  if (firstSentenceMatch) {
    return firstSentenceMatch[0].trim();
  }
  
  // Truncate long descriptions
  return description.substring(0, 50).trim() + '...';
}

// Generate subtasks for a main task
function generateSubtasks(mainTask, description, count, prefix) {
  const subtasks = [];
  
  // Common development lifecycle subtasks
  const lifecycleTasks = [
    'Design and architecture',
    'Implementation',
    'Testing and QA',
    'Documentation',
    'Deployment and integration'
  ];
  
  // Feature-specific subtasks based on description keywords
  const featureSpecificTasks = generateFeatureSpecificSubtasks(description);
  
  // Combine and select the requested number of tasks
  const allPossibleTasks = [...featureSpecificTasks, ...lifecycleTasks];
  const selectedTasks = allPossibleTasks.slice(0, count);
  
  // Create task objects
  for (let i = 0; i < selectedTasks.length; i++) {
    const title = `${mainTask.title} - ${selectedTasks[i]}`;
    const priority = i === 0 ? mainTask.priority : downgradeTaskPriority(mainTask.priority);
    
    subtasks.push({
      id: generateTaskId(prefix),
      title,
      status: TASK_STATUS,
      priority,
      dependencies: mainTask.id,
      loc: '0'
    });
  }
  
  return subtasks;
}

// Generate feature-specific subtasks based on keywords in the description
function generateFeatureSpecificSubtasks(description) {
  const tasks = [];
  const lowercaseDesc = description.toLowerCase();
  
  // UI-related tasks
  if (lowercaseDesc.includes('ui') || 
      lowercaseDesc.includes('interface') || 
      lowercaseDesc.includes('design') ||
      lowercaseDesc.includes('screen')) {
    tasks.push('UI design and prototyping');
    tasks.push('UI component implementation');
  }
  
  // API-related tasks
  if (lowercaseDesc.includes('api') || 
      lowercaseDesc.includes('endpoint') || 
      lowercaseDesc.includes('service')) {
    tasks.push('API design and specification');
    tasks.push('API implementation');
    tasks.push('API testing and documentation');
  }
  
  // Database-related tasks
  if (lowercaseDesc.includes('database') || 
      lowercaseDesc.includes('data') || 
      lowercaseDesc.includes('storage') ||
      lowercaseDesc.includes('model')) {
    tasks.push('Data model design');
    tasks.push('Database schema updates');
    tasks.push('Data migration plan');
  }
  
  // Authentication-related tasks
  if (lowercaseDesc.includes('auth') || 
      lowercaseDesc.includes('login') || 
      lowercaseDesc.includes('user')) {
    tasks.push('Authentication mechanism design');
    tasks.push('Authorization rules implementation');
    tasks.push('User session management');
  }
  
  // Performance-related tasks
  if (lowercaseDesc.includes('performance') || 
      lowercaseDesc.includes('speed') || 
      lowercaseDesc.includes('optimization')) {
    tasks.push('Performance benchmarking');
    tasks.push('Optimization implementation');
    tasks.push('Performance testing');
  }
  
  return tasks;
}

// Downgrade a task priority (for subtasks)
function downgradeTaskPriority(priority) {
  switch (priority) {
    case TASK_PRIORITIES.HIGH: return TASK_PRIORITIES.MEDIUM;
    case TASK_PRIORITIES.MEDIUM: return TASK_PRIORITIES.LOW;
    default: return priority;
  }
}

// Add tasks to task.md file
function addTasksToTaskFile(content, tasks) {
  if (!tasks || tasks.length === 0) return content;
  
  // Group tasks by category
  const tasksByCategory = {
    'Core System Tasks': [],
    'Security & Compliance': [],
    'AI/ML Integration': [],
    'Performance & Scalability': [],
    'Developer Experience': []
  };
  
  // Map prefixes to categories
  const prefixCategoryMap = {
    'TS': 'Core System Tasks',
    'SEC': 'Security & Compliance',
    'AI': 'AI/ML Integration',
    'PERF': 'Performance & Scalability',
    'DEV': 'Developer Experience'
  };
  
  // Categorize tasks
  tasks.forEach(task => {
    const prefix = task.id.match(/^[A-Z]+/)[0];
    const category = prefixCategoryMap[prefix];
    if (category) {
      tasksByCategory[category].push(task);
    } else {
      tasksByCategory['Core System Tasks'].push(task);
    }
  });
  
  // Insert tasks into each section
  let updatedContent = content;
  
  for (const [category, categoryTasks] of Object.entries(tasksByCategory)) {
    if (categoryTasks.length === 0) continue;
    
    // Find the section for this category
    const sectionRegex = new RegExp(`## ${category}[\\s\\S]*?\\| ID[\\s\\S]*?\\|---[\\s\\S]*?\\|`);
    const sectionMatch = updatedContent.match(sectionRegex);
    
    if (sectionMatch) {
      // Find the end of the table header (the line with dashes)
      const headerEndIndex = updatedContent.indexOf('|---', sectionMatch.index) + 1;
      const insertionPoint = updatedContent.indexOf('\n', headerEndIndex);
      
      // Generate task rows
      const taskRows = categoryTasks.map(task => 
        `| ${task.id} | ${task.title} | ${task.status} | ${task.priority} | ${task.dependencies} | ${task.loc} |`
      ).join('\n');
      
      // Insert rows after header
      updatedContent = 
        updatedContent.substring(0, insertionPoint) + 
        '\n' + taskRows + 
        updatedContent.substring(insertionPoint);
    }
  }
  
  return updatedContent;
}

// Run the recommender
suggestTasks(); 