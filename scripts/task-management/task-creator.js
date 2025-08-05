#!/usr/bin/env node

/**
 * Task Creator for AeroSuite
 * 
 * This script helps create new tasks based on missing dependencies
 * and security recommendations identified in our analysis.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const DEPENDENCY_ANALYSIS_PATH = path.join(__dirname, '../../dependency-analysis.md');
const SECURITY_REPORT_PATH = path.join(__dirname, '../../security-compliance-report.md');

// Check for auto mode flag
const AUTO_MODE = process.argv.includes('--auto');

// Status constants
const STATUS = {
  TODO: '⬜ Todo',
  IN_PROGRESS: '🔄 In Progress',
  IN_REVIEW: '🔍 In Review',
  TESTING: '🧪 Testing',
  DOCUMENTATION: '📝 Documentation',
  BLOCKED: '⚠️ Blocked',
  COMPLETED: '✅ Completed'
};

// Priority constants
const PRIORITY = {
  HIGH: '🔴 High',
  MEDIUM: '🟠 Medium',
  LOW: '🔵 Low',
  NEXT_RELEASE: '⚫ Next Release'
};

// Main function
async function createMissingTasks() {
  try {
    // Check if analysis files exist
    if (!fs.existsSync(DEPENDENCY_ANALYSIS_PATH)) {
      console.error('Dependency analysis file not found. Please run dependency-resolver.js first.');
      return;
    }

    if (!fs.existsSync(SECURITY_REPORT_PATH)) {
      console.error('Security report file not found. Please run security-validator.js first.');
      return;
    }

    // Read the task file
    const taskFileContent = await fs.promises.readFile(TASK_FILE_PATH, 'utf8');
    
    // Extract existing tasks to prevent duplication
    const existingTasks = extractExistingTasks(taskFileContent);
    
    // Read the analysis files
    const dependencyAnalysis = await fs.promises.readFile(DEPENDENCY_ANALYSIS_PATH, 'utf8');
    const securityReport = await fs.promises.readFile(SECURITY_REPORT_PATH, 'utf8');
    
    // Parse missing dependencies
    const missingDependencies = parseMissingDependencies(dependencyAnalysis);
    
    // Filter out dependencies that already exist as tasks
    const filteredDependencies = missingDependencies.filter(dep => {
      if (existingTasks.has(dep.id)) {
        return false; // Skip if task ID already exists
      }
      
      const suggestedTitle = getSuggestedTitle(dep.id);
      return !existingTasks.tasksByTitle.has(suggestedTitle); // Skip if title already exists
    });
    
    // Parse missing security requirements
    const securityRequirements = parseMissingSecurityRequirements(securityReport);
    
    // Filter out security requirements that already exist as tasks
    const filteredSecurityRequirements = securityRequirements.filter(req => {
      const suggestedTitle = `${req.requirement} Implementation`;
      return !existingTasks.tasksByTitle.has(suggestedTitle); // Skip if title already exists
    });
    
    if (filteredDependencies.length === 0 && filteredSecurityRequirements.length === 0) {
      console.log('No new tasks to add. All identified tasks already exist.');
      return;
    }

    // Log skipped tasks if any
    const skippedDependencies = missingDependencies.length - filteredDependencies.length;
    const skippedSecurity = securityRequirements.length - filteredSecurityRequirements.length;
    
    if (skippedDependencies > 0 || skippedSecurity > 0) {
      console.log(`Skipping ${skippedDependencies} dependencies and ${skippedSecurity} security requirements that already exist.`);
    }
    
    console.log(`Found ${filteredDependencies.length} new dependencies and ${filteredSecurityRequirements.length} new security requirements to add.`);
    
    // Create interactive CLI if not in auto mode
    let rl;
    if (!AUTO_MODE) {
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }

    // Handle missing dependencies
    if (filteredDependencies.length > 0) {
      console.log('\n=== New Dependencies to Add ===');
      for (const dep of filteredDependencies) {
        console.log(`${dep.id}: Referenced by ${dep.referencedBy.join(', ')}`);
      }
      
      let addDeps = AUTO_MODE;
      if (!AUTO_MODE) {
        addDeps = await new Promise(resolve => {
          rl.question('\nDo you want to create tasks for these missing dependencies? (y/n) ', answer => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
          });
        });
      }
      
      if (addDeps) {
        // Process dependencies in smaller batches to ensure we don't create duplicates
        let allNewTasks = [];
        let remainingDeps = [...filteredDependencies];
        let batchSize = 5;
        
        while (remainingDeps.length > 0) {
          // Take next batch
          const batch = remainingDeps.splice(0, batchSize);
          
          // Process batch
          const newTasks = await processDependencyBatch(batch, rl, existingTasks);
          allNewTasks = allNewTasks.concat(newTasks);
          
          // Re-extract existing tasks to include the ones we just added
          const updatedContent = await fs.promises.readFile(TASK_FILE_PATH, 'utf8');
          Object.assign(existingTasks, extractExistingTasks(updatedContent));
        }
        
        if (allNewTasks.length > 0) {
          console.log(`\nSuccessfully created ${allNewTasks.length} dependency tasks.`);
        } else {
          console.log('\nNo new dependency tasks created. All tasks already exist.');
        }
      }
    }
    
    // Re-extract existing tasks to include any new dependency tasks
    const updatedContent = await fs.promises.readFile(TASK_FILE_PATH, 'utf8');
    const updatedExistingTasks = extractExistingTasks(updatedContent);
    
    // Handle security requirements
    if (filteredSecurityRequirements.length > 0) {
      console.log('\n=== New Security Requirements to Add ===');
      for (const req of filteredSecurityRequirements) {
        console.log(`${req.category}: ${req.requirement}`);
      }
      
      let addSec = AUTO_MODE;
      if (!AUTO_MODE) {
        addSec = await new Promise(resolve => {
          rl.question('\nDo you want to create tasks for these security requirements? (y/n) ', answer => {
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
          });
        });
      }
      
      if (addSec) {
        // Process security requirements in smaller batches
        let allNewTasks = [];
        let remainingReqs = [...filteredSecurityRequirements];
        let batchSize = 2;
        
        while (remainingReqs.length > 0) {
          // Take next batch
          const batch = remainingReqs.splice(0, batchSize);
          
          // Process batch
          const newTasks = await processSecurityBatch(batch, rl, updatedExistingTasks);
          allNewTasks = allNewTasks.concat(newTasks);
          
          // Re-extract existing tasks to include the ones we just added
          const latestContent = await fs.promises.readFile(TASK_FILE_PATH, 'utf8');
          Object.assign(updatedExistingTasks, extractExistingTasks(latestContent));
        }
        
        if (allNewTasks.length > 0) {
          console.log(`\nSuccessfully created ${allNewTasks.length} security tasks.`);
        } else {
          console.log('\nNo new security tasks created. All tasks already exist.');
        }
      }
    }
    
    if (rl) {
      rl.close();
    }
    
  } catch (error) {
    console.error('Error creating tasks:', error);
  }
}

// Extract existing tasks from the task file
function extractExistingTasks(content) {
  const taskIds = new Set();
  const tasksByTitle = new Map();
  const tasksByTitleLowercase = new Set();
  
  // Regex to match task rows in any table - handle both standard rows and rows with verification methods
  const taskRowRegex = /\|\s*([A-Za-z0-9-]+)\s*\|\s*([^|]+)\s*\|[^|]*\|[^|]*\|[^|]*\|[^|]*(?:\|[^|]*|)\|/g;
  
  let match;
  while ((match = taskRowRegex.exec(content)) !== null) {
    const id = match[1].trim();
    const title = match[2].trim();
    
    taskIds.add(id);
    tasksByTitle.set(title, id);
    tasksByTitleLowercase.add(title.toLowerCase());
  }
  
  return {
    has: (id) => taskIds.has(id),
    titleExists: (title) => tasksByTitleLowercase.has(title.toLowerCase()),
    getTitleId: (title) => tasksByTitle.get(title),
    tasksByTitle: {
      has: (title) => tasksByTitleLowercase.has(title.toLowerCase())
    },
    getNextId: (prefix) => {
      const prefixPattern = new RegExp(`^${prefix}(\\d+)$`);
      let maxId = 0;
      
      for (const id of taskIds) {
        const match = id.match(prefixPattern);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxId) {
            maxId = num;
          }
        }
      }
      
      return `${prefix}${(maxId + 1).toString().padStart(3, '0')}`;
    },
    addTask: (id, title) => {
      taskIds.add(id);
      tasksByTitle.set(title, id);
      tasksByTitleLowercase.add(title.toLowerCase());
    }
  };
}

// Parse missing dependencies from dependency analysis
function parseMissingDependencies(content) {
  const missingDeps = [];
  const missingDepsSectionRegex = /## Missing Dependencies\s+[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+([^#]*)/;
  const match = content.match(missingDepsSectionRegex);
  
  if (!match || !match[1]) {
    return missingDeps;
  }
  
  const depSection = match[1];
  const depRowRegex = /\|\s*([^\s|]+)\s*\|\s*([^|]+)\s*\|\s*(\d+)\s*\|/g;
  
  let depMatch;
  while ((depMatch = depRowRegex.exec(depSection)) !== null) {
    const id = depMatch[1].trim();
    const referencedBy = depMatch[2].split(',').map(ref => ref.trim());
    const count = parseInt(depMatch[3].trim(), 10);
    
    missingDeps.push({
      id,
      referencedBy,
      count
    });
  }
  
  return missingDeps;
}

// Parse missing security requirements from security report
function parseMissingSecurityRequirements(content) {
  const securityReqs = [];
  
  // Extract missing security requirements
  const categories = ['ACCESS_CONTROL', 'DATA_PROTECTION', 'MONITORING', 'VULNERABILITY_MGMT'];
  
  for (const category of categories) {
    const displayCategory = category.replace('_', ' ');
    const sectionRegex = new RegExp(`### ${displayCategory}[\\s\\S]*?Missing Requirements:\\s+([^#]*?)(?:\\n\\n|$)`);
    const match = content.match(sectionRegex);
    
    if (match && match[1]) {
      const requirementsText = match[1];
      const reqRegex = /- ❌ ([^\n]+)/g;
      
      let reqMatch;
      while ((reqMatch = reqRegex.exec(requirementsText)) !== null) {
        securityReqs.push({
          category: displayCategory,
          requirement: reqMatch[1].trim()
        });
      }
    }
  }
  
  return securityReqs;
}

// Get next available task ID
function getNextTaskId(content) {
  const lines = content.split('\n');
  let maxId = 0;
  
  // Regular expression to match task IDs
  const taskIdRegex = /\|\s*(TS(\d+))\s*\|/;
  
  for (const line of lines) {
    const match = line.match(taskIdRegex);
    if (match && match[2]) {
      const idNum = parseInt(match[2]);
      if (idNum > maxId) {
        maxId = idNum;
      }
    }
  }
  
  return `TS${(maxId + 1).toString().padStart(3, '0')}`;
}

// Find the appropriate section for a task based on its ID prefix
function findSectionForTask(content, taskId) {
  const prefix = taskId.match(/^([A-Za-z]+)/)[0];
  
  const sectionMapping = {
    'TS': /(## Tasks\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/,
    'AI': /(## AI\/ML Integration\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/,
    'EXT': /(## API & Extensibility\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/,
    'PERF': /(## Performance & Scalability\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/,
    'DEV': /(## Developer Experience\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/,
    'SEC': /(## Security & Compliance\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/,
    'GBL': /(## Global Expansion & Integration\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/,
    'INT': /(## Enterprise Integrations\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/,
    'SaaS': /(## SaaS Infrastructure & Multi-tenancy\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/,
    'DATA': /(## Data Management & Analytics\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/
  };
  
  if (sectionMapping[prefix]) {
    return content.match(sectionMapping[prefix]);
  }
  
  return null;
}

// Determine appropriate priority for a dependency
function getSuggestedPriority(dependencyId, referencedBy) {
  // Check if any referencing tasks are high priority
  const hasHighPriorityDep = referencedBy.some(ref => {
    return ref.includes('SEC') || // Security tasks are usually high priority
           ref.includes('AUTH') || // Authentication related
           ref.includes('PERF'); // Performance related
  });
  
  if (hasHighPriorityDep) {
    return PRIORITY.HIGH;
  }
  
  // Check for medium priority indicators
  const hasMediumPriorityDep = referencedBy.some(ref => {
    return ref.includes('API') || // API related
           ref.includes('UI') || // UI related
           ref.includes('UX'); // UX related
  });
  
  if (hasMediumPriorityDep) {
    return PRIORITY.MEDIUM;
  }
  
  // Default priority based on task type
  const prefix = dependencyId.match(/^([A-Za-z]+)/)[0];
  
  switch (prefix) {
    case 'SEC':
    case 'TS': 
      return PRIORITY.HIGH;
    case 'PERF':
    case 'AI':
    case 'SaaS': 
      return PRIORITY.MEDIUM;
    default:
      return PRIORITY.LOW;
  }
}

// Process a batch of dependency tasks
async function processDependencyBatch(dependencies, rl, existingTasks) {
  // Read the latest file content
  const latestContent = await fs.promises.readFile(TASK_FILE_PATH, 'utf8');
  let updatedContent = latestContent;
  let createdTasks = [];
  
  // First, find the Tasks section to make sure it exists
  const tasksHeaderRegex = /(## Tasks\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/;
  const tasksMatch = updatedContent.match(tasksHeaderRegex);
  
  if (!tasksMatch) {
    console.error("Could not find main Tasks section in the task.md file. Please check the file format.");
    return createdTasks;
  }
  
  for (const dep of dependencies) {
    // Skip if task already exists
    if (existingTasks.has(dep.id)) {
      console.log(`Skipping ${dep.id} as it already exists.`);
      continue;
    }
    
    // Get suggested title from the missing dependencies section
    const suggestedTitle = getSuggestedTitle(dep.id);
    
    // Skip if a task with this title already exists
    if (existingTasks.tasksByTitle.has(suggestedTitle)) {
      console.log(`Skipping ${dep.id} as a task with title "${suggestedTitle}" already exists.`);
      continue;
    }
    
    // Get suggested priority
    const suggestedPriority = getSuggestedPriority(dep.id, dep.referencedBy);
    
    let title = suggestedTitle;
    let priority = suggestedPriority;
    
    // If not in auto mode, ask for confirmation
    if (!AUTO_MODE && rl) {
      // Ask user to confirm or modify title
      title = await new Promise(resolve => {
        rl.question(`\nCreating task for ${dep.id}\nSuggested title: "${suggestedTitle}"\nEnter title (or press Enter to use suggested): `, 
          answer => resolve(answer.trim() || suggestedTitle));
      });
      
      // Ask for priority
      console.log('\nSelect priority:');
      console.log('1: 🔴 High');
      console.log('2: 🟠 Medium');
      console.log('3: 🔵 Low');
      console.log(`Suggested: ${suggestedPriority === PRIORITY.HIGH ? '1: High' : suggestedPriority === PRIORITY.MEDIUM ? '2: Medium' : '3: Low'}`);
      
      const priorityChoice = await new Promise(resolve => {
        rl.question('Enter choice (1-3 or Enter for suggested): ', answer => resolve(answer.trim() || '0'));
      });
      
      switch (priorityChoice) {
        case '1': priority = PRIORITY.HIGH; break;
        case '2': priority = PRIORITY.MEDIUM; break;
        case '3': priority = PRIORITY.LOW; break;
        default: priority = suggestedPriority; // Use suggested priority
      }
    }
    
    // Create new task entry
    const newTaskId = dep.id; // Use the missing dependency ID
    const newTask = `| ${newTaskId} | ${title} | ${STATUS.TODO} | ${priority} | - | 0 |`;
    
    // Try to find the appropriate section to add the task
    const sectionMatch = findSectionForTask(updatedContent, newTaskId);
    
    if (sectionMatch) {
      const [fullMatch, beforeTable, tableContent] = sectionMatch;
      // Add task to the end of the table
      const newTableContent = tableContent + newTask + '\n';
      updatedContent = updatedContent.replace(fullMatch, beforeTable + newTableContent);
    } else {
      // Default to adding to the main Tasks section if no specific section found
      const [fullMatch, header, content] = tasksMatch;
      const newContent = content + newTask + '\n';
      updatedContent = updatedContent.replace(fullMatch, header + newContent);
    }
    
    createdTasks.push(newTaskId);
    
    // Mark task as existing to avoid duplicates in later batches
    existingTasks.addTask(newTaskId, title);
  }
  
  // Write the updated content back to the file
  if (createdTasks.length > 0) {
    await fs.promises.writeFile(TASK_FILE_PATH, updatedContent);
  }
  
  return createdTasks;
}

// Process a batch of security tasks
async function processSecurityBatch(securityRequirements, rl, existingTasks) {
  // Read the latest file content
  const latestContent = await fs.promises.readFile(TASK_FILE_PATH, 'utf8');
  let updatedContent = latestContent;
  let createdTasks = [];
  
  for (const req of securityRequirements) {
    // Generate title based on requirement
    const suggestedTitle = `${req.requirement} Implementation`;
    
    // Skip if a task with this title already exists
    if (existingTasks.tasksByTitle.has(suggestedTitle)) {
      console.log(`Skipping "${suggestedTitle}" as it already exists.`);
      continue;
    }
    
    let title = suggestedTitle;
    const priority = PRIORITY.HIGH; // Security tasks are always high priority
    
    // If not in auto mode, ask for confirmation
    if (!AUTO_MODE && rl) {
      // Ask user to confirm or modify title
      title = await new Promise(resolve => {
        rl.question(`\nCreating task for ${req.category}: ${req.requirement}\nSuggested title: "${suggestedTitle}"\nEnter title (or press Enter to use suggested): `, 
          answer => resolve(answer.trim() || suggestedTitle));
      });
    }
    
    // Create new task entry with SEC prefix
    const nextId = existingTasks.getNextId('SEC');
    
    // Add verification method for security tasks
    const verificationType = getVerificationMethodForSecurityTask(req.requirement);
    const newTask = `| ${nextId} | ${title} | ${STATUS.TODO} | ${priority} | - | 0 | ${verificationType} |`;
    
    // Find the Security & Compliance section
    const securitySectionRegex = /(## Security & Compliance\s+\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s+)((?:\|[^\n]*\|\s+)*)/;
    const securityMatch = updatedContent.match(securitySectionRegex);
    
    if (securityMatch) {
      const [fullMatch, header, content] = securityMatch;
      const newContent = content + newTask + '\n';
      updatedContent = updatedContent.replace(fullMatch, header + newContent);
    } else {
      console.error(`Could not find Security & Compliance section to add task ${nextId}`);
      continue;
    }
    
    createdTasks.push(nextId);
    
    // Mark task as existing to avoid duplicates in later batches
    existingTasks.addTask(nextId, title);
  }
  
  // Write the updated content back to the file
  if (createdTasks.length > 0) {
    await fs.promises.writeFile(TASK_FILE_PATH, updatedContent);
  }
  
  return createdTasks;
}

// Get verification method for security task
function getVerificationMethodForSecurityTask(requirement) {
  const verificationMethods = {
    'Authorization': 'Access control testing',
    'Session Management': 'Session hijacking prevention testing',
    'Encryption in Transit': 'TLS configuration validation',
    'Key Management': 'Key rotation and protection testing',
    'Data Classification': 'Data handling policy verification',
    'Alerting': 'Alert generation and delivery testing',
    'Incident Response': 'Incident simulation exercise',
    'Patch Management': 'Vulnerability patching verification'
  };
  
  return verificationMethods[requirement] || 'Security testing';
}

// Get suggested title for missing dependency
function getSuggestedTitle(dependencyId) {
  // Look for a matching proposed resolution in the task.md file
  const proposedResolutions = getProposedResolutions();
  if (proposedResolutions[dependencyId]) {
    return proposedResolutions[dependencyId];
  }
  
  // Mapping of known task ID patterns to their titles
  const prefixTitleMap = {
    'TS': 'Core System Component',
    'AI': 'AI/ML Component',
    'EXT': 'API Extension',
    'PERF': 'Performance Optimization',
    'DEV': 'Developer Tool',
    'SEC': 'Security Control',
    'GBL': 'Global Feature',
    'INT': 'Integration Component',
    'SaaS': 'Multi-tenant Feature',
    'DATA': 'Data Management Component'
  };
  
  const prefix = dependencyId.match(/^([A-Za-z]+)/)[0];
  const baseTitle = prefixTitleMap[prefix] || 'Component';
  
  return `${baseTitle} ${dependencyId}`;
}

// Get proposed resolutions from the task.md file
function getProposedResolutions() {
  try {
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    const resolutionsSection = content.match(/## Missing Dependencies[\s\S]*?Referenced ID \| Referenced By[\s\S]*?\|([\s\S]*?)(?:\n\n|$)/);
    
    if (!resolutionsSection || !resolutionsSection[1]) {
      return {};
    }
    
    const resolutions = {};
    const rowRegex = /\|\s*([^\s|]+)\s*\|[^|]*\|\s*([^|]+)\s*\|/g;
    
    let match;
    while ((match = rowRegex.exec(resolutionsSection[1])) !== null) {
      const id = match[1].trim();
      const resolution = match[2].trim();
      resolutions[id] = resolution;
    }
    
    return resolutions;
  } catch (error) {
    console.error('Error reading proposed resolutions:', error);
    return {};
  }
}

// Export functions for use in other scripts
module.exports = {
  createMissingTasks
};

// If script is run directly, execute the main function
if (require.main === module) {
  createMissingTasks();
} 