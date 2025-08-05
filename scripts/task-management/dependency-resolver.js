#!/usr/bin/env node

/**
 * Dependency Resolver for AeroSuite
 * 
 * This script analyzes the task.md file for:
 * 1. Circular dependencies
 * 2. Missing dependencies
 * 3. Tasks that should be marked as blocked
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const OUTPUT_FILE_PATH = path.join(process.cwd(), 'dependency-analysis.md');

// Main function
async function analyzeDependencies() {
  try {
    console.log('Reading task file...');
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    
    // Extract tasks
    const tasks = extractTasks(content);
    
    // Check for dependency issues
    const { missingDependencies, circularDependencies, blockedTasks } = checkDependencies(tasks);
    
    // Generate analysis report
    const report = generateReport(tasks, missingDependencies, circularDependencies, blockedTasks);
    
    // Write report to file
    fs.writeFileSync(OUTPUT_FILE_PATH, report, 'utf8');
    
    // Log summary
    console.log(`
Analysis complete! Results written to ${OUTPUT_FILE_PATH}

Summary:
- ${Object.keys(tasks).length} total tasks
- ${missingDependencies.length} missing dependencies
- ${circularDependencies.length} circular dependencies
- ${blockedTasks.length} tasks that should be marked as blocked
`);
    
  } catch (error) {
    console.error('Error analyzing dependencies:', error);
    process.exit(1);
  }
}

// Extract tasks from content
function extractTasks(content) {
  const tasks = {};
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Only process table rows
    if (line.startsWith('|') && line.includes('|')) {
      // Skip table headers and dividers
      if (line.includes('ID') || line.includes('------')) continue;
      
      const task = parseTaskRow(line);
      if (task) {
        tasks[task.id] = task;
      }
    }
  }
  
  return tasks;
}

// Parse a task row from the table
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
    dependencies: parseDependencies(parts[5]),
    loc: parts[6]
  };
}

// Parse dependencies field
function parseDependencies(dependenciesStr) {
  if (dependenciesStr === '-' || !dependenciesStr) return [];
  
  // Handle comma-separated dependencies
  return dependenciesStr.split(',').map(dep => dep.trim()).filter(Boolean);
}

// Check for dependency issues
function checkDependencies(tasks) {
  const missingDependencies = [];
  const circularDependencies = [];
  const blockedTasks = [];
  
  // Track missing dependencies and their references
  const missingDepsMap = new Map();
  
  // Check for missing dependencies and tasks that should be blocked
  for (const taskId in tasks) {
    const task = tasks[taskId];
    
    for (const depId of task.dependencies) {
      if (!tasks[depId] && depId !== '-') {
        // Add to missing dependencies
        if (!missingDepsMap.has(depId)) {
          missingDepsMap.set(depId, new Set());
        }
        missingDepsMap.get(depId).add(taskId);
      }
    }
    
    // Check if task should be blocked
    if (task.status !== '⚠️ Blocked' && task.dependencies.length > 0) {
      const shouldBeBlocked = task.dependencies.some(depId => {
        return tasks[depId] && !isTaskCompleted(tasks[depId].status);
      });
      
      if (shouldBeBlocked) {
        blockedTasks.push(taskId);
      }
    }
  }
  
  // Convert missingDepsMap to array format
  for (const [depId, referencingTasks] of missingDepsMap.entries()) {
    missingDependencies.push({
      id: depId,
      referencedBy: Array.from(referencingTasks),
      count: referencingTasks.size
    });
  }
  
  // Sort missing dependencies by reference count (most referenced first)
  missingDependencies.sort((a, b) => b.count - a.count);
  
  // Check for circular dependencies
  const visited = new Set();
  const path = [];
  const processed = new Set();
  
  for (const taskId in tasks) {
    if (!processed.has(taskId)) {
      findCircularDependencies(tasks, taskId, visited, path, circularDependencies, processed);
    }
  }
  
  return { missingDependencies, circularDependencies, blockedTasks };
}

// Check if a task is completed
function isTaskCompleted(status) {
  return status.includes('✅ Completed');
}

// Find circular dependencies using depth-first search
function findCircularDependencies(tasks, taskId, visited, path, result, processed) {
  if (!tasks[taskId]) {
    processed.add(taskId);
    return;
  }
  
  if (visited.has(taskId)) {
    // Found a circular dependency
    const cycleStart = path.indexOf(taskId);
    if (cycleStart !== -1) {
      const cycle = path.slice(cycleStart).concat(taskId);
      result.push(cycle);
    }
    return;
  }
  
  visited.add(taskId);
  path.push(taskId);
  
  for (const depId of tasks[taskId].dependencies) {
    if (tasks[depId]) {
      findCircularDependencies(tasks, depId, visited, path, result, processed);
    }
  }
  
  // Remove from current path
  path.pop();
  visited.delete(taskId);
  
  // Mark as fully processed
  processed.add(taskId);
}

// Generate analysis report
function generateReport(tasks, missingDependencies, circularDependencies, blockedTasks) {
  let report = `# Dependency Analysis Report

## Summary

- **Total Tasks**: ${Object.keys(tasks).length}
- **Missing Dependencies**: ${missingDependencies.length}
- **Circular Dependencies**: ${circularDependencies.length}
- **Tasks Needing Blocked Status**: ${blockedTasks.length}

## Circular Dependencies

`;

  if (circularDependencies.length === 0) {
    report += "No circular dependencies found. 👍\n";
  } else {
    report += "The following circular dependencies were found. These should be resolved:\n\n";
    
    for (let i = 0; i < circularDependencies.length; i++) {
      const cycle = circularDependencies[i];
      report += `### Circular Dependency ${i + 1}\n\n`;
      report += `\`${cycle.join(' → ')}\`\n\n`;
      
      // Add details for each task in the cycle
      report += "| Task ID | Title | Dependencies |\n";
      report += "|---------|-------|---------------|\n";
      
      for (const taskId of cycle) {
        const task = tasks[taskId];
        if (task) {
          report += `| ${taskId} | ${task.title} | ${task.dependencies.join(', ')} |\n`;
        }
      }
      
      // Add suggested resolution
      report += "\n**Suggested Resolution:**\n";
      report += "- Break the dependency cycle by removing one of the dependencies\n";
      report += "- Consider creating a shared component that both tasks can depend on\n";
      report += "- If possible, restructure the tasks to eliminate circular dependencies\n\n";
    }
  }
  
  report += `## Missing Dependencies

The following dependencies are referenced by tasks but don't exist in the task list:

| Referenced ID | Referenced By | Count |
|---------------|---------------|-------|
`;

  for (const { id, referencedBy, count } of missingDependencies) {
    report += `| ${id} | ${referencedBy.join(', ')} | ${count} |\n`;
  }
  
  report += `
## Tasks Needing Blocked Status

The following tasks should be marked as blocked (⚠️ Blocked) because they depend on incomplete tasks:

| Task ID | Task Title | Current Status | Dependencies |
|---------|------------|----------------|--------------|
`;

  for (const taskId of blockedTasks) {
    const task = tasks[taskId];
    report += `| ${taskId} | ${task.title} | ${task.status} | ${task.dependencies.join(', ')} |\n`;
  }
  
  report += `
## Proposed Resolutions

### For Missing Dependencies

Create new tasks for these missing dependencies:

| Referenced ID | Referenced By | Suggested Title |
|---------------|---------------|----------------|
`;

  // Add suggested titles for missing dependencies
  for (const { id, referencedBy } of missingDependencies) {
    const suggestedTitle = getSuggestedTitle(id);
    report += `| ${id} | ${referencedBy.join(', ')} | ${suggestedTitle} |\n`;
  }
  
  report += `
### For Tasks Needing Blocked Status

Run the task-updater.js script to automatically update these tasks to "⚠️ Blocked" status.

## Next Steps

1. Run \`node scripts/task-management/task-creator.js\` to create missing dependency tasks
2. Run \`node scripts/task-management/task-updater.js\` to update task statuses
3. Manually review and resolve circular dependencies
`;

  return report;
}

// Get suggested title for a missing dependency
function getSuggestedTitle(dependencyId) {
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

// Run the main function
analyzeDependencies(); 