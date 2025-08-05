/**
 * AeroSuite Load Testing Framework
 * 
 * This is the main entry point for the load testing framework.
 * It provides an integrated approach to running load tests with different profiles and scenarios.
 * 
 * Usage:
 *  - Basic: node index.js
 *  - Profile: node index.js --profile=production
 *  - Scenario: node index.js --scenario=authentication
 *  - Custom: node index.js --users=100 --duration=60 --target=http://localhost:5000
 * 
 * Task: TS354 - Load testing implementation
 */

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { performance } = require('perf_hooks');
const cluster = require('cluster');
const os = require('os');
const chalk = require('chalk');

// Import utilities
const { generateReport } = require('./utils/report-generator');
const { setupMetricsCollection } = require('./utils/metrics-collector');
const { validateConfig } = require('./utils/config-validator');
const { runScenario } = require('./utils/scenario-runner');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('profile', {
    alias: 'p',
    description: 'Test profile to use (e.g., baseline, production, stress)',
    type: 'string',
    default: 'baseline'
  })
  .option('scenario', {
    alias: 's',
    description: 'Test scenario to run (e.g., authentication, browsing, crud)',
    type: 'string'
  })
  .option('users', {
    alias: 'u',
    description: 'Number of concurrent users',
    type: 'number'
  })
  .option('duration', {
    alias: 'd',
    description: 'Test duration in seconds',
    type: 'number'
  })
  .option('target', {
    alias: 't',
    description: 'Target URL',
    type: 'string'
  })
  .option('output', {
    alias: 'o',
    description: 'Output format (console, json, html)',
    type: 'string',
    default: 'console'
  })
  .option('report', {
    alias: 'r',
    description: 'Generate detailed report',
    type: 'boolean',
    default: false
  })
  .option('workers', {
    alias: 'w',
    description: 'Number of worker processes (0 = auto)',
    type: 'number'
  })
  .option('auth', {
    description: 'Authentication token or credentials',
    type: 'string'
  })
  .option('headers', {
    description: 'Custom headers as JSON string',
    type: 'string'
  })
  .option('warmup', {
    description: 'Warmup period in seconds',
    type: 'number',
    default: 5
  })
  .option('rampUp', {
    description: 'Ramp up period in seconds',
    type: 'number',
    default: 0
  })
  .option('debug', {
    description: 'Enable debug mode',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

// Define global variables
let config = {};
let metrics = {
  startTime: 0,
  endTime: 0,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  workerResults: [],
  scenarios: {},
  errorDetails: []
};

/**
 * Load test profile
 * @param {string} profileName - Profile name
 * @returns {Object} Profile configuration
 */
function loadProfile(profileName) {
  try {
    const profilePath = path.join(__dirname, 'profiles', `${profileName}.js`);
    if (fs.existsSync(profilePath)) {
      return require(profilePath);
    } else {
      console.warn(chalk.yellow(`Profile ${profileName} not found. Using default profile.`));
      return require('./profiles/baseline');
    }
  } catch (error) {
    console.error(chalk.red(`Error loading profile: ${error.message}`));
    console.warn(chalk.yellow('Using default configuration.'));
    return {};
  }
}

/**
 * Merge configurations
 * @param {Object} profile - Profile configuration
 * @param {Object} cli - CLI arguments
 * @returns {Object} Merged configuration
 */
function mergeConfig(profile, cli) {
  // Create the base configuration from the profile
  const mergedConfig = { ...profile };

  // Override with CLI arguments if provided
  if (cli.users) mergedConfig.concurrentUsers = cli.users;
  if (cli.duration) mergedConfig.testDurationSec = cli.duration;
  if (cli.target) mergedConfig.targetUrl = cli.target;
  if (cli.scenario) mergedConfig.scenario = cli.scenario;
  if (cli.workers !== undefined) mergedConfig.workers = cli.workers;
  if (cli.auth) mergedConfig.auth = cli.auth;
  if (cli.warmup) mergedConfig.warmupPeriodSec = cli.warmup;
  if (cli.rampUp) mergedConfig.rampUpPeriodSec = cli.rampUp;
  if (cli.debug) mergedConfig.debug = cli.debug;
  
  // Parse custom headers if provided
  if (cli.headers) {
    try {
      mergedConfig.headers = JSON.parse(cli.headers);
    } catch (error) {
      console.error(chalk.red(`Error parsing custom headers: ${error.message}`));
    }
  }
  
  // Set workers to CPU count - 1 if not specified or auto
  if (!mergedConfig.workers) {
    mergedConfig.workers = Math.max(1, os.cpus().length - 1);
  }
  
  // Ensure required properties have defaults
  mergedConfig.concurrentUsers = mergedConfig.concurrentUsers || 10;
  mergedConfig.testDurationSec = mergedConfig.testDurationSec || 30;
  mergedConfig.targetUrl = mergedConfig.targetUrl || 'http://localhost:5000';
  mergedConfig.warmupPeriodSec = mergedConfig.warmupPeriodSec || 5;
  mergedConfig.rampUpPeriodSec = mergedConfig.rampUpPeriodSec || 0;
  
  return mergedConfig;
}

/**
 * Main function to run the load test
 */
async function runLoadTest() {
  console.log(chalk.blue('=== AeroSuite Load Testing Framework ==='));
  
  // Load profile configuration
  const profile = loadProfile(argv.profile);
  
  // Merge profile with CLI arguments
  config = mergeConfig(profile, argv);
  
  // Validate configuration
  const validationResult = validateConfig(config);
  if (!validationResult.valid) {
    console.error(chalk.red(`Configuration error: ${validationResult.error}`));
    process.exit(1);
  }
  
  console.log(chalk.blue(`Profile: ${argv.profile}`));
  console.log(chalk.blue(`Target: ${config.targetUrl}`));
  console.log(chalk.blue(`Concurrent Users: ${config.concurrentUsers}`));
  console.log(chalk.blue(`Test Duration: ${config.testDurationSec} seconds`));
  console.log(chalk.blue(`Workers: ${config.workers}`));
  if (config.scenario) {
    console.log(chalk.blue(`Scenario: ${config.scenario}`));
  }
  console.log(chalk.blue('========================================\n'));
  
  // Set up metrics collection
  setupMetricsCollection(metrics);
  
  // Run the test based on mode (multi-process or single process)
  if (config.workers > 1 && config.concurrentUsers > 1) {
    await runMultiProcessTest();
  } else {
    await runSingleProcessTest();
  }
  
  // Generate and output report
  const reportOptions = {
    format: argv.output,
    detailed: argv.report,
    outputPath: path.join(__dirname, 'reports')
  };
  
  await generateReport(metrics, config, reportOptions);
}

/**
 * Run load test in single process mode
 */
async function runSingleProcessTest() {
  console.log(chalk.green('Running in single process mode'));
  
  metrics.startTime = performance.now();
  
  // Run warmup if configured
  if (config.warmupPeriodSec > 0) {
    console.log(chalk.yellow(`Starting warmup (${config.warmupPeriodSec} seconds)...`));
    await runWarmup();
  }
  
  console.log(chalk.green('Starting test...'));
  
  // Create user promises
  const userPromises = [];
  
  // Calculate ramp-up delay if configured
  const rampUpDelayMs = config.rampUpPeriodSec > 0 
    ? (config.rampUpPeriodSec * 1000) / config.concurrentUsers 
    : 0;
  
  for (let i = 0; i < config.concurrentUsers; i++) {
    const promise = (async () => {
      // Apply ramp-up delay if configured
      if (rampUpDelayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, i * rampUpDelayMs));
      }
      
      await runScenario(config, metrics);
    })();
    
    userPromises.push(promise);
  }
  
  // Wait for all users to complete
  await Promise.all(userPromises);
  
  metrics.endTime = performance.now();
}

