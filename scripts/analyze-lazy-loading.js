#!/usr/bin/env node

/**
 * Lazy Loading Analysis Script
 * 
 * This script analyzes the codebase for lazy loading opportunities
 * and generates a report with recommendations.
 * 
 * Implementation of RF034 - Add lazy loading for routes and components
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

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
  
  // Output directory for reports
  outputDir: 'reports/lazy-loading',
  
  // Size thresholds for recommendations (in KB)
  sizeThresholds: {
    image: 50,      // Images larger than this should be lazy loaded
    component: 30,  // Components larger than this should be lazy loaded
    route: 100      // Routes larger than this should be split into smaller chunks
  }
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

/**
 * Get the size of a file
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
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.jsx') && !filePath.endsWith('.js')) {
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
 * Analyze a file for lazy loading opportunities
 * 
 * @param {string} filePath Path to the file
 * @returns {Object} Analysis result
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const size = getFileSize(filePath);
  
  // Determine file type
  let type = 'unknown';
  if (filePath.includes('/pages/')) {
    type = 'page';
  } else if (filePath.includes('/components/')) {
    type = 'component';
  } else if (filePath.includes('/layouts/')) {
    type = 'layout';
  }
  
  // Check if the file contains image imports
  const imageImports = content.match(/import\s+.*\s+from\s+['"].*\.(png|jpg|jpeg|gif|svg)['"]/g) || [];
  
  // Check if the file contains heavy component imports
  const componentImports = content.match(/import\s+(?:{[^}]+}|[^{}\s]+)\s+from\s+['"]([^'"]+)['"]/g) || [];
  
  // Check if the file already uses lazy loading
  const usesLazyLoading = 
    content.includes('React.lazy') || 
    content.includes('lazy(') || 
    content.includes('import(') ||
    content.includes('lazyRoute(') ||
    content.includes('createLazyComponent(') ||
    content.includes('LazyLoadedComponent') ||
    content.includes('useVisibilityLazyLoad');
  
  // Determine if the file should be lazy loaded
  let shouldLazyLoad = false;
  let lazyLoadType = [];
  
  if (type === 'page' && size > config.sizeThresholds.route) {
    shouldLazyLoad = true;
    lazyLoadType.push('route');
  }
  
  if (type === 'component' && size > config.sizeThresholds.component) {
    shouldLazyLoad = true;
    lazyLoadType.push('component');
  }
  
  if (imageImports.length > 0) {
    shouldLazyLoad = true;
    lazyLoadType.push('image');
  }
  
  return {
    path: filePath,
    type,
    size,
    imageImports: imageImports.length,
    componentImports: componentImports.length,
    usesLazyLoading,
    shouldLazyLoad,
    lazyLoadType,
    recommendation: shouldLazyLoad && !usesLazyLoading ? 'Implement lazy loading' : 'No action needed'
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
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return [];
  }
  
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
 * Generate a report of lazy loading opportunities
 * 
 * @param {Array<Object>} results Analysis results
 */
function generateReport(results) {
  const reportPath = path.join(config.outputDir, 'lazy-loading-report.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      filesToLazyLoad: results.filter(r => r.shouldLazyLoad && !r.usesLazyLoading).length,
      alreadyLazyLoaded: results.filter(r => r.usesLazyLoading).length,
      totalSizeKB: Math.round(results.reduce((sum, r) => sum + r.size, 0)),
      potentialSavingsKB: Math.round(
        results
          .filter(r => r.shouldLazyLoad && !r.usesLazyLoading)
          .reduce((sum, r) => sum + r.size, 0)
      )
    },
    recommendations: {
      routes: results
        .filter(r => r.type === 'page' && r.shouldLazyLoad && !r.usesLazyLoading)
        .sort((a, b) => b.size - a.size),
      components: results
        .filter(r => r.type === 'component' && r.shouldLazyLoad && !r.usesLazyLoading)
        .sort((a, b) => b.size - a.size),
      images: results
        .filter(r => r.imageImports > 0 && !r.usesLazyLoading)
        .sort((a, b) => b.imageImports - a.imageImports)
    },
    results: results.sort((a, b) => b.size - a.size)
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(chalk.green(`Report generated at ${reportPath}`));
  console.log(chalk.yellow('Summary:'));
  console.log(`Total files analyzed: ${chalk.cyan(report.summary.totalFiles)}`);
  console.log(`Files recommended for lazy loading: ${chalk.cyan(report.summary.filesToLazyLoad)}`);
  console.log(`Files already using lazy loading: ${chalk.cyan(report.summary.alreadyLazyLoaded)}`);
  console.log(`Total size: ${chalk.cyan(report.summary.totalSizeKB)} KB`);
  console.log(`Potential savings: ${chalk.cyan(report.summary.potentialSavingsKB)} KB`);
  
  // Generate HTML report
  generateHtmlReport(report);
}

