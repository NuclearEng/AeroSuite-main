#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const OUTPUT_FILE_PATH = path.join(process.cwd(), 'task.md');

// Main function
async function cleanTaskFile() {
  try {
    console.log('Reading task file...');
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    
    // Process the content
    const cleanedContent = processContent(content);
    
    // Write back
    fs.writeFileSync(OUTPUT_FILE_PATH, cleanedContent, 'utf8');
    
    console.log('Task file cleaned successfully!');
  } catch (error) {
    console.error('Error cleaning task file:', error);
    process.exit(1);
  }
}

function processContent(content) {
  // Split the content into lines
  const lines = content.split('\n');
  let cleanedLines = [];
  
  // Fix task.md content
  let inTaskTable = false;
  let tableHeaderSeen = false;
  let tableDividerSeen = false;
  
  // Create a clean version of the status and priority legend
  const legendSection = `## Status and Priority Legend

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
`;

  // Add header
  cleanedLines.push('# AeroSuite Task Tracker');
  cleanedLines.push('');
  
  // Add legend section
  cleanedLines.push(legendSection);
  
  // Process and clean tasks
  cleanedLines.push('## Tasks');
  cleanedLines.push('');
  cleanedLines.push('| ID    | Title                                          | Status        | Priority    | Dependencies     | LOC   |');
  cleanedLines.push('|-------|------------------------------------------------|---------------|-------------|------------------|-------|');
  
  // Set to track unique task IDs
  const taskIds = new Set();
  const tasks = [];
  
  // Extract and deduplicate tasks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and section headers
    if (line === '' || line.startsWith('#')) continue;
    
    // Only process table rows
    if (line.startsWith('|') && line.includes('|')) {
      // Skip table headers and dividers
      if (line.includes('ID') || line.includes('------')) continue;
      
      const task = parseTaskRow(line);
      if (task && !taskIds.has(task.id)) {
        // Clean the task formatting
        task.status = cleanStatus(task.status);
        task.priority = cleanPriority(task.priority);
        task.dependencies = cleanDependencies(task.dependencies);
        
        tasks.push(task);
        taskIds.add(task.id);
      }
    }
  }
  
  // Sort tasks by ID number
  tasks.sort((a, b) => {
    const aNum = parseInt(a.id.replace(/\D/g, ''));
    const bNum = parseInt(b.id.replace(/\D/g, ''));
    return aNum - bNum;
  });
  
  // Add tasks to the cleaned lines
  tasks.forEach(task => {
    cleanedLines.push(formatTaskRow(task));
  });
  
  // Add missing critical tasks section
  cleanedLines.push('');
  cleanedLines.push('## Missing Critical Tasks');
  cleanedLines.push('');
  cleanedLines.push('| ID    | Title                                          | Status        | Priority    | Dependencies     | LOC   |');
  cleanedLines.push('|-------|------------------------------------------------|---------------|-------------|------------------|-------|');
  cleanedLines.push('| TS445 | Disaster Recovery Testing Framework            | ⚠️ Blocked    | 🔴 High     | TS380, GBL005    | 0     |');
  cleanedLines.push('| TS446 | Chaos Engineering Test Suite                   | ⚠️ Blocked    | 🔴 High     | TS445            | 0     |');
  cleanedLines.push('| TS447 | Comprehensive Audit Logging System             | ⚠️ Blocked    | 🔴 High     | TS015, TS404     | 0     |');
  cleanedLines.push('| TS448 | Production Debugging & Diagnostics Tools       | ⚠️ Blocked    | 🔴 High     | PERF006, TS007   | 0     |');
  cleanedLines.push('| TS449 | Zero-Downtime Schema Migration Framework       | ⚠️ Blocked    | 🔴 High     | TS349, TS423     | 0     |');
  cleanedLines.push('| TS450 | Credential & Secrets Management System         | ⚠️ Blocked    | 🔴 High     | SEC003, SEC004   | 0     |');
  cleanedLines.push('| TS451 | API Key Rotation & Management                  | ⚠️ Blocked    | 🔴 High     | TS450, TS401     | 0     |');
  cleanedLines.push('| TS452 | Cloud Resources Cost Optimization              | ⬜ Todo       | 🟠 Medium   | TS348, TS350     | 0     |');
  cleanedLines.push('| TS453 | Technical Debt Tracking & Management           | ⬜ Todo       | 🟠 Medium   | -                | 0     |');
  cleanedLines.push('| TS454 | Cross-Component Integration Testing            | ⚠️ Blocked    | 🔴 High     | TS344, TS345     | 0     |');
  cleanedLines.push('| TS455 | Performance Benchmarks & Acceptance Criteria   | ⚠️ Blocked    | 🔴 High     | PERF006, PERF010 | 0     |');
  
  // Add security and compliance section
  cleanedLines.push('');
  cleanedLines.push('## Security & Compliance');
  cleanedLines.push('');
  cleanedLines.push('| ID    | Title                                          | Status        | Priority    | Dependencies     | LOC   |');
  cleanedLines.push('|-------|------------------------------------------------|---------------|-------------|------------------|-------|');
  cleanedLines.push('| SEC001 | Zero Trust Security Architecture              | ⚠️ Blocked    | 🔴 High     | TS028, TS036     | 387   |');
  cleanedLines.push('| SEC002 | Tenant Data Isolation Verification            | ⚠️ Blocked    | 🔴 High     | SaaS002, SaaS003 | 324   |');
  cleanedLines.push('| SEC003 | Data Encryption at Rest Implementation        | ⚠️ Blocked    | 🔴 High     | TS132            | 265   |');
  cleanedLines.push('| SEC004 | End-to-End Encryption Framework               | ⚠️ Blocked    | 🔴 High     | SEC003           | 345   |');
  cleanedLines.push('| SEC005 | Security Information Event Management         | ⚠️ Blocked    | 🔴 High     | TS119, TS404     | 376   |');
  cleanedLines.push('| SEC006 | Threat Detection System                       | 🔄 In Progress| 🔴 High     | SEC005           | 312   |');
  cleanedLines.push('| SEC007 | Automated Vulnerability Scanning              | ⚠️ Blocked    | 🔴 High     | TS133, TS351     | 287   |');
  cleanedLines.push('| SEC008 | Third-party Dependency Security Audit         | ⚠️ Blocked    | 🔴 High     | TS134            | 234   |');
  cleanedLines.push('| SEC009 | SOC 2 Compliance Framework                    | ⚠️ Blocked    | 🔴 High     | SEC001-SEC008    | 478   |');
  cleanedLines.push('| SEC010 | GDPR Compliance Framework                     | ⚠️ Blocked    | 🔴 High     | SEC001-SEC008    | 467   |');
  cleanedLines.push('| SEC019 | Security Headers Implementation               | ⬜ Todo       | 🔴 High     | -                | 0     |');
  cleanedLines.push('| SEC021 | Authorization Implementation                  | ⬜ Todo       | 🔴 High     | -                | 0     |');
  cleanedLines.push('| SEC022 | Session Management Implementation             | ⬜ Todo       | 🔴 High     | -                | 0     |');
  cleanedLines.push('| SEC023 | Encryption in Transit Implementation          | ⬜ Todo       | 🔴 High     | -                | 0     |');
  cleanedLines.push('| SEC024 | Key Management Implementation                 | ⬜ Todo       | 🔴 High     | -                | 0     |');
  cleanedLines.push('| SEC025 | Data Classification Implementation            | ⬜ Todo       | 🔴 High     | -                | 0     |');
  cleanedLines.push('| SEC026 | Security Alerting Framework                   | ⬜ Todo       | 🔴 High     | -                | 0     |');
  cleanedLines.push('| SEC027 | Incident Response Implementation              | ⬜ Todo       | 🔴 High     | -                | 0     |');
  cleanedLines.push('| SEC028 | Patch Management Implementation               | ⬜ Todo       | 🔴 High     | -                | 0     |');

  // Add AI/ML Integration section
  cleanedLines.push('');
  cleanedLines.push('## AI/ML Integration');
  cleanedLines.push('');
  cleanedLines.push('| ID    | Title                                          | Status        | Priority    | Dependencies     | LOC   |');
  cleanedLines.push('|-------|------------------------------------------------|---------------|-------------|------------------|-------|');
  cleanedLines.push('| AI001 | AI Foundation Architecture                     | ⚠️ Blocked    | 🔴 High     | TS395            | 345   |');
  cleanedLines.push('| AI002 | Machine Learning Pipeline Infrastructure       | ⚠️ Blocked    | 🔴 High     | TS396, AI001     | 287   |');
  cleanedLines.push('| AI003 | Computer Vision Framework                      | ⚠️ Blocked    | 🔴 High     | TS397, AI001     | 312   |');
  cleanedLines.push('| AI009 | ML Model Registry & Versioning                 | ⚠️ Blocked    | 🔴 High     | AI001, AI002     | 278   |');
  cleanedLines.push('| AI010 | ML Model Monitoring System                     | ⚠️ Blocked    | 🔴 High     | AI009            | 245   |');
  cleanedLines.push('| AI011 | ML Feature Store Implementation                | ⚠️ Blocked    | 🟠 Medium   | AI001, AI002     | 324   |');
  cleanedLines.push('| AI019 | Visual Defect Classification                   | ⚠️ Blocked    | 🔴 High     | AI003            | 345   |');
  cleanedLines.push('| AI020 | Time Series Analysis Framework                 | ⚠️ Blocked    | 🟠 Medium   | AI001, AI002     | 287   |');
  cleanedLines.push('| AI022 | AI Governance Framework                        | ⚠️ Blocked    | 🔴 High     | AI001, SEC004    | 0     |');
  cleanedLines.push('| AI023 | Ethical AI Guidelines Implementation           | ⚠️ Blocked    | 🔴 High     | AI022            | 0     |');
  cleanedLines.push('| AI025 | Computer Vision Annotation Tool                | ⚠️ Blocked    | 🟠 Medium   | AI003            | 248   |');

  // Add Performance & Scalability section
  cleanedLines.push('');
  cleanedLines.push('## Performance & Scalability');
  cleanedLines.push('');
  cleanedLines.push('| ID     | Title                                       | Status        | Priority    | Dependencies     | LOC   |');
  cleanedLines.push('|--------|---------------------------------------------|---------------|-------------|------------------|-------|');
  cleanedLines.push('| PERF001 | Database Query Optimization Framework      | ⚠️ Blocked    | 🔴 High     | TS108, TS295     | 352   |');
  cleanedLines.push('| PERF006 | Real-time Performance Monitoring           | ⚠️ Blocked    | 🔴 High     | TS299, TS300     | 312   |');
  cleanedLines.push('| PERF009 | Auto-scaling Optimization                  | 🔄 In Progress| 🔴 High     | TS350            | 298   |');
  cleanedLines.push('| PERF010 | Load Testing Automation Pipeline           | ⚠️ Blocked    | 🔴 High     | TS353, TS354     | 345   |');
  cleanedLines.push('| PERF012 | Memory Optimization Framework              | ⚠️ Blocked    | 🔴 High     | TS158, TS286     | 324   |');
  cleanedLines.push('| PERF013 | Browser Performance Optimization           | ⚠️ Blocked    | 🟠 Medium   | TS106, TS107     | 312   |');

  // Add Developer Experience section
  cleanedLines.push('');
  cleanedLines.push('## Developer Experience');
  cleanedLines.push('');
  cleanedLines.push('| ID    | Title                                       | Status        | Priority    | Dependencies     | LOC   |');
  cleanedLines.push('|-------|---------------------------------------------|---------------|-------------|------------------|-------|');
  cleanedLines.push('| DEV007 | Automated Code Quality Checks              | ⚠️ Blocked    | 🔴 High     | TS344, TS345     | 267   |');
  cleanedLines.push('| DEV010 | Local Environment Test Data Generation     | 🔄 In Progress| 🟠 Medium   | TS356            | 289   |');
  cleanedLines.push('| DEV015 | Automated Documentation Generation         | ⚠️ Blocked    | 🟠 Medium   | TS346, TS347     | 324   |');

  return cleanedLines.join('\n');
}

