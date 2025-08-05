#!/usr/bin/env node

/**
 * Test Report Generator
 * 
 * @task TS357 - Test report generation implementation
 * 
 * This script generates comprehensive test reports based on test results.
 * It uses the TestReportGenerator class to create detailed, interactive reports
 * in various formats with advanced visualizations.
 * 
 * Usage:
 *   node generate-test-report.js [options]
 * 
 * Options:
 *   --format=FORMAT    Output format (html, pdf, json, markdown) (default: html)
 *   --output=PATH      Output directory (default: ./test-reports)
 *   --title=STRING     Report title (default: "AeroSuite Test Report")
 *   --coverage         Include coverage data in the report (default: false)
 *   --history          Include historical test data (default: false)
 *   --compare=PATH     Compare with a previous report
 *   --threshold=NUMBER Fail if coverage is below threshold (0-100)
 *   --tests=PATTERN    Test files to include (glob pattern)
 *   --screenshots      Include screenshots in the report
 *   --timeline         Include timeline visualization (default: true)
 *   --junit            Use JUnit format for test results
 *   --ci               CI mode (no interactive elements)
 *   --help             Show this help message
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const TestReportGenerator = require('../server/src/utils/testReportGenerator');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

// Show help if requested
if (args.help) {
  const helpText = `
Test Report Generator (TS357)

This script generates comprehensive test reports based on test results.

Usage:
  node generate-test-report.js [options]

Options:
  --format=FORMAT    Output format (html, pdf, json, markdown) (default: html)
  --output=PATH      Output directory (default: ./test-reports)
  --title=STRING     Report title (default: "AeroSuite Test Report")
  --coverage         Include coverage data in the report
  --history          Include historical test data
  --compare=PATH     Compare with a previous report
  --threshold=NUMBER Fail if coverage is below threshold (0-100)
  --tests=PATTERN    Test files to include (glob pattern)
  --screenshots      Include screenshots in the report
  --timeline         Include timeline visualization
  --junit            Use JUnit format for test results
  --ci               CI mode (no interactive elements)
  --help             Show this help message

Examples:
  # Generate HTML report
  node generate-test-report.js

  # Generate PDF report with coverage
  node generate-test-report.js --format=pdf --coverage

  # Generate report with custom title
  node generate-test-report.js --title="Sprint 23 Test Report"

  # Generate report with historical data
  node generate-test-report.js --history

  # Compare with previous report
  node generate-test-report.js --compare=./test-reports/latest
`;

  console.log(helpText);
  process.exit(0);
}

// Set default options
const options = {
  format: args.format || 'html',
  output: args.output || './test-reports',
  title: args.title || 'AeroSuite Test Report',
  coverage: !!args.coverage,
  history: !!args.history,
  compare: args.compare,
  threshold: args.threshold ? parseInt(args.threshold, 10) : undefined,
  tests: args.tests,
  screenshots: !!args.screenshots,
  timeline: args.timeline !== undefined ? !!args.timeline : true,
  junit: !!args.junit,
  ci: !!args.ci
};

// Ensure output directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Execute a command and capture output
const executeCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      ...options,
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with exit code ${code}\n${stderr}`));
      }
    });
    
    childProcess.on('error', (error) => {
      reject(error);
    });
  });
};

// Run tests and collect results
const runTests = async () => {
  try {
    const jestArgs = ['test', '--', '--json', '--outputFile=test-results.json'];
    
    if (options.junit) {
      jestArgs.push('--reporters=jest-junit');
    }
    
    if (options.tests) {
      jestArgs.push('--testPathPattern', options.tests);
    }
    
    await executeCommand('npm', jestArgs);
    console.log('✅ Tests completed');
    
    if (!fs.existsSync('test-results.json')) {
      throw new Error('Test results file not found');
    }
    
    return JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
  } catch (error) {
    console.error(`Error running tests: ${error.message}`);
    throw error;
  }
};

// Generate coverage report
const generateCoverage = async () => {
  try {
    await executeCommand('npm', ['run', 'test:coverage']);
    console.log('✅ Coverage report generated');
    
    if (!fs.existsSync('coverage/coverage-summary.json')) {
      throw new Error('Coverage report not found');
    }
    
    return JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
  } catch (error) {
    console.error(`Error generating coverage: ${error.message}`);
    throw error;
  }
};

// Take screenshots of test results (if enabled)
const takeScreenshots = async () => {
  if (!options.screenshots) {
    return [];
  }
  
  try {
    console.log('📸 Taking screenshots...');
    
    // In a real implementation, we would use a tool like Puppeteer to take screenshots
    // For now, we'll just return a placeholder
    
    return [
      {
        name: 'test-results',
        path: 'placeholder.png',
        timestamp: new Date().toISOString()
      }
    ];
  } catch (error) {
    console.error(`Error taking screenshots: ${error.message}`);
    return [];
  }
};

// Main function
const main = async () => {
  try {
    ensureDirectoryExists(options.output);
    
    console.log(`Generating test report (${options.format})...`);
    console.log(`Output directory: ${options.output}`);
    
    // Run tests and collect results
    const testResults = await runTests();
    
    // Generate coverage report if requested
    let coverageData = null;
    if (options.coverage) {
      coverageData = await generateCoverage();
      
      // Check coverage threshold
      if (options.threshold !== undefined) {
        const totalLines = coverageData.total.lines.pct;
        if (totalLines < options.threshold) {
          console.error(`❌ Coverage (${totalLines}%) is below threshold (${options.threshold}%)`);
          process.exit(1);
        }
      }
    }
    
    // Take screenshots if enabled
    const screenshots = await takeScreenshots();
    
    // Create the report generator
    const reportGenerator = new TestReportGenerator({
      format: options.format,
      outputDir: options.output,
      title: options.title,
      includeCoverage: options.coverage,
      includeHistory: options.history,
      compareWith: options.compare,
      threshold: options.threshold,
      includeScreenshots: options.screenshots,
      includeTimeline: options.timeline
    });
    
    // Generate the report
    const reportPath = reportGenerator.generateReport(testResults, coverageData);
    
    // Update historical data if enabled
    if (options.history) {
      reportGenerator.updateHistoricalData({ 
        summary: {
          total: testResults.numTotalTests,
          passed: testResults.numPassedTests,
          failed: testResults.numFailedTests,
          skipped: testResults.numPendingTests
        },
        coverage: coverageData
      });
    }
    
    // Open the report if not in CI mode
    if (!options.ci) {
      const openCommand = process.platform === 'darwin' ? 'open' :
                        process.platform === 'win32' ? 'start' : 'xdg-open';
      spawn(openCommand, [reportPath], { stdio: 'ignore', detached: true });
    }
    
    console.log('✅ Test report generation completed successfully.');
  } catch (error) {
    console.error(`Error generating test report: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main(); 