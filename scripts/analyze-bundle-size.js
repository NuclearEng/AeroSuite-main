#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 * 
 * This script analyzes the bundle size and provides optimization recommendations.
 * It can be run after a production build to identify opportunities for further optimization.
 * 
 * Implementation of RF035 - Optimize bundle size
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');
const filesize = require('filesize');
const gzipSize = require('gzip-size');
const brotliSize = require('brotli-size');

// Configuration
const config = {
  buildDir: path.join(__dirname, '../build'),
  statsFile: path.join(__dirname, '../build/bundle-stats.json'),
  outputDir: path.join(__dirname, '../reports/bundle-analysis'),
  thresholds: {
    js: {
      small: 50 * 1024, // 50KB
      medium: 200 * 1024, // 200KB
      large: 500 * 1024 // 500KB
    },
    css: {
      small: 20 * 1024, // 20KB
      medium: 50 * 1024, // 50KB
      large: 100 * 1024 // 100KB
    }
  },
  // Libraries with known smaller alternatives
  libraryAlternatives: {
    'moment': {
      alternative: 'date-fns',
      savings: '~70%',
      notes: 'Tree-shakable, modular date utility library'
    },
    'lodash': {
      alternative: 'lodash-es or individual imports',
      savings: '~60-90%',
      notes: 'Import only what you need: import get from "lodash/get"'
    },
    'react-bootstrap': {
      alternative: '@mui/material (already in use)',
      savings: '~100%',
      notes: 'Avoid duplicate UI libraries'
    },
    'jquery': {
      alternative: 'Native DOM APIs',
      savings: '~100%',
      notes: 'Modern browsers have good native DOM APIs'
    },
    'chart.js': {
      alternative: 'Specific chart components',
      savings: '~60%',
      notes: 'Import only needed chart types'
    },
    '@mui/icons-material': {
      alternative: 'Individual icon imports',
      savings: '~95%',
      notes: 'Import icons directly: import DeleteIcon from "@mui/icons-material/Delete"'
    }
  }
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

/**
 * Get all JS and CSS files from the build directory
 * 
 * @returns {Array<{file: string, size: number, type: string}>} List of files with sizes
 */
function getBuildFiles() {
  const files = [];
  
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        
        if (ext === '.js' || ext === '.css') {
          const stats = fs.statSync(fullPath);
          files.push({
            file: path.relative(config.buildDir, fullPath),
            size: stats.size,
            type: ext === '.js' ? 'js' : 'css'
          });
        }
      }
    }
  }
  
  scanDir(config.buildDir);
  return files;
}

/**
 * Calculate compressed sizes for a file
 * 
 * @param {string} filePath Path to the file
 * @returns {Object} Object with gzip and brotli sizes
 */
function getCompressedSizes(filePath) {
  const content = fs.readFileSync(filePath);
  
  return {
    gzip: gzipSize.sync(content),
    brotli: brotliSize.sync(content)
  };
}

/**
 * Categorize file by size
 * 
 * @param {Object} file File object with size and type
 * @returns {string} Category (small, medium, large, xlarge)
 */
function categorizeFileSize(file) {
  const thresholds = config.thresholds[file.type];
  
  if (file.size < thresholds.small) {
    return 'small';
  } else if (file.size < thresholds.medium) {
    return 'medium';
  } else if (file.size < thresholds.large) {
    return 'large';
  } else {
    return 'xlarge';
  }
}

/**
 * Get color for size category
 * 
 * @param {string} category Size category
 * @returns {Function} Chalk color function
 */
function getColorForCategory(category) {
  switch (category) {
    case 'small':
      return chalk.green;
    case 'medium':
      return chalk.yellow;
    case 'large':
      return chalk.red;
    case 'xlarge':
      return chalk.bgRed.white;
    default:
      return chalk.white;
  }
}

/**
 * Analyze webpack stats file for module sizes
 * 
 * @returns {Object} Analysis results
 */