// Helper functions
function parseTaskRow(line) {
  const parts = line.split('|').map(part => part.trim());
  
  if (parts.length < 7) return null;
  
  // Skip header rows and divider rows
  if (parts[1] === 'ID' || parts[1].includes('-----')) return null;
  
  return {
    id: parts[1],
    title: parts[2],
    status: parts[3],
    priority: parts[4],
    dependencies: parts[5],
    loc: parts[6]
  };
}

function formatTaskRow(task) {
  return `| ${task.id} | ${task.title.padEnd(44)} | ${task.status} | ${task.priority} | ${task.dependencies} | ${task.loc} |`;
}

function cleanStatus(status) {
  if (status.includes('Completed')) return '✅ Completed';
  if (status.includes('In Progress')) return '🔄 In Progress';
  if (status.includes('In Review')) return '🔍 In Review';
  if (status.includes('Testing')) return '🧪 Testing';
  if (status.includes('Documentation')) return '📝 Documentation';
  if (status.includes('Blocked')) return '⚠️ Blocked';
  if (status.includes('Todo')) return '⬜ Todo';
  return status;
}

function cleanPriority(priority) {
  if (priority.includes('High')) return '🔴 High';
  if (priority.includes('Medium')) return '🟠 Medium';
  if (priority.includes('Low')) return '🔵 Low';
  if (priority.includes('Next Release')) return '⚫ Next Release';
  return priority;
}

function cleanDependencies(dependencies) {
  // If it's just a dash, keep it
  if (dependencies.trim() === '-') return '-';
  
  // Split by commas if there are multiple dependencies
  const deps = dependencies.split(',').map(d => d.trim());
  return deps.join(', ');
}

// Run the main function
cleanTaskFile(); 