#!/usr/bin/env node

/**
 * Load Test Comparison Script
 * 
 * This script compares results from multiple load tests to evaluate 
 * the effectiveness of horizontal scaling implemented in TS350.
 * 
 * Usage:
 *   node compare-tests.js --files=test1.json,test2.json [--output=html] [--out-file=report.html]
 * 
 * Task: TS354 - Load testing implementation
 */

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const chalk = require('chalk');
const { 
  comparePerformance, 
  printComparisonReport, 
  saveComparisonReport,
  generateHtmlReport
} = require('./utils/perf-compare');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('files', {
    alias: 'f',
    description: 'Comma-separated list of test result files to compare',
    type: 'string',
    demandOption: true
  })
  .option('output', {
    alias: 'o',
    description: 'Output format (console, json, html)',
    type: 'string',
    default: 'console'
  })
  .option('out-file', {
    description: 'Output file path for HTML or JSON reports',
    type: 'string'
  })
  .option('title', {
    alias: 't',
    description: 'Report title',
    type: 'string',
    default: 'Load Test Comparison'
  })
  .help()
  .alias('help', 'h')
  .argv;

/**
 * Main function to run the comparison
 */
async function compareTests() {
  try {
    console.log(chalk.blue('=== AeroSuite Load Test Comparison ==='));
    
    // Parse file paths
    const filePaths = argv.files.split(',').map(f => f.trim());
    
    if (filePaths.length < 2) {
      console.error(chalk.red('Error: At least two test result files are required for comparison'));
      process.exit(1);
    }
    
    // Validate files exist
    filePaths.forEach(filePath => {
      if (!fs.existsSync(filePath)) {
        console.error(chalk.red(`Error: File not found: ${filePath}`));
        process.exit(1);
      }
    });
    
    console.log(chalk.blue(`Comparing ${filePaths.length} test results:`));
    filePaths.forEach(filePath => {
      console.log(chalk.blue(`- ${filePath}`));
    });
    
    // Run comparison
    const comparisonOptions = {
      title: argv.title
    };
    
    const report = comparePerformance(filePaths, comparisonOptions);
    
    // Output based on format
    switch (argv.output.toLowerCase()) {
      case 'json':
        const jsonPath = argv['out-file'] || path.join(__dirname, 'reports', `comparison-${Date.now()}.json`);
        saveComparisonReport(report, jsonPath);
        break;
        
      case 'html':
        const htmlPath = argv['out-file'] || path.join(__dirname, 'reports', `comparison-${Date.now()}.html`);
        generateHtmlReport(report, htmlPath);
        break;
        
      case 'console':
      default:
        printComparisonReport(report);
        break;
    }
    
    // Summary for scaling efficiency
    const efficiency = report.scalingEfficiency.efficiency;
    if (efficiency >= 80) {
      console.log(chalk.green('\n✅ Horizontal scaling is performing well with an efficiency of ' + efficiency + '%'));
    } else if (efficiency >= 60) {
      console.log(chalk.yellow('\n⚠️ Horizontal scaling is performing adequately with an efficiency of ' + efficiency + '%'));
      console.log(chalk.yellow('   Some optimization may be beneficial.'));
    } else {
      console.log(chalk.red('\n❌ Horizontal scaling is performing poorly with an efficiency of ' + efficiency + '%'));
      console.log(chalk.red('   Significant optimization is recommended.'));
    }
    
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the comparison
compareTests().catch(err => {
  console.error(chalk.red(`Comparison failed: ${err.message}`));
  process.exit(1);
}); 