function analyzeWebpackStats() {
  let stats;
  
  try {
    if (fs.existsSync(config.statsFile)) {
      stats = JSON.parse(fs.readFileSync(config.statsFile, 'utf8'));
    } else {
      console.warn(chalk.yellow(`Stats file not found at ${config.statsFile}`));
      console.warn(chalk.yellow('Run build with ANALYZE=true to generate stats file'));
      return null;
    }
  } catch (error) {
    console.error(chalk.red(`Error reading stats file: ${error.message}`));
    return null;
  }
  
  // Extract modules from stats
  const modules = [];
  
  function extractModules(chunk) {
    if (!chunk || !chunk.modules) return;
    
    for (const mod of chunk.modules) {
      if (mod.name && mod.size) {
        // Skip webpack runtime modules
        if (mod.name.includes('webpack/runtime')) continue;
        
        modules.push({
          name: mod.name,
          size: mod.size,
          isNodeModule: mod.name.includes('node_modules')
        });
      }
      
      if (mod.modules) {
        extractModules(mod);
      }
    }
  }
  
  if (stats.chunks) {
    for (const chunk of stats.chunks) {
      extractModules(chunk);
    }
  }
  
  // Group modules by package
  const packages = {};
  
  for (const mod of modules) {
    if (mod.isNodeModule) {
      const match = mod.name.match(/node_modules[/\\]((?:@[^/\\]+[/\\])?[^/\\]+)/);
      
      if (match) {
        const packageName = match[1];
        
        if (!packages[packageName]) {
          packages[packageName] = {
            name: packageName,
            size: 0,
            modules: []
          };
        }
        
        packages[packageName].size += mod.size;
        packages[packageName].modules.push(mod);
      }
    }
  }
  
  return {
    modules,
    packages: Object.values(packages).sort((a, b) => b.size - a.size)
  };
}

/**
 * Generate optimization recommendations
 * 
 * @param {Object} analysis Analysis results
 * @returns {Array} Recommendations
 */
