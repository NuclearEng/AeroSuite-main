#!/usr/bin/env node

/**
 * Full Task Analysis for AeroSuite
 * 
 * This script:
 * 1. Runs the task-code automapper to connect all code files to tasks
 * 2. Runs the traceability analyzer to generate statistics and mapping document
 * 3. Provides a comprehensive report on task-code relationships
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const MAPPING_FILE_PATH = path.join(process.cwd(), 'task-code-mapping.md');
const TASK_AUTOMAPPER_PATH = path.join(process.cwd(), 'scripts', 'task-management', 'task-code-automapper.js');
const TASK_TRACEABILITY_PATH = path.join(process.cwd(), 'scripts', 'task-management', 'task-traceability.js');
const ANALYSIS_REPORT_PATH = path.join(process.cwd(), 'task-analysis-report.md');

// Command line arguments
const args = process.argv.slice(2);
const shouldSkipAutomap = args.includes('--skip-automap');
const shouldGenerateReport = args.includes('--report');

// Main function
async function runFullTaskAnalysis() {
  console.log('🔍 Starting Full Task Analysis...');
  
  try {
    // Step 1: Run task-code automapper (unless skipped)
    if (!shouldSkipAutomap) {
      console.log('\n📊 Running Task-Code Automapper...');
      execSync(`node ${TASK_AUTOMAPPER_PATH}`, { stdio: 'inherit' });
    } else {
      console.log('\n⏩ Skipping Task-Code Automapper (--skip-automap flag detected)');
    }
    
    // Step 2: Run traceability analyzer
    console.log('\n📈 Running Task Traceability Analyzer...');
    execSync(`node ${TASK_TRACEABILITY_PATH}`, { stdio: 'inherit' });
    
    // Step 3: Generate comprehensive report if requested
    if (shouldGenerateReport) {
      console.log('\n📝 Generating Comprehensive Analysis Report...');
      generateComprehensiveReport();
    }
    
    console.log('\n✅ Full Task Analysis Complete!');
    console.log(`- Task file updated: ${TASK_FILE_PATH}`);
    console.log(`- Mapping document generated: ${MAPPING_FILE_PATH}`);
    if (shouldGenerateReport) {
      console.log(`- Analysis report generated: ${ANALYSIS_REPORT_PATH}`);
    }
    
  } catch (error) {
    console.error('Error running full task analysis:', error.message);
    process.exit(1);
  }
}

// Generate a comprehensive report combining data from both tools
function generateComprehensiveReport() {
  try {
    // Read the task file
    const taskContent = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    
    // Read the mapping file
    const mappingContent = fs.readFileSync(MAPPING_FILE_PATH, 'utf8');
    
    // Extract statistics from the mapping file
    const stats = extractStatsFromMapping(mappingContent);
    
    // Count tasks by status
    const taskStatusCount = countTasksByStatus(taskContent);
    
    // Count tasks by prefix
    const taskPrefixCount = countTasksByPrefix(taskContent);
    
    // Count files by type
    const fileTypeCount = countFilesByType(mappingContent);
    
    // Generate the report
    const report = `# AeroSuite Task-Code Analysis Report

*Generated on ${new Date().toISOString().split('T')[0]}*

## Overview

This report provides a comprehensive analysis of the relationship between tasks and code in the AeroSuite project.

## Task Statistics

### Tasks by Status

| Status | Count | Percentage |
|--------|-------|------------|
${Object.entries(taskStatusCount)
  .map(([status, count]) => {
    const percentage = ((count / stats.totalTasks) * 100).toFixed(2);
    return `| ${status} | ${count} | ${percentage}% |`;
  })
  .join('\n')}
| **Total** | **${stats.totalTasks}** | **100%** |

### Tasks by Type

| Type | Count | Percentage |
|------|-------|------------|
${Object.entries(taskPrefixCount)
  .map(([prefix, count]) => {
    const percentage = ((count / stats.totalTasks) * 100).toFixed(2);
    return `| ${prefix} | ${count} | ${percentage}% |`;
  })
  .join('\n')}
| **Total** | **${stats.totalTasks}** | **100%** |

## Code Statistics

### Files by Type

| Extension | Count | Percentage |
|-----------|-------|------------|
${Object.entries(fileTypeCount)
  .map(([ext, count]) => {
    const percentage = ((count / stats.totalFiles) * 100).toFixed(2);
    return `| ${ext} | ${count} | ${percentage}% |`;
  })
  .join('\n')}
| **Total** | **${stats.totalFiles}** | **100%** |

## Traceability Statistics

- **Total Tasks**: ${stats.totalTasks}
- **Tasks with Code References**: ${stats.tasksWithReferences}
- **Traceability Coverage**: ${stats.coveragePercentage}%
- **Total Code Files**: ${stats.totalFiles}
- **Files with Task References**: ${stats.filesWithReferences}
- **File Coverage**: ${((stats.filesWithReferences / stats.totalFiles) * 100).toFixed(2)}%

## Tasks by Lines of Code

| LOC Range | Task Count | Percentage |
|-----------|------------|------------|
| 1-100 | ${stats.tasksByLoc['1-100'] || 0} | ${((stats.tasksByLoc['1-100'] || 0) / stats.totalTasks * 100).toFixed(2)}% |
| 101-500 | ${stats.tasksByLoc['101-500'] || 0} | ${((stats.tasksByLoc['101-500'] || 0) / stats.totalTasks * 100).toFixed(2)}% |
| 501-1000 | ${stats.tasksByLoc['501-1000'] || 0} | ${((stats.tasksByLoc['501-1000'] || 0) / stats.totalTasks * 100).toFixed(2)}% |
| 1001+ | ${stats.tasksByLoc['1001+'] || 0} | ${((stats.tasksByLoc['1001+'] || 0) / stats.totalTasks * 100).toFixed(2)}% |

## Recommendations

Based on the analysis, here are some recommendations for improving task-code traceability:

${generateRecommendations(stats)}

## Next Steps

1. Review newly created tasks and adjust priorities/statuses as needed
2. Add task references to files that don't have them
3. Run this analysis periodically to maintain high traceability coverage

`;
    
    // Write the report to a file
    fs.writeFileSync(ANALYSIS_REPORT_PATH, report, 'utf8');
    
  } catch (error) {
    console.error('Error generating comprehensive report:', error.message);
  }
}

// Extract statistics from the mapping document
function extractStatsFromMapping(mappingContent) {
  const stats = {
    totalTasks: 0,
    tasksWithReferences: 0,
    coveragePercentage: 0,
    totalFiles: 0,
    filesWithReferences: 0,
    tasksByLoc: {
      '1-100': 0,
      '101-500': 0,
      '501-1000': 0,
      '1001+': 0
    }
  };
  
  // Extract total tasks
  const totalTasksMatch = mappingContent.match(/Total tasks: (\d+)/);
  if (totalTasksMatch) {
    stats.totalTasks = parseInt(totalTasksMatch[1]);
  }
  
  // Extract tasks with references
  const tasksWithRefsMatch = mappingContent.match(/Tasks with code references: (\d+)/);
  if (tasksWithRefsMatch) {
    stats.tasksWithReferences = parseInt(tasksWithRefsMatch[1]);
  }
  
  // Calculate coverage percentage
  if (stats.totalTasks > 0) {
    stats.coveragePercentage = ((stats.tasksWithReferences / stats.totalTasks) * 100).toFixed(2);
  }
  
  // Count files
  const fileMatches = mappingContent.match(/`[^`]+`/g);
  if (fileMatches) {
    const uniqueFiles = new Set(fileMatches.map(m => m.replace(/`/g, '')));
    stats.totalFiles = uniqueFiles.size;
  }
  
  // Count files with references
  const filesWithRefsMatch = mappingContent.match(/Files without task references: (\d+)/);
  if (filesWithRefsMatch && stats.totalFiles) {
    const filesWithoutRefs = parseInt(filesWithRefsMatch[1]);
    stats.filesWithReferences = Math.max(0, stats.totalFiles - filesWithoutRefs);
  } else {
    // Fallback if we can't extract from mapping
    stats.filesWithReferences = stats.totalFiles > 0 ? 
      Math.min(stats.totalFiles, stats.tasksWithReferences) : 0;
  }
  
  // Count tasks by LOC
  const taskLines = mappingContent.match(/\| [A-Z]+\d{3} \|[^|]+\|[^|]+\|[^|]+\|[^|]+\| (\d+) \|/g);
  if (taskLines) {
    taskLines.forEach(line => {
      const locMatch = line.match(/\| (\d+) \|$/);
      if (locMatch) {
        const loc = parseInt(locMatch[1]);
        if (loc <= 100) {
          stats.tasksByLoc['1-100']++;
        } else if (loc <= 500) {
          stats.tasksByLoc['101-500']++;
        } else if (loc <= 1000) {
          stats.tasksByLoc['501-1000']++;
        } else {
          stats.tasksByLoc['1001+']++;
        }
      }
    });
  }
  
  return stats;
}

// Count tasks by status
function countTasksByStatus(taskContent) {
  const statuses = {};
  
  // Find all status emojis and count them
  const statusRegex = /\| [A-Z]+\d{3} \|[^|]+\| ([\p{Emoji}\s-]+[^\|]*) \|/gu;
  let match;
  
  while ((match = statusRegex.exec(taskContent)) !== null) {
    const fullStatus = match[1].trim();
    const emoji = fullStatus.split(' ')[0];
    
    if (!statuses[emoji]) {
      statuses[emoji] = 0;
    }
    
    statuses[emoji]++;
  }
  
  // Map emoji to readable status
  const readableStatuses = {
    '✅': 'Completed',
    '🔄': 'In Progress',
    '🔍': 'In Review',
    '🧪': 'Testing',
    '📝': 'Documentation',
    '⚠️': 'Blocked',
    '⬜': 'Todo'
  };
  
  const result = {};
  for (const [emoji, count] of Object.entries(statuses)) {
    const readableStatus = readableStatuses[emoji] || emoji;
    result[readableStatus] = count;
  }
  
  return result;
}

// Count tasks by prefix
function countTasksByPrefix(taskContent) {
  const prefixCounts = {
    'TS': 0,
    'SEC': 0,
    'AI': 0,
    'PERF': 0,
    'DEV': 0
  };
  
  // Find all task IDs and count by prefix
  const taskIdRegex = /\| ((?:TS|SEC|AI|PERF|DEV)\d{3}) \|/g;
  let match;
  
  while ((match = taskIdRegex.exec(taskContent)) !== null) {
    const taskId = match[1];
    const prefix = taskId.match(/^[A-Z]+/)[0];
    
    if (prefixCounts[prefix] !== undefined) {
      prefixCounts[prefix]++;
    }
  }
  
  return prefixCounts;
}

// Count files by extension
function countFilesByType(mappingContent) {
  const fileExtCounts = {};
  
  // Find all file paths
  const fileRegex = /`([^`]+)`/g;
  let match;
  
  while ((match = fileRegex.exec(mappingContent)) !== null) {
    const filePath = match[1];
    const ext = path.extname(filePath);
    
    if (!fileExtCounts[ext]) {
      fileExtCounts[ext] = 0;
    }
    
    fileExtCounts[ext]++;
  }
  
  // Sort by count descending
  const sortedEntries = Object.entries(fileExtCounts)
    .sort((a, b) => b[1] - a[1]);
  
  return Object.fromEntries(sortedEntries);
}

// Generate recommendations based on statistics
function generateRecommendations(stats) {
  const recommendations = [];
  
  // Check coverage percentage
  if (stats.coveragePercentage < 50) {
    recommendations.push('**Improve Traceability Coverage**: The project has less than 50% traceability coverage. Focus on adding task references to existing files.');
  }
  
  // Check file coverage
  const fileCoverage = (stats.filesWithReferences / stats.totalFiles) * 100;
  if (fileCoverage < 50) {
    recommendations.push('**Add File References**: Less than half of code files have task references. Use the task reference adder tool to add references to more files.');
  }
  
  // Check for tasks with high LOC
  if (stats.tasksByLoc['1001+'] > 0) {
    recommendations.push('**Break Down Large Tasks**: There are tasks with over 1000 lines of code. Consider breaking these into smaller, more focused tasks.');
  }
  
  // If we have good coverage
  if (stats.coveragePercentage > 80) {
    recommendations.push('**Maintain High Coverage**: The project has good traceability coverage. Continue to enforce task references in new code.');
  }
  
  // Default recommendation if no specific issues
  if (recommendations.length === 0) {
    recommendations.push('**Continue Current Practices**: Overall traceability is at a good level. Keep using the task automapper periodically to maintain this.');
  }
  
  return recommendations.join('\n\n');
}

// Run the main function
runFullTaskAnalysis(); 