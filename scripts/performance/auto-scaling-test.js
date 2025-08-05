/**
 * Auto-Scaling Load Test
 * 
 * This script tests the auto-scaling capabilities of AeroSuite by generating
 * controlled load patterns and monitoring scaling behavior.
 * 
 * Implements RF040 - Test scaling under load
 * 
 * Usage:
 *  - Basic: node auto-scaling-test.js
 *  - Custom: node auto-scaling-test.js --pattern=spike --duration=600 --target=http://localhost:5000
 */

const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cluster = require('cluster');
const chalk = require('chalk');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('pattern', {
    alias: 'p',
    description: 'Load pattern (gradual, step, spike, wave, sustained)',
    type: 'string',
    default: 'gradual'
  })
  .option('duration', {
    alias: 'd',
    description: 'Test duration in seconds',
    type: 'number',
    default: 300 // 5 minutes
  })
  .option('target', {
    alias: 't',
    description: 'Target URL',
    type: 'string',
    default: 'http://localhost:5000'
  })
  .option('max-users', {
    alias: 'm',
    description: 'Maximum number of concurrent users',
    type: 'number',
    default: 200
  })
  .option('workers', {
    alias: 'w',
    description: 'Number of worker processes (0 = auto)',
    type: 'number',
    default: 0
  })
  .option('report-file', {
    alias: 'r',
    description: 'Report file path',
    type: 'string',
    default: 'auto-scaling-test-report.json'
  })
  .option('monitor-interval', {
    alias: 'i',
    description: 'Monitoring interval in seconds',
    type: 'number',
    default: 5
  })
  .option('auth-token', {
    description: 'Authentication token for API access',
    type: 'string'
  })
  .option('verbose', {
    alias: 'v',
    description: 'Enable verbose output',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

// Configuration
const config = {
  pattern: argv.pattern,
  testDurationSec: argv.duration,
  targetUrl: argv.target,
  maxUsers: argv['max-users'],
  workers: argv.workers || Math.max(1, os.cpus().length - 1),
  reportFile: argv['report-file'],
  monitorIntervalSec: argv['monitor-interval'],
  authToken: argv['auth-token'],
  verbose: argv.verbose
};

// Global metrics
const metrics = {
  startTime: 0,
  endTime: 0,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  scalingEvents: [],
  instanceCounts: [],
  cpuUtilization: [],
  memoryUtilization: [],
  requestsPerSecond: [],
  activeConnections: []
};

// API endpoints to test (randomized during test)
const endpoints = [
  '/api/health',
  '/api/v1/auto-scaling/status',
  '/api/customers',
  '/api/suppliers',
  '/api/inspections',
  '/api/dashboard/stats'
];

// Load pattern generators
const loadPatterns = {
  /**
   * Gradual increase in load
   * @param {number} elapsed - Elapsed time in seconds
   * @param {number} duration - Total duration in seconds
   * @param {number} maxUsers - Maximum users
   * @returns {number} - Number of users at this time
   */
  gradual: (elapsed, duration, maxUsers) => {
    return Math.floor((elapsed / duration) * maxUsers);
  },
  
  /**
   * Step-wise increase in load
   * @param {number} elapsed - Elapsed time in seconds
   * @param {number} duration - Total duration in seconds
   * @param {number} maxUsers - Maximum users
   * @returns {number} - Number of users at this time
   */
  step: (elapsed, duration, maxUsers) => {
    const steps = 5;
    const stepDuration = duration / steps;
    const currentStep = Math.floor(elapsed / stepDuration);
    return Math.floor((currentStep / steps) * maxUsers);
  },
  
  /**
   * Spike pattern (low, high spike, low)
   * @param {number} elapsed - Elapsed time in seconds
   * @param {number} duration - Total duration in seconds
   * @param {number} maxUsers - Maximum users
   * @returns {number} - Number of users at this time
   */
  spike: (elapsed, duration, maxUsers) => {
    const spikeStart = duration * 0.3;
    const spikeEnd = duration * 0.7;
    
    if (elapsed >= spikeStart && elapsed <= spikeEnd) {
      return maxUsers;
    } else {
      return Math.floor(maxUsers * 0.1); // 10% of max users during non-spike periods
    }
  },
  
  /**
   * Wave pattern (sinusoidal)
   * @param {number} elapsed - Elapsed time in seconds
   * @param {number} duration - Total duration in seconds
   * @param {number} maxUsers - Maximum users
   * @returns {number} - Number of users at this time
   */
  wave: (elapsed, duration, maxUsers) => {
    // Complete 3 waves over the duration
    const frequency = (3 * 2 * Math.PI) / duration;
    // Sine wave oscillates between 10% and 100% of max users
    return Math.floor(maxUsers * (0.1 + 0.9 * (Math.sin(frequency * elapsed) + 1) / 2));
  },
  
  /**
   * Sustained high load
   * @param {number} elapsed - Elapsed time in seconds
   * @param {number} duration - Total duration in seconds
   * @param {number} maxUsers - Maximum users
   * @returns {number} - Number of users at this time
   */
  sustained: (elapsed, duration, maxUsers) => {
    const rampUpTime = duration * 0.1;
    
    if (elapsed < rampUpTime) {
      return Math.floor((elapsed / rampUpTime) * maxUsers);
    } else {
      return maxUsers;
    }
  }
};

/**
 * Make a request to a random endpoint
 * @returns {Promise<boolean>} Success status
 */
async function makeRequest() {
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const requestId = `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const startTime = performance.now();
  
  try {
    const headers = {
      'X-Load-Test': 'true',
      'X-Request-ID': requestId
    };
    
    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    }
    
    const response = await axios.get(`${config.targetUrl}${endpoint}`, {
      timeout: 10000,
      headers
    });
    
    const duration = performance.now() - startTime;
    metrics.responseTimes.push(duration);
    metrics.successfulRequests++;
    return true;
  } catch (error) {
    metrics.failedRequests++;
    if (config.verbose) {
      console.error(`Request failed: ${error.message}`);
    }
    return false;
  } finally {
    metrics.totalRequests++;
  }
}

/**
 * Fetch auto-scaling metrics from the API
 * @returns {Promise<Object|null>} Auto-scaling metrics or null on error
 */
async function fetchAutoScalingMetrics() {
  try {
    const headers = {};
    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    }
    
    const response = await axios.get(`${config.targetUrl}/api/v1/auto-scaling/metrics`, {
      timeout: 5000,
      headers
    });
    
    return response.data.data;
  } catch (error) {
    if (config.verbose) {
      console.error(`Failed to fetch auto-scaling metrics: ${error.message}`);
    }
    return null;
  }
}

/**
 * Fetch auto-scaling status from the API
 * @returns {Promise<Object|null>} Auto-scaling status or null on error
 */
async function fetchAutoScalingStatus() {
  try {
    const headers = {};
    if (config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    }
    
    const response = await axios.get(`${config.targetUrl}/api/v1/auto-scaling/status`, {
      timeout: 5000,
      headers
    });
    
    return response.data.data;
  } catch (error) {
    if (config.verbose) {
      console.error(`Failed to fetch auto-scaling status: ${error.message}`);
    }
    return null;
  }
}

/**
 * Monitor auto-scaling behavior
 * @returns {Promise<void>}
 */
async function monitorAutoScaling() {
  try {
    // Fetch metrics
    const scalingMetrics = await fetchAutoScalingMetrics();
    const scalingStatus = await fetchAutoScalingStatus();
    
    if (scalingMetrics) {
      metrics.cpuUtilization.push({
        timestamp: Date.now(),
        value: scalingMetrics.cpu
      });
      
      metrics.memoryUtilization.push({
        timestamp: Date.now(),
        value: scalingMetrics.memory
      });
      
      metrics.requestsPerSecond.push({
        timestamp: Date.now(),
        value: scalingMetrics.requestsPerMinute / 60
      });
      
      metrics.activeConnections.push({
        timestamp: Date.now(),
        value: scalingMetrics.connections
      });
    }
    
    if (scalingStatus) {
      // Check if there was a scaling event (by comparing with the last instance count)
      const previousCount = metrics.instanceCounts.length > 0 
        ? metrics.instanceCounts[metrics.instanceCounts.length - 1].value 
        : null;
      
      // Get node count from status if available
      let currentCount = null;
      if (scalingStatus.nodeId) {
        // This is just one node, we need to query all nodes
        const allNodesResponse = await axios.get(`${config.targetUrl}/api/v1/auto-scaling/history`, {
          timeout: 5000,
          headers: config.authToken ? { 'Authorization': `Bearer ${config.authToken}` } : {}
        });
        
        if (allNodesResponse.data && allNodesResponse.data.data) {
          currentCount = allNodesResponse.data.data.length;
        }
      }
      
      // Record instance count
      metrics.instanceCounts.push({
        timestamp: Date.now(),
        value: currentCount
      });
      
      // Record scaling event if detected
      if (previousCount !== null && currentCount !== null && previousCount !== currentCount) {
        metrics.scalingEvents.push({
          timestamp: Date.now(),
          previousCount,
          currentCount,
          direction: currentCount > previousCount ? 'up' : 'down'
        });
        
        console.log(chalk.yellow(`Scaling event detected: ${previousCount} → ${currentCount} instances`));
      }
    }
  } catch (error) {
    if (config.verbose) {
      console.error(`Error monitoring auto-scaling: ${error.message}`);
    }
  }
}

/**
 * Run the auto-scaling test
 */
async function runAutoScalingTest() {
  console.log(chalk.blue('=== AeroSuite Auto-Scaling Test ==='));
  console.log(chalk.blue(`Pattern: ${config.pattern}`));
  console.log(chalk.blue(`Duration: ${config.testDurationSec} seconds`));
  console.log(chalk.blue(`Target URL: ${config.targetUrl}`));
  console.log(chalk.blue(`Max Users: ${config.maxUsers}`));
  console.log(chalk.blue('====================================\n'));
  
  // Validate pattern
  if (!loadPatterns[config.pattern]) {
    console.error(chalk.red(`Invalid load pattern: ${config.pattern}`));
    console.error(chalk.yellow('Available patterns: gradual, step, spike, wave, sustained'));
    process.exit(1);
  }
  
  // Start metrics
  metrics.startTime = Date.now();
  
  // Set up monitoring interval
  const monitoringInterval = setInterval(monitorAutoScaling, config.monitorIntervalSec * 1000);
  
  // Run initial monitoring
  await monitorAutoScaling();
  
  // Start the test
  console.log(chalk.green('Starting auto-scaling test...'));
  
  let activeUsers = 0;
  let userPromises = [];
  
  // Main test loop
  const startTime = Date.now();
  const testInterval = setInterval(async () => {
    const elapsedSec = (Date.now() - startTime) / 1000;
    
    // Check if test is complete
    if (elapsedSec >= config.testDurationSec) {
      clearInterval(testInterval);
      clearInterval(monitoringInterval);
      await finishTest();
      return;
    }
    
    // Calculate target users based on the selected pattern
    const targetUsers = loadPatterns[config.pattern](elapsedSec, config.testDurationSec, config.maxUsers);
    
    // Adjust active users
    if (targetUsers > activeUsers) {
      // Add users
      const usersToAdd = targetUsers - activeUsers;
      for (let i = 0; i < usersToAdd; i++) {
        userPromises.push(simulateUser());
      }
      activeUsers = targetUsers;
    } else if (targetUsers < activeUsers) {
      // Remove users (by not replacing them when they finish)
      const usersToRemove = activeUsers - targetUsers;
      activeUsers = targetUsers;
      userPromises = userPromises.slice(0, activeUsers);
    }
    
    // Log progress every 10 seconds
    if (Math.floor(elapsedSec) % 10 === 0) {
      const progress = Math.floor((elapsedSec / config.testDurationSec) * 100);
      console.log(chalk.green(`Progress: ${progress}% | Active Users: ${activeUsers} | Requests: ${metrics.totalRequests} | Success Rate: ${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)}%`));
    }
  }, 1000);
}

/**
 * Simulate a user making repeated requests
 * @returns {Promise<void>}
 */
async function simulateUser() {
  while (true) {
    await makeRequest();
    
    // Random delay between 500ms and 3000ms
    const delay = 500 + Math.random() * 2500;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Finish the test and generate report
 */
async function finishTest() {
  metrics.endTime = Date.now();
  
  // Final monitoring
  await monitorAutoScaling();
  
  // Calculate summary metrics
  const testDurationMs = metrics.endTime - metrics.startTime;
  const avgResponseTime = metrics.responseTimes.reduce((sum, time) => sum + time, 0) / metrics.responseTimes.length;
  const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
  const requestsPerSecond = metrics.totalRequests / (testDurationMs / 1000);
  
  // Calculate scaling metrics
  const scalingEvents = metrics.scalingEvents.length;
  const maxInstances = Math.max(...metrics.instanceCounts.filter(i => i.value !== null).map(i => i.value), 0);
  const minInstances = Math.min(...metrics.instanceCounts.filter(i => i.value !== null).map(i => i.value), maxInstances);
  
  // Print summary
  console.log(chalk.blue('\n=== Auto-Scaling Test Results ==='));
  console.log(chalk.blue(`Test Duration: ${(testDurationMs / 1000).toFixed(1)} seconds`));
  console.log(chalk.blue(`Total Requests: ${metrics.totalRequests}`));
  console.log(chalk.blue(`Successful Requests: ${metrics.successfulRequests} (${successRate.toFixed(1)}%)`));
  console.log(chalk.blue(`Failed Requests: ${metrics.failedRequests}`));
  console.log(chalk.blue(`Avg. Response Time: ${avgResponseTime.toFixed(2)} ms`));
  console.log(chalk.blue(`Requests/second: ${requestsPerSecond.toFixed(2)}`));
  console.log(chalk.blue(`Scaling Events: ${scalingEvents}`));
  console.log(chalk.blue(`Instance Range: ${minInstances} - ${maxInstances}`));
  console.log(chalk.blue('================================\n'));
  
  // Generate report
  const report = {
    config,
    summary: {
      testDuration: testDurationMs,
      totalRequests: metrics.totalRequests,
      successfulRequests: metrics.successfulRequests,
      failedRequests: metrics.failedRequests,
      successRate,
      avgResponseTime,
      requestsPerSecond,
      scalingEvents,
      minInstances,
      maxInstances
    },
    metrics: {
      responseTimes: metrics.responseTimes,
      scalingEvents: metrics.scalingEvents,
      instanceCounts: metrics.instanceCounts,
      cpuUtilization: metrics.cpuUtilization,
      memoryUtilization: metrics.memoryUtilization,
      requestsPerSecond: metrics.requestsPerSecond,
      activeConnections: metrics.activeConnections
    }
  };
  
  // Save report to file
  const reportPath = path.join(process.cwd(), config.reportFile);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(chalk.green(`Report saved to ${reportPath}`));
  
  process.exit(0);
}

// Run the test
runAutoScalingTest().catch(error => {
  console.error(chalk.red(`Test failed: ${error.message}`));
  process.exit(1);
}); 