/**
 * Run load test in multi-process mode
 */
async function runMultiProcessTest() {
  if (cluster.isMaster) {
    console.log(chalk.green(`Running in multi-process mode with ${config.workers} workers`));
    
    // Run warmup if configured
    if (config.warmupPeriodSec > 0) {
      console.log(chalk.yellow(`Starting warmup (${config.warmupPeriodSec} seconds)...`));
      await runWarmup();
    }
    
    console.log(chalk.green('Starting test...'));
    metrics.startTime = performance.now();
    
    // Fork workers
    for (let i = 0; i < config.workers; i++) {
      const worker = cluster.fork();
      
      // Collect results from workers
      worker.on('message', (message) => {
        if (message.type === 'result') {
          metrics.workerResults.push(message.data);
        } else if (message.type === 'error') {
          metrics.errorDetails.push(message.data);
        }
      });
    }
    
    // Exit handler for workers
    cluster.on('exit', (worker, code) => {
      if (code !== 0 && !worker.exitedAfterDisconnect) {
        console.error(chalk.red(`Worker ${worker.process.pid} died with code ${code}`));
      } else {
        console.log(chalk.green(`Worker ${worker.process.pid} completed`));
      }
      
      // Check if all workers have exited
      if (Object.keys(cluster.workers).length === 0) {
        metrics.endTime = performance.now();
        
        // Combine worker results
        metrics.workerResults.forEach(result => {
          metrics.totalRequests += result.totalRequests;
          metrics.successfulRequests += result.successfulRequests;
          metrics.failedRequests += result.failedRequests;
          metrics.responseTimes = metrics.responseTimes.concat(result.responseTimes || []);
          
          // Combine scenario metrics if available
          if (result.scenarios) {
            Object.keys(result.scenarios).forEach(scenario => {
              if (!metrics.scenarios[scenario]) {
                metrics.scenarios[scenario] = {
                  requests: 0,
                  success: 0,
                  failed: 0,
                  responseTimes: []
                };
              }
              
              metrics.scenarios[scenario].requests += result.scenarios[scenario].requests || 0;
              metrics.scenarios[scenario].success += result.scenarios[scenario].success || 0;
              metrics.scenarios[scenario].failed += result.scenarios[scenario].failed || 0;
              metrics.scenarios[scenario].responseTimes = metrics.scenarios[scenario].responseTimes.concat(
                result.scenarios[scenario].responseTimes || []
              );
            });
          }
        });
      }
    });
    
    // Set timeout to end test
    setTimeout(() => {
      console.log(chalk.yellow('Test duration completed, stopping workers...'));
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'stop' });
      }
    }, config.testDurationSec * 1000);
    
  } else {
    // Worker process - handle in worker.js
    require('./utils/worker');
  }
}

/**
 * Run warmup to prepare the system
 */
async function runWarmup() {
  const warmupConfig = { ...config };
  warmupConfig.concurrentUsers = Math.max(1, Math.floor(config.concurrentUsers * 0.2));
  warmupConfig.testDurationSec = config.warmupPeriodSec;
  
  // Run a smaller load test for warmup
  const warmupPromises = [];
  for (let i = 0; i < warmupConfig.concurrentUsers; i++) {
    warmupPromises.push(runScenario(warmupConfig));
  }
  
  await Promise.all(warmupPromises);
  console.log(chalk.green('Warmup completed'));
}

// Start the load test
if (require.main === module) {
  runLoadTest().catch(err => {
    console.error(chalk.red(`Load test failed: ${err.message}`));
    console.error(err.stack);
    process.exit(1);
  });
}

module.exports = {
  runLoadTest,
  loadProfile,
  mergeConfig
}; 