function generateRecommendations(analysis) {
  const recommendations = [];
  
  // Check for large packages with known alternatives
  if (analysis && analysis.packages) {
    for (const pkg of analysis.packages) {
      const packageName = pkg.name.split('/')[0]; // Handle scoped packages
      
      if (config.libraryAlternatives[packageName]) {
        const alternative = config.libraryAlternatives[packageName];
        
        recommendations.push({
          type: 'library',
          severity: 'high',
          message: `Replace ${packageName} with ${alternative.alternative} to save ${alternative.savings}`,
          details: alternative.notes,
          size: pkg.size
        });
      }
      
      // Large package recommendations
      if (pkg.size > 500 * 1024) { // 500KB
        recommendations.push({
          type: 'large-package',
          severity: 'high',
          message: `Large package: ${pkg.name} (${filesize(pkg.size)})`,
          details: 'Consider finding a smaller alternative or code splitting',
          size: pkg.size
        });
      } else if (pkg.size > 200 * 1024) { // 200KB
        recommendations.push({
          type: 'large-package',
          severity: 'medium',
          message: `Medium-sized package: ${pkg.name} (${filesize(pkg.size)})`,
          details: 'Consider code splitting or lazy loading',
          size: pkg.size
        });
      }
    }
  }
  
  // Check for large bundles
  const files = getBuildFiles();
  const largeJsFiles = files.filter(file => file.type === 'js' && file.size > config.thresholds.js.large);
  const largeCssFiles = files.filter(file => file.type === 'css' && file.size > config.thresholds.css.large);
  
  for (const file of largeJsFiles) {
    recommendations.push({
      type: 'large-bundle',
      severity: 'high',
      message: `Large JS bundle: ${file.file} (${filesize(file.size)})`,
      details: 'Consider code splitting or lazy loading',
      size: file.size
    });
  }
  
  for (const file of largeCssFiles) {
    recommendations.push({
      type: 'large-bundle',
      severity: 'medium',
      message: `Large CSS bundle: ${file.file} (${filesize(file.size)})`,
      details: 'Consider CSS code splitting or removing unused styles',
      size: file.size
    });
  }
  
  // General recommendations
  recommendations.push({
    type: 'general',
    severity: 'info',
    message: 'Implement tree shaking for all imports',
    details: 'Use ES modules and avoid side effects',
    size: 0
  });
  
  recommendations.push({
    type: 'general',
    severity: 'info',
    message: 'Use dynamic imports for routes and large components',
    details: 'const MyComponent = React.lazy(() => import("./MyComponent"))',
    size: 0
  });
  
  recommendations.push({
    type: 'general',
    severity: 'info',
    message: 'Optimize images using WebP format and proper sizing',
    details: 'Consider using next-gen formats and image CDNs',
    size: 0
  });
  
  return recommendations.sort((a, b) => {
    // Sort by severity first, then by size
    const severityOrder = { high: 0, medium: 1, info: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    
    if (severityDiff !== 0) {
      return severityDiff;
    }
    
    return b.size - a.size;
  });
}

/**
 * Generate HTML report
 * 
 * @param {Object} data Report data
 */
function generateHtmlReport(data) {
  const htmlPath = path.join(config.outputDir, 'bundle-analysis-report.html');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle Size Analysis Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    .summary {
      background-color: #f5f5f5;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
    }
    .size-small {
      color: #2e7d32;
    }
    .size-medium {
      color: #f9a825;
    }
    .size-large {
      color: #c62828;
    }
    .size-xlarge {
      color: #c62828;
      font-weight: bold;
    }
    .severity-high {
      color: #c62828;
      font-weight: bold;
    }
    .severity-medium {
      color: #f9a825;
    }
    .severity-info {
      color: #0066cc;
    }
    .recommendations {
      background-color: #e8f4fd;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .recommendation {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #ddd;
    }
    .recommendation:last-child {
      border-bottom: none;
    }
    .chart-container {
      height: 400px;
      margin-bottom: 30px;
    }
  </style>
</head>
<body>
  <h1>Bundle Size Analysis Report</h1>
  <p>Generated on ${new Date().toLocaleString()}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total JS size: ${filesize(data.totalJsSize)} (${data.jsFiles.length} files)</p>
    <p>Total CSS size: ${filesize(data.totalCssSize)} (${data.cssFiles.length} files)</p>
    <p>Total build size: ${filesize(data.totalSize)}</p>
    <p>Largest JS file: ${data.largestJsFile.file} (${filesize(data.largestJsFile.size)})</p>
    <p>Largest CSS file: ${data.largestCssFile.file} (${filesize(data.largestCssFile.size)})</p>
  </div>
  
  <h2>Recommendations</h2>
  <div class="recommendations">
    ${data.recommendations.map(rec => `
      <div class="recommendation">
        <h3 class="severity-${rec.severity}">${rec.message}</h3>
        <p>${rec.details}</p>
        ${rec.size > 0 ? `<p>Size impact: ${filesize(rec.size)}</p>` : ''}
      </div>
    `).join('')}
  </div>
  
  <h2>JS Files (${data.jsFiles.length})</h2>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Size</th>
        <th>Gzip</th>
        <th>Brotli</th>
        <th>Category</th>
      </tr>
    </thead>
    <tbody>
      ${data.jsFiles.map(file => `
        <tr>
          <td>${file.file}</td>
          <td>${filesize(file.size)}</td>
          <td>${filesize(file.gzip)}</td>
          <td>${filesize(file.brotli)}</td>
          <td class="size-${file.category}">${file.category}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>CSS Files (${data.cssFiles.length})</h2>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Size</th>
        <th>Gzip</th>
        <th>Brotli</th>
        <th>Category</th>
      </tr>
    </thead>
    <tbody>
      ${data.cssFiles.map(file => `
        <tr>
          <td>${file.file}</td>
          <td>${filesize(file.size)}</td>
          <td>${filesize(file.gzip)}</td>
          <td>${filesize(file.brotli)}</td>
          <td class="size-${file.category}">${file.category}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  ${data.packages ? `
  <h2>Largest Packages</h2>
  <table>
    <thead>
      <tr>
        <th>Package</th>
        <th>Size</th>
        <th>Has Alternative</th>
      </tr>
    </thead>
    <tbody>
      ${data.packages.slice(0, 20).map(pkg => `
        <tr>
          <td>${pkg.name}</td>
          <td>${filesize(pkg.size)}</td>
          <td>${config.libraryAlternatives[pkg.name.split('/')[0]] ? 'Yes' : 'No'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
</body>
</html>`;
  
  fs.writeFileSync(htmlPath, html);
  console.log(chalk.green(`HTML report generated at ${htmlPath}`));
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.blue('=== Bundle Size Analysis ==='));
  
  // Check if build directory exists
  if (!fs.existsSync(config.buildDir)) {
    console.error(chalk.red(`Build directory not found at ${config.buildDir}`));
    console.error(chalk.red('Run "npm run build" first'));
    process.exit(1);
  }
  
  console.log('Analyzing build files...');
  
  // Get all build files
  const files = getBuildFiles();
  
  // Add compressed sizes and categorize
  for (const file of files) {
    const fullPath = path.join(config.buildDir, file.file);
    const compressed = getCompressedSizes(fullPath);
    file.gzip = compressed.gzip;
    file.brotli = compressed.brotli;
    file.category = categorizeFileSize(file);
  }
  
  // Split by type
  const jsFiles = files.filter(file => file.type === 'js').sort((a, b) => b.size - a.size);
  const cssFiles = files.filter(file => file.type === 'css').sort((a, b) => b.size - a.size);
  
  // Calculate totals
  const totalJsSize = jsFiles.reduce((total, file) => total + file.size, 0);
  const totalCssSize = cssFiles.reduce((total, file) => total + file.size, 0);
  const totalSize = totalJsSize + totalCssSize;
  
  // Get largest files
  const largestJsFile = jsFiles[0] || { file: 'none', size: 0 };
  const largestCssFile = cssFiles[0] || { file: 'none', size: 0 };
  
  // Analyze webpack stats
  const statsAnalysis = analyzeWebpackStats();
  
  // Generate recommendations
  const recommendations = generateRecommendations({
    files,
    jsFiles,
    cssFiles,
    totalJsSize,
    totalCssSize,
    ...statsAnalysis
  });
  
  // Print summary
  console.log('\nBuild Summary:');
  console.log(`Total JS size: ${chalk.cyan(filesize(totalJsSize))} (${jsFiles.length} files)`);
  console.log(`Total CSS size: ${chalk.cyan(filesize(totalCssSize))} (${cssFiles.length} files)`);
  console.log(`Total build size: ${chalk.cyan(filesize(totalSize))}`);
  console.log(`Largest JS file: ${chalk.cyan(largestJsFile.file)} (${filesize(largestJsFile.size)})`);
  console.log(`Largest CSS file: ${chalk.cyan(largestCssFile.file)} (${filesize(largestCssFile.size)})`);
  
  // Print recommendations
  console.log('\nOptimization Recommendations:');
  
  for (const rec of recommendations) {
    const color = rec.severity === 'high' ? chalk.red : 
                 rec.severity === 'medium' ? chalk.yellow : 
                 chalk.blue;
    
    console.log(color(`- ${rec.message}`));
    console.log(`  ${rec.details}`);
    if (rec.size > 0) {
      console.log(`  Size impact: ${filesize(rec.size)}`);
    }
    console.log('');
  }
  
  // Generate HTML report
  generateHtmlReport({
    jsFiles,
    cssFiles,
    totalJsSize,
    totalCssSize,
    totalSize,
    largestJsFile,
    largestCssFile,
    recommendations,
    packages: statsAnalysis ? statsAnalysis.packages : null
  });
  
  // Print largest packages
  if (statsAnalysis && statsAnalysis.packages) {
    console.log('\nLargest Packages:');
    
    const table = new Table({
      head: ['Package', 'Size', 'Has Alternative'],
      colWidths: [40, 15, 15]
    });
    
    for (const pkg of statsAnalysis.packages.slice(0, 10)) {
      const packageName = pkg.name.split('/')[0]; // Handle scoped packages
      const hasAlternative = config.libraryAlternatives[packageName] ? 'Yes' : 'No';
      
      table.push([
        pkg.name,
        filesize(pkg.size),
        hasAlternative
      ]);
    }
    
    console.log(table.toString());
  }
  
  console.log(chalk.green('\nAnalysis complete!'));
  console.log(`HTML report available at: ${path.join(config.outputDir, 'bundle-analysis-report.html')}`);
}

// Run the script
main().catch(error => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
}); 