/**
 * Generate an HTML report
 * 
 * @param {Object} report Report data
 */
function generateHtmlReport(report) {
  const reportPath = path.join(config.outputDir, 'lazy-loading-report.html');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lazy Loading Analysis Report</title>
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
    .action-needed {
      color: #d32f2f;
      font-weight: bold;
    }
    .no-action {
      color: #388e3c;
    }
    .file-size {
      text-align: right;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      margin-right: 5px;
    }
    .badge-route {
      background-color: #bbdefb;
      color: #0d47a1;
    }
    .badge-component {
      background-color: #c8e6c9;
      color: #1b5e20;
    }
    .badge-image {
      background-color: #ffecb3;
      color: #ff6f00;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Lazy Loading Analysis Report</h1>
    <p>Generated on: ${new Date(report.timestamp).toLocaleString()}</p>
    
    <div class="summary">
      <h2>Summary</h2>
      <div class="summary-item">Total files analyzed: <span class="summary-value">${report.summary.totalFiles}</span></div>
      <div class="summary-item">Files recommended for lazy loading: <span class="summary-value">${report.summary.filesToLazyLoad}</span></div>
      <div class="summary-item">Files already using lazy loading: <span class="summary-value">${report.summary.alreadyLazyLoaded}</span></div>
      <div class="summary-item">Total size: <span class="summary-value">${report.summary.totalSizeKB} KB</span></div>
      <div class="summary-item">Potential savings: <span class="summary-value">${report.summary.potentialSavingsKB} KB</span></div>
    </div>
    
    <h2>Route Lazy Loading Recommendations</h2>
    <table>
      <thead>
        <tr>
          <th>File Path</th>
          <th>Size (KB)</th>
          <th>Type</th>
          <th>Recommendation</th>
        </tr>
      </thead>
      <tbody>
        ${report.recommendations.routes.map(result => `
          <tr>
            <td>${result.path}</td>
            <td class="file-size">${result.size.toFixed(2)}</td>
            <td>
              ${result.lazyLoadType.map(type => `
                <span class="badge badge-${type}">${type}</span>
              `).join('')}
            </td>
            <td class="action-needed">${result.recommendation}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h2>Component Lazy Loading Recommendations</h2>
    <table>
      <thead>
        <tr>
          <th>File Path</th>
          <th>Size (KB)</th>
          <th>Type</th>
          <th>Recommendation</th>
        </tr>
      </thead>
      <tbody>
        ${report.recommendations.components.map(result => `
          <tr>
            <td>${result.path}</td>
            <td class="file-size">${result.size.toFixed(2)}</td>
            <td>
              ${result.lazyLoadType.map(type => `
                <span class="badge badge-${type}">${type}</span>
              `).join('')}
            </td>
            <td class="action-needed">${result.recommendation}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h2>Image Lazy Loading Recommendations</h2>
    <table>
      <thead>
        <tr>
          <th>File Path</th>
          <th>Image Imports</th>
          <th>Size (KB)</th>
          <th>Recommendation</th>
        </tr>
      </thead>
      <tbody>
        ${report.recommendations.images.map(result => `
          <tr>
            <td>${result.path}</td>
            <td>${result.imageImports}</td>
            <td class="file-size">${result.size.toFixed(2)}</td>
            <td class="action-needed">${result.recommendation}</td>
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
          <th>Uses Lazy Loading</th>
          <th>Recommendation</th>
        </tr>
      </thead>
      <tbody>
        ${report.results.map(result => `
          <tr>
            <td>${result.path}</td>
            <td>${result.type}</td>
            <td class="file-size">${result.size.toFixed(2)}</td>
            <td>${result.usesLazyLoading ? 'Yes' : 'No'}</td>
            <td class="${result.shouldLazyLoad && !result.usesLazyLoading ? 'action-needed' : 'no-action'}">${result.recommendation}</td>
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
 * Main function
 */
function main() {
  console.log(chalk.blue('=== Lazy Loading Analysis ==='));
  console.log('Analyzing codebase...');
  
  const results = analyzeCodebase();
  generateReport(results);
  
  console.log(chalk.yellow('\nNext steps:'));
  console.log('1. Review the generated report');
  console.log('2. Implement lazy loading for recommended files');
  console.log('3. Verify performance improvements');
}

// Run the script
main(); 