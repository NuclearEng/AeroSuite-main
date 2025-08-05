#!/usr/bin/env node

/**
 * AeroSuite Performance Testing System
 * 
 * This script provides a comprehensive performance testing suite for AeroSuite.
 * It can run different types of performance tests:
 * - API endpoint performance testing
 * - Frontend component rendering benchmarks
 * - Database query performance analysis
 * - Full system load testing
 * 
 * Usage:
 *   node scripts/performance-test.js [options]
 * 
 * Options:
 *   --api                  Run API performance tests
 *   --frontend             Run frontend performance tests
 *   --database             Run database performance tests
 *   --full                 Run all performance tests
 *   --endpoints <paths>    Specific API endpoints to test (comma-separated)
 *   --components <names>   Specific components to test (comma-separated)
 *   --duration <seconds>   Test duration in seconds (default: 60)
 *   --users <number>       Simulated concurrent users (default: 10)
 *   --ramp-up <seconds>    Time to ramp up to full user load (default: 10)
 *   --output <format>      Output format: json, html, console (default: console)
 *   --report <path>        Path to save the report (default: ./performance-reports)
 *   --verbose              Enable verbose output
 *   --help                 Show this help message
 */

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { createSpinner } = require('nanospinner');

const apiPerformanceTest = require('./performance/api-performance');
const frontendPerformanceTest = require('./performance/frontend-performance');
const databasePerformanceTest = require('./performance/database-performance');
const systemLoadTest = require('./performance/system-load-test');
const { generateReport } = require('./performance/report-generator');

// Configure the command line interface
program
  .name('performance-test')
  .description('AeroSuite Performance Testing System')
  .version('1.0.0')
  .option('--api', 'Run API performance tests')
  .option('--frontend', 'Run frontend performance tests')
  .option('--database', 'Run database performance tests')
  .option('--full', 'Run all performance tests')
  .option('--endpoints <paths>', 'Specific API endpoints to test (comma-separated)')
  .option('--components <names>', 'Specific components to test (comma-separated)')
  .option('--duration <seconds>', 'Test duration in seconds', '60')
  .option('--users <number>', 'Simulated concurrent users', '10')
  .option('--ramp-up <seconds>', 'Time to ramp up to full user load', '10')
  .option('--output <format>', 'Output format: json, html, console', 'console')
  .option('--report <path>', 'Path to save the report', './performance-reports')
  .option('--verbose', 'Enable verbose output')
  .parse(process.argv);

const options = program.opts();

// Validate options
if (!options.api && !options.frontend && !options.database && !options.full) {
  console.log(chalk.yellow('No test type specified. Using --full to run all tests.'));
  options.full = true;
}

// Prepare report directory
const reportDir = options.report;
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Setup test configuration
const config = {
  duration: parseInt(options.duration, 10),
  users: parseInt(options.users, 10),
  rampUp: parseInt(options.rampUp, 10),
  verbose: options.verbose,
  reportDir,
  reportFormat: options.output,
  timestamp: new Date().toISOString().replace(/[:.]/g, '-'),
  endpoints: options.endpoints ? options.endpoints.split(',') : [],
  components: options.components ? options.components.split(',') : []
};

// Display test configuration
console.log(chalk.blue.bold('\n🚀 AeroSuite Performance Testing System'));
console.log(chalk.blue('───────────────────────────────────────\n'));

console.log(chalk.cyan('Test Configuration:'));
console.log(`Duration: ${chalk.yellow(config.duration)} seconds`);
console.log(`Concurrent Users: ${chalk.yellow(config.users)}`);
console.log(`Ramp-up Period: ${chalk.yellow(config.rampUp)} seconds`);
console.log(`Report Format: ${chalk.yellow(config.reportFormat)}`);
console.log(`Report Directory: ${chalk.yellow(config.reportDir)}`);

if (config.endpoints.length > 0) {
  console.log(`Testing Specific Endpoints: ${chalk.yellow(config.endpoints.join(', '))}`);
}

if (config.components.length > 0) {
  console.log(`Testing Specific Components: ${chalk.yellow(config.components.join(', '))}`);
}
console.log();

// Store all test results
const allResults = {};

