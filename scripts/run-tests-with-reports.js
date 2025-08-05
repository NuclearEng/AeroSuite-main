#!/usr/bin/env node

/**
 * Run Tests with Generated Data and Reports
 * 
 * This script combines test data generation, test execution, and report generation
 * into a single workflow for comprehensive testing and reporting.
 * 
 * Usage:
 *   node run-tests-with-reports.js [options]
 * 
 * Options:
 *   --seed=STRING      Seed for reproducible data generation (default: random)
 *   --testPattern=GLOB Test files to run (default: all tests)
 *   --clean            Clean up test database after tests (default: false)
 *   --format=FORMAT    Report format (html, json, markdown) (default: html)
 *   --title=STRING     Report title (default: "AeroSuite Test Report")
 *   --output=PATH      Report output directory (default: ./test-reports)
 *   --no-reports       Skip report generation (default: false)
 *   --threshold=NUMBER Fail if coverage is below threshold (0-100)
 *   --help             Show this help message
 */

const { spawn } = require('child_process');
const path = require('path');

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
Run Tests with Generated Data and Reports

This script combines test data generation, test execution, and report generation
into a single workflow for comprehensive testing and reporting.

Usage:
  node run-tests-with-reports.js [options]

Options:
  --seed=STRING      Seed for reproducible data generation (default: random)
  --testPattern=GLOB Test files to run (default: all tests)
  --clean            Clean up test database after tests (default: false)
  --format=FORMAT    Report format (html, json, markdown) (default: html)
  --title=STRING     Report title (default: "AeroSuite Test Report")
  --output=PATH      Report output directory (default: ./test-reports)
  --no-reports       Skip report generation (default: false)
  --threshold=NUMBER Fail if coverage is below threshold (0-100)
  --ci               CI mode (no interactive elements)
  --help             Show this help message

Examples:
  # Run all tests with random data and generate HTML report
  node run-tests-with-reports.js

  # Run specific tests with consistent data and generate JSON report
  node run-tests-with-reports.js --seed=test-seed-123 --testPattern="**/*.test.js" --format=json

  # Run tests and generate a coverage report with threshold checking
  node run-tests-with-reports.js --threshold=80
`;

  console.log(helpText);
  process.exit(0);
}

// Set default options
const options = {
  seed: args.seed || `test-seed-${Date.now()}`,
  testPattern: args.testPattern || '',
  clean: !!args.clean,
  format: args.format || 'html',
  title: args.title || 'AeroSuite Test Report',
  output: args.output || './test-reports',
  reports: !args['no-reports'],
  threshold: args.threshold ? parseInt(args.threshold, 10) : undefined,
  ci: !!args.ci,
  mongoUri: args['mongo-uri'] || 'mongodb://localhost:27017/aerosuite-test'
};

// Execute a command and capture output
const executeCommand = (command, args, env = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...env }
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    childProcess.on('error', (error) => {
      reject(error);
    });
  });
};

// Main function
const main = async () => {
  try {
    console.log('=== Running Tests with Generated Data and Reports ===');
    console.log(`Seed: ${options.seed}`);
    
    // 1. Generate test data
    console.log('\n=== Step 1: Generating Test Data ===');
    await executeCommand('node', [
      'scripts/generate-test-data.js',
      '--all',
      `--seed=${options.seed}`,
      '--format=mongodb',
      `--mongo-uri=${options.mongoUri}`
    ]);
    
    // 2. Run tests with the generated data
    console.log('\n=== Step 2: Running Tests ===');
    const testArgs = ['scripts/run-tests-with-data.js', `--seed=${options.seed}`];
    
    if (options.testPattern) {
      testArgs.push(`--testPattern=${options.testPattern}`);
    }
    
    if (options.clean) {
      testArgs.push('--clean');
    }
    
    await executeCommand('node', testArgs, {
      MONGODB_URI: options.mongoUri,
      TEST_SEED: options.seed
    });
    
    // 3. Generate test reports if requested
    if (options.reports) {
      console.log('\n=== Step 3: Generating Test Reports ===');
      const reportArgs = [
        'scripts/generate-test-report.js',
        `--format=${options.format}`,
        `--output=${options.output}`,
        `--title=${options.title}`,
        '--coverage'
      ];
      
      if (options.threshold !== undefined) {
        reportArgs.push(`--threshold=${options.threshold}`);
      }
      
      if (options.ci) {
        reportArgs.push('--ci');
      }
      
      await executeCommand('node', reportArgs);
    }
    
    console.log('\n=== All Steps Completed Successfully ===');
  } catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main(); 