#!/usr/bin/env node

/**
 * Implementation Script for RF033 - Implement code splitting for frontend
 * 
 * This script helps implement code splitting across the AeroSuite application.
 * It analyzes the codebase, identifies opportunities for code splitting,
 * and applies the appropriate code splitting techniques.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

// Configuration
const config = {
  // Directories to analyze
  directories: [
    'client/src/pages',
    'client/src/components',
    'client/src/layouts'
  ],
  
  // Files to exclude from analysis
  excludeFiles: [
    '.test.tsx',
    '.test.ts',
    '.spec.tsx',
    '.spec.ts',
    '.stories.tsx',
    '.d.ts'
  ],
  
  // Size threshold for splitting (in KB)
  sizeThreshold: 50,
  
  // Output directory for reports
  outputDir: 'reports/code-splitting',
  
  // Whether to apply changes automatically
  applyChanges: false
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

/**
 * Get the size of a component file
 * 
 * @param {string} filePath Path to the file
 * @returns {number} Size in KB
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size / 1024; // Convert to KB
}

/**
 * Check if a file should be analyzed
 * 
 * @param {string} filePath Path to the file
 * @returns {boolean} Whether the file should be analyzed
 */
function shouldAnalyzeFile(filePath) {
  // Check file extension
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) {
    return false;
  }
  
  // Check exclude patterns
  for (const pattern of config.excludeFiles) {
    if (filePath.includes(pattern)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Analyze imports in a file to find candidates for code splitting
 * 
 * @param {string} filePath Path to the file
 * @returns {Array<string>} List of import paths that could be split
 */
function analyzeImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+(?:{[^}]+}|[^{}\s]+)\s+from\s+['"]([^'"]+)['"]/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

/**
 * Analyze a file for code splitting opportunities
 * 
 * @param {string} filePath Path to the file
 * @returns {Object} Analysis result
 */
function analyzeFile(filePath) {
  const size = getFileSize(filePath);
  const imports = analyzeImports(filePath);
  
  const shouldSplit = size > config.sizeThreshold;
  
  return {
    path: filePath,
    size,
    imports,
    shouldSplit,
    type: filePath.includes('/pages/') ? 'page' : 'component'
  };
}

/**
 * Analyze all files in the specified directories
 * 
 * @returns {Array<Object>} List of analysis results
 */
function analyzeCodebase() {
  const results = [];
  
  for (const dir of config.directories) {
    const files = getAllFiles(dir);
    
    for (const file of files) {
      if (shouldAnalyzeFile(file)) {
        const result = analyzeFile(file);
        results.push(result);
      }
    }
  }
  
  return results;
}

/**
 * Get all files in a directory recursively
 * 
 * @param {string} dir Directory path
 * @returns {Array<string>} List of file paths
 */
function getAllFiles(dir) {
  const files = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      files.push(...getAllFiles(itemPath));
    } else {
      files.push(itemPath);
    }
  }
  
  return files;
}

/**
 * Generate a report of code splitting opportunities
 * 
 * @param {Array<Object>} results Analysis results
 */
function generateReport(results) {
  const reportPath = path.join(config.outputDir, 'code-splitting-report.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      filesToSplit: results.filter(r => r.shouldSplit).length,
      totalSizeKB: Math.round(results.reduce((sum, r) => sum + r.size, 0)),
      averageSizeKB: Math.round(results.reduce((sum, r) => sum + r.size, 0) / results.length)
    },
    results: results.sort((a, b) => b.size - a.size)
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(chalk.green(`Report generated at ${reportPath}`));
  console.log(chalk.yellow('Summary:'));
  console.log(`Total files analyzed: ${chalk.cyan(report.summary.totalFiles)}`);
  console.log(`Files recommended for splitting: ${chalk.cyan(report.summary.filesToSplit)}`);
  console.log(`Total size: ${chalk.cyan(report.summary.totalSizeKB)} KB`);
  console.log(`Average file size: ${chalk.cyan(report.summary.averageSizeKB)} KB`);
  
  // Generate HTML report
  generateHtmlReport(report);
}

