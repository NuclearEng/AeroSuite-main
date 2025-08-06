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

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

// Import chalk with fallback
let chalk;
try {
  const chalkModule = require('chalk');
  // Handle both old and new chalk versions
  if (typeof chalkModule.yellow === 'function') {
    chalk = chalkModule;
  } else {
    // New chalk version - create fallback
    chalk = {
      blue: (text) => `\x1b[34m${text}\x1b[0m`,
      yellow: (text) => `\x1b[33m${text}\x1b[0m`,
      green: (text) => `\x1b[32m${text}\x1b[0m`,
      red: (text) => `\x1b[31m${text}\x1b[0m`,
      cyan: (text) => `\x1b[36m${text}\x1b[0m`,
      bold: (text) => `\x1b[1m${text}\x1b[0m`
    };
  }
} catch (error) {
  // Fallback if chalk is not available
  chalk = {
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`
  };
}

// Import test modules
const apiPerformanceTest = require('./performance/api-performance-test');
const frontendPerformanceTest = require('./performance/frontend-performance-test');
const databasePerformanceTest = require('./performance/database-performance-test');
const systemLoadTest = require('./performance/system-load-test');
const { generateReport } = require('./performance/report-generator');

// Create spinner function
function createSpinner(text) {
  return {
    start: () => ({ success: () => console.log(`✅ ${text}`) }),
    success: () => console.log(`✅ ${text}`)
  };
}

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
console.log(chalk.blue(chalk.bold('\n🚀 AeroSuite Performance Testing System')));
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

    console.log(chalk.green(chalk.bold('\n✅ All performance tests completed successfully!')));

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
  console.log(chalk.blue(chalk.bold('\n📊 Performance Test Summary')));
  console.log(chalk.blue('───────────────────────────────\n'));

  if (results.api && results.api.summary) {
    console.log(chalk.cyan('API Performance:'));
    const apiSummary = results.api.summary;
    console.log(`Total Requests: ${chalk.yellow(apiSummary.totalRequests || 0)}`);
    console.log(`Successful Requests: ${chalk.yellow(apiSummary.successfulRequests || 0)}`);
    console.log(`Failed Requests: ${chalk.yellow(apiSummary.failedRequests || 0)}`);
    console.log(`Average Response Time: ${chalk.yellow((apiSummary.averageResponseTime || 0).toFixed(2))} ms\n`);
  }

  if (results.frontend && results.frontend.summary) {
    console.log(chalk.cyan('Frontend Performance:'));
    const frontendSummary = results.frontend.summary;
    console.log(`Total Pages: ${chalk.yellow(frontendSummary.totalPages || 0)}`);
    console.log(`Successful Loads: ${chalk.yellow(frontendSummary.successfulLoads || 0)}`);
    console.log(`Failed Loads: ${chalk.yellow(frontendSummary.failedLoads || 0)}`);
    console.log(`Average Load Time: ${chalk.yellow((frontendSummary.averageLoadTime || 0).toFixed(2))} ms\n`);
  }

  if (results.database && results.database.summary) {
    console.log(chalk.cyan('Database Performance:'));
    const dbSummary = results.database.summary;
    console.log(`Total Operations: ${chalk.yellow(dbSummary.totalOperations || 0)}`);
    console.log(`Successful Operations: ${chalk.yellow(dbSummary.successfulOperations || 0)}`);
    console.log(`Failed Operations: ${chalk.yellow(dbSummary.failedOperations || 0)}`);
    console.log(`Average Response Time: ${chalk.yellow((dbSummary.averageResponseTime || 0).toFixed(2))} ms\n`);
  }

  if (results.system && results.system.summary) {
    console.log(chalk.cyan('System Load Test:'));
    const systemSummary = results.system.summary;
    console.log(`Total Scenarios: ${chalk.yellow(systemSummary.totalScenarios || 0)}`);
    console.log(`Successful Scenarios: ${chalk.yellow(systemSummary.successfulScenarios || 0)}`);
    console.log(`Failed Scenarios: ${chalk.yellow(systemSummary.failedScenarios || 0)}`);
    console.log(`Average Response Time: ${chalk.yellow((systemSummary.averageResponseTime || 0).toFixed(2))} ms\n`);
  }

  // Performance recommendations
  if (Object.keys(results).length > 0) {
    console.log(chalk.cyan(chalk.bold('📝 Recommendations:')));
    
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