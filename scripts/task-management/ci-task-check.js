#!/usr/bin/env node

/**
 * CI Task Traceability Check for AeroSuite
 * 
 * This script:
 * 1. Analyzes task-code traceability
 * 2. Enforces minimum traceability coverage thresholds
 * 3. Exits with non-zero code if thresholds are not met
 * 
 * Designed to be used in CI/CD pipelines to enforce task references
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MAPPING_FILE_PATH = path.join(process.cwd(), 'task-code-mapping.md');
const TASK_TRACEABILITY_PATH = path.join(process.cwd(), 'scripts', 'task-management', 'task-traceability.js');

// Default thresholds
let minCompletedTaskCoverage = 80; // 80% of completed tasks must have code references
let minFileCoverage = 50;          // 50% of code files must have task references

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--min-task-coverage' && i + 1 < args.length) {
    minCompletedTaskCoverage = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--min-file-coverage' && i + 1 < args.length) {
    minFileCoverage = parseInt(args[i + 1]);
    i++;
  }
}

// Main function
async function runCITaskCheck() {
  console.log('🔍 Running CI Task Traceability Check...');
  console.log(`Minimum completed task coverage: ${minCompletedTaskCoverage}%`);
  console.log(`Minimum file coverage: ${minFileCoverage}%`);
  
  try {
    // Run traceability analyzer
    execSync(`node ${TASK_TRACEABILITY_PATH}`, { stdio: 'inherit' });
    
    // Read the mapping file
    if (!fs.existsSync(MAPPING_FILE_PATH)) {
      console.error('Error: Mapping file not found. Task traceability analysis failed.');
      process.exit(1);
    }
    
    const mappingContent = fs.readFileSync(MAPPING_FILE_PATH, 'utf8');
    
    // Extract statistics
    const stats = extractStats(mappingContent);
    
    // Check if we meet thresholds
    const completedTaskCoverageOk = stats.completedTaskCoverage >= minCompletedTaskCoverage;
    const fileCoverageOk = stats.fileCoverage >= minFileCoverage;
    
    // Report results
    console.log('\n📊 Task Traceability Check Results:');
    console.log(`- Completed task coverage: ${stats.completedTaskCoverage.toFixed(2)}% (${completedTaskCoverageOk ? '✅' : '❌'})`);
    console.log(`- File coverage: ${stats.fileCoverage.toFixed(2)}% (${fileCoverageOk ? '✅' : '❌'})`);
    
    // Exit with appropriate code
    if (completedTaskCoverageOk && fileCoverageOk) {
      console.log('\n✅ All traceability checks passed!');
      process.exit(0);
    } else {
      console.error('\n❌ Traceability checks failed. Please add missing task references.');
      if (!completedTaskCoverageOk) {
        console.error(`- Completed task coverage (${stats.completedTaskCoverage.toFixed(2)}%) is below the minimum (${minCompletedTaskCoverage}%)`);
        console.error(`- ${stats.completedTasksMissingReferences} completed tasks are missing code references`);
      }
      if (!fileCoverageOk) {
        console.error(`- File coverage (${stats.fileCoverage.toFixed(2)}%) is below the minimum (${minFileCoverage}%)`);
        console.error(`- ${stats.filesWithoutReferences} files are missing task references`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running CI task check:', error.message);
    process.exit(1);
  }
}

// Extract statistics from the mapping file
function extractStats(mappingContent) {
  const stats = {
    totalTasks: 0,
    completedTasks: 0,
    tasksWithReferences: 0,
    completedTasksWithReferences: 0,
    completedTasksMissingReferences: 0,
    totalFiles: 0,
    filesWithReferences: 0,
    filesWithoutReferences: 0,
    completedTaskCoverage: 0,
    fileCoverage: 0
  };
  
  // Extract basic counts from summary section
  const totalTasksMatch = mappingContent.match(/Total tasks: (\d+)/);
  if (totalTasksMatch) {
    stats.totalTasks = parseInt(totalTasksMatch[1]);
  }
  
  const tasksWithRefsMatch = mappingContent.match(/Tasks with code references: (\d+)/);
  if (tasksWithRefsMatch) {
    stats.tasksWithReferences = parseInt(tasksWithRefsMatch[1]);
  }
  
  const completedTasksMissingMatch = mappingContent.match(/Completed tasks missing code references: (\d+)/);
  if (completedTasksMissingMatch) {
    stats.completedTasksMissingReferences = parseInt(completedTasksMissingMatch[1]);
  }
  
  const filesWithoutRefsMatch = mappingContent.match(/Files without task references: (\d+)/);
  if (filesWithoutRefsMatch) {
    stats.filesWithoutReferences = parseInt(filesWithoutRefsMatch[1]);
  }
  
  // Count completed tasks by scanning the "Tasks with Code References" section
  const completedTasksWithRefsRegex = /\| TS\d{3} \| .* \| ✅ Completed \|/g;
  let completedWithRefs = 0;
  let match;
  while ((match = completedTasksWithRefsRegex.exec(mappingContent)) !== null) {
    completedWithRefs++;
  }
  stats.completedTasksWithReferences = completedWithRefs;
  
  // Get total completed tasks from both with and without references
  stats.completedTasks = stats.completedTasksWithReferences + stats.completedTasksMissingReferences;
  
  // Calculate coverage
  if (stats.completedTasks > 0) {
    stats.completedTaskCoverage = (stats.completedTasksWithReferences / stats.completedTasks) * 100;
  }
  
  // Count total files (this should work by counting all file paths in backticks)
  const fileMatches = mappingContent.match(/`[^`]+`/g);
  if (fileMatches) {
    const uniqueFiles = new Set(fileMatches.map(m => m.replace(/`/g, '')));
    stats.totalFiles = uniqueFiles.size;
  }
  
  // Calculate files with references by looking at both the summary and the actual files
  stats.filesWithReferences = 0;
  
  // First method: Extract from summary numbers
  if (stats.totalFiles > 0 && stats.filesWithoutReferences > 0) {
    stats.filesWithReferences = Math.max(0, stats.totalFiles - stats.filesWithoutReferences);
  }
  
  // Second method: Count files in "Tasks with Code References" section
  if (stats.filesWithReferences === 0) {
    const filesWithRefsSection = mappingContent.split('## Tasks with Code References')[1]?.split('##')[0];
    if (filesWithRefsSection) {
      const uniqueFiles = new Set();
      // Match all file paths
      const filePathRegex = /`([^`]+)`/g;
      while ((match = filePathRegex.exec(filesWithRefsSection)) !== null) {
        uniqueFiles.add(match[1]);
      }
      stats.filesWithReferences = uniqueFiles.size;
    }
  }
  
  // If we still don't have filesWithReferences, use the Tasks with References count
  // as a conservative estimate
  if (stats.filesWithReferences === 0) {
    stats.filesWithReferences = stats.tasksWithReferences;
  }
  
  // Calculate file coverage
  if (stats.totalFiles > 0) {
    stats.fileCoverage = (stats.filesWithReferences / stats.totalFiles) * 100;
  }
  
  return stats;
}

// Run the main function
runCITaskCheck(); 