// Main execution function
async function runTests() {
  try {
    // API Performance Tests
    if (options.api || options.full) {
      const spinner = createSpinner('Running API performance tests...').start();
      allResults.api = await apiPerformanceTest.run(config);
      spinner.success({ text: 'API performance tests completed' });
    }

    // Frontend Performance Tests
    if (options.frontend || options.full) {
      const spinner = createSpinner('Running frontend performance tests...').start();
      allResults.frontend = await frontendPerformanceTest.run(config);
      spinner.success({ text: 'Frontend performance tests completed' });
    }

    // Database Performance Tests
    if (options.database || options.full) {
      const spinner = createSpinner('Running database performance tests...').start();
      allResults.database = await databasePerformanceTest.run(config);
      spinner.success({ text: 'Database performance tests completed' });
    }

    // Full System Load Test (if full option selected)
    if (options.full) {
      const spinner = createSpinner('Running system load tests...').start();
      allResults.system = await systemLoadTest.run(config);
      spinner.success({ text: 'System load tests completed' });
    }

    // Generate comprehensive report
    const spinner = createSpinner('Generating performance report...').start();
    const reportPath = await generateReport(allResults, config);
    spinner.success({ text: `Performance report generated at ${chalk.green(reportPath)}` });

    console.log(chalk.green.bold('\n✅ All performance tests completed successfully!'));

    // Display summary of findings
    displaySummary(allResults);

  } catch (error) {
    console.error(chalk.red('\n❌ Error running performance tests:'));
    console.error(error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Display a summary of test results
function displaySummary(results) {
  console.log(chalk.blue.bold('\n📊 Performance Test Summary'));
  console.log(chalk.blue('───────────────────────────────\n'));

  if (results.api) {
    console.log(chalk.cyan('API Performance:'));
    console.log(`Average Response Time: ${chalk.yellow(results.api.summary.avgResponseTime.toFixed(2))} ms`);
    console.log(`Requests Per Second: ${chalk.yellow(results.api.summary.requestsPerSecond.toFixed(2))}`);
    console.log(`Error Rate: ${chalk.yellow(results.api.summary.errorRate.toFixed(2))}%\n`);
  }

  if (results.frontend) {
    console.log(chalk.cyan('Frontend Performance:'));
    console.log(`Average Render Time: ${chalk.yellow(results.frontend.summary.avgRenderTime.toFixed(2))} ms`);
    console.log(`Average Load Time: ${chalk.yellow(results.frontend.summary.avgLoadTime.toFixed(2))} ms\n`);
  }

  if (results.database) {
    console.log(chalk.cyan('Database Performance:'));
    console.log(`Average Query Time: ${chalk.yellow(results.database.summary.avgQueryTime.toFixed(2))} ms`);
    console.log(`Slowest Query: ${chalk.yellow(results.database.summary.slowestQuery)} (${chalk.yellow(results.database.summary.slowestQueryTime.toFixed(2))} ms)\n`);
  }

  if (results.system) {
    console.log(chalk.cyan('System Load Test:'));
    console.log(`Peak Response Time: ${chalk.yellow(results.system.summary.peakResponseTime.toFixed(2))} ms`);
    console.log(`Sustainable Requests/Sec: ${chalk.yellow(results.system.summary.sustainableRPS.toFixed(2))}`);
    console.log(`CPU Utilization: ${chalk.yellow(results.system.summary.cpuUtilization.toFixed(2))}%`);
    console.log(`Memory Utilization: ${chalk.yellow(results.system.summary.memoryUtilization.toFixed(2))}%\n`);
  }

  // Performance recommendations
  if (Object.keys(results).length > 0) {
    console.log(chalk.magenta.bold('📝 Recommendations:'));
    
    let recommendations = [];
    if (results.api && results.api.recommendations) {
      recommendations = recommendations.concat(results.api.recommendations);
    }
    if (results.frontend && results.frontend.recommendations) {
      recommendations = recommendations.concat(results.frontend.recommendations);
    }
    if (results.database && results.database.recommendations) {
      recommendations = recommendations.concat(results.database.recommendations);
    }
    if (results.system && results.system.recommendations) {
      recommendations = recommendations.concat(results.system.recommendations);
    }
    
    if (recommendations.length > 0) {
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    } else {
      console.log('No specific recommendations at this time.');
    }
  }
}

// Run the performance tests
runTests(); 