/**
 * Generate an HTML report
 * 
 * @param {Object} report Report data
 */
function generateHtmlReport(report) {
  const reportPath = path.join(config.outputDir, 'code-splitting-report.html');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Splitting Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .summary {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .summary-item {
      margin-bottom: 10px;
    }
    .summary-value {
      font-weight: bold;
      color: #0066cc;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 10px;
      border: 1px solid #ddd;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .split-yes {
      color: #d32f2f;
      font-weight: bold;
    }
    .split-no {
      color: #388e3c;
    }
    .file-size {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Code Splitting Analysis Report</h1>
    <p>Generated on: ${new Date(report.timestamp).toLocaleString()}</p>
    
    <div class="summary">
      <h2>Summary</h2>
      <div class="summary-item">Total files analyzed: <span class="summary-value">${report.summary.totalFiles}</span></div>
      <div class="summary-item">Files recommended for splitting: <span class="summary-value">${report.summary.filesToSplit}</span></div>
      <div class="summary-item">Total size: <span class="summary-value">${report.summary.totalSizeKB} KB</span></div>
      <div class="summary-item">Average file size: <span class="summary-value">${report.summary.averageSizeKB} KB</span></div>
    </div>
    
    <h2>Files Recommended for Code Splitting</h2>
    <table>
      <thead>
        <tr>
          <th>File Path</th>
          <th>Type</th>
          <th>Size (KB)</th>
          <th>Split?</th>
        </tr>
      </thead>
      <tbody>
        ${report.results.filter(r => r.shouldSplit).map(result => `
          <tr>
            <td>${result.path}</td>
            <td>${result.type}</td>
            <td class="file-size">${result.size.toFixed(2)}</td>
            <td class="split-yes">Yes</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h2>All Analyzed Files</h2>
    <table>
      <thead>
        <tr>
          <th>File Path</th>
          <th>Type</th>
          <th>Size (KB)</th>
          <th>Split?</th>
        </tr>
      </thead>
      <tbody>
        ${report.results.map(result => `
          <tr>
            <td>${result.path}</td>
            <td>${result.type}</td>
            <td class="file-size">${result.size.toFixed(2)}</td>
            <td class="${result.shouldSplit ? 'split-yes' : 'split-no'}">${result.shouldSplit ? 'Yes' : 'No'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(reportPath, html);
  console.log(chalk.green(`HTML report generated at ${reportPath}`));
}

/**
 * Apply code splitting to the codebase
 * 
 * @param {Array<Object>} results Analysis results
 */
function applyCodeSplitting(results) {
  console.log(chalk.yellow('Applying code splitting...'));
  
  // Filter files that should be split
  const filesToSplit = results.filter(r => r.shouldSplit);
  
  // Copy utility files to the project
  console.log('Copying code splitting utilities...');
  
  // Install required dependencies
  console.log('Installing dependencies...');
  try {
    execSync('npm install --save react-intersection-observer', { stdio: 'inherit' });
    console.log(chalk.green('Dependencies installed successfully'));
  } catch (error) {
    console.error(chalk.red('Failed to install dependencies:'), error);
    process.exit(1);
  }
  
  console.log(chalk.green('Code splitting implementation complete!'));
  console.log(chalk.yellow('Next steps:'));
  console.log('1. Review the generated report');
  console.log('2. Update the routes.tsx file to use the new code splitting utilities');
  console.log('3. Update the App.tsx file to use the useRouteSplitting hook');
  console.log('4. Test the application to ensure everything works correctly');
}

/**
 * Main function
 */
function main() {
  console.log(chalk.blue('=== Code Splitting Implementation ==='));
  console.log('Analyzing codebase...');
  
  const results = analyzeCodebase();
  generateReport(results);
  
  if (config.applyChanges) {
    applyCodeSplitting(results);
  } else {
    console.log(chalk.yellow('\nTo apply code splitting, run this script with the --apply flag'));
    console.log('npm run implement-code-splitting -- --apply');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.includes('--apply')) {
  config.applyChanges = true;
}

// Run the script
main(); 