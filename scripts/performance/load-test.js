/**
 * Load Testing Script for Horizontal Scaling
 * 
 * This script creates a high load on the server to test horizontal scaling capabilities.
 * It simulates multiple concurrent users making requests to the API.
 * 
 * Usage:
 *  - Basic: node load-test.js
 *  - Custom: node load-test.js --users=100 --duration=60 --target=http://localhost:5000
 * 
 * Task: TS350 - Status: In Progress - Horizontal scaling implementation
 */

const axios = require('axios');
const { performance, PerformanceObserver } = require('perf_hooks');
const cluster = require('cluster');
const os = require('os');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('users', {
    alias: 'u',
    description: 'Number of concurrent users',
    type: 'number',
    default: 50
  })
  .option('duration', {
    alias: 'd',
    description: 'Test duration in seconds',
    type: 'number',
    default: 30
  })
  .option('target', {
    alias: 't',
    description: 'Target URL',
    type: 'string',
    default: 'http://localhost:5000'
  })
  .option('endpoints', {
    alias: 'e',
    description: 'Comma-separated list of endpoints to test',
    type: 'string',
    default: '/health,/api/customers,/api/suppliers,/api/inspections'
  })
  .option('workers', {
    alias: 'w',
    description: 'Number of worker processes (0 = auto)',
    type: 'number',
    default: 0
  })
  .help()
  .alias('help', 'h')
  .argv;

// Configuration
const config = {
  concurrentUsers: argv.users,
  testDurationSec: argv.duration,
  targetUrl: argv.target,
  endpoints: argv.endpoints.split(','),
  workers: argv.workers || Math.max(1, os.cpus().length - 1)
};

// Global metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  startTime: 0,
  endTime: 0,
  responseTimes: [],
  workerResults: []
};

// Performance observer to track response times
const obs = new PerformanceObserver((items) => {
  const entry = items.getEntries()[0];
  metrics.responseTimes.push(entry.duration);
  performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });

/**
 * Make a request to a random endpoint
 * @returns {Promise<void>}
 */
async function makeRequest() {
  const endpoint = config.endpoints[Math.floor(Math.random() * config.endpoints.length)];
  const requestId = `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  try {
    performance.mark(`start_${requestId}`);
    
    const response = await axios.get(`${config.targetUrl}${endpoint}`, {
      timeout: 10000,
      headers: {
        'X-Load-Test': 'true',
        'X-Request-ID': requestId
      }
    });
    
    performance.mark(`end_${requestId}`);
    performance.measure('requestTime', `start_${requestId}`, `end_${requestId}`);
    
    metrics.successfulRequests++;
    return true;
  } catch (error) {
    metrics.failedRequests++;
    console.error(`Request failed: ${error.message}`);
    return false;
  } finally {
    metrics.totalRequests++;
  }
}

/**
 * Run tests with a single user
 * @returns {Promise<void>}
 */
async function runUserTest() {
  const testEndTime = metrics.startTime + (config.testDurationSec * 1000);
  
  while (Date.now() < testEndTime) {
    await makeRequest();
    
    // Small delay to prevent CPU overload in the test script itself
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Calculate statistics from metrics
 * @param {Object} metrics - Test metrics
 * @returns {Object} Statistics
 */
function calculateStats(metrics) {
  // Sort response times for percentile calculations
  const sortedTimes = [...metrics.responseTimes].sort((a, b) => a - b);
  
  // Calculate percentiles
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
  
  // Calculate average
  const average = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length || 0;
  
  // Duration in seconds
  const durationSec = (metrics.endTime - metrics.startTime) / 1000;
  
  return {
    totalRequests: metrics.totalRequests,
    successfulRequests: metrics.successfulRequests,
    failedRequests: metrics.failedRequests,
    successRate: ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2),
    requestsPerSecond: (metrics.totalRequests / durationSec).toFixed(2),
    avgResponseTime: average.toFixed(2),
    p50ResponseTime: p50.toFixed(2),
    p95ResponseTime: p95.toFixed(2),
    p99ResponseTime: p99.toFixed(2),
    testDuration: durationSec.toFixed(2)
  };
}

/**
 * Run the load test in worker mode
 */
async function runWorkerTest() {
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} starting ${config.workers} workers for load testing...`);
    metrics.startTime = Date.now();
    
    // Fork workers
    for (let i = 0; i < config.workers; i++) {
      const worker = cluster.fork();
      
      // Collect results from workers
      worker.on('message', (message) => {
        if (message.type === 'result') {
          metrics.workerResults.push(message.data);
        }
      });
    }
    
    // Exit handler for workers
    cluster.on('exit', (worker, code) => {
      console.log(`Worker ${worker.process.pid} exited with code ${code}`);
      
      // Check if all workers have exited
      if (Object.keys(cluster.workers).length === 0) {
        metrics.endTime = Date.now();
        
        // Combine worker results
        metrics.workerResults.forEach(result => {
          metrics.totalRequests += result.totalRequests;
          metrics.successfulRequests += result.successfulRequests;
          metrics.failedRequests += result.failedRequests;
          metrics.responseTimes = metrics.responseTimes.concat(result.responseTimes);
        });
        
        // Calculate and display results
        const stats = calculateStats(metrics);
        printResults(stats);
      }
    });
    
    // Set timeout to end test
    setTimeout(() => {
      console.log('Test duration completed, stopping workers...');
      for (const id in cluster.workers) {
        cluster.workers[id].send({ type: 'stop' });
      }
    }, config.testDurationSec * 1000);
    
  } else {
    // Worker process - run user test
    console.log(`Worker ${process.pid} started`);
    
    const workerMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: []
    };
    
    // Listen for stop message from master
    process.on('message', async (message) => {
      if (message.type === 'stop') {
        // Send results back to master and exit
        process.send({
          type: 'result',
          data: workerMetrics
        });
        
        setTimeout(() => process.exit(0), 500);
      }
    });
    
    // Run test for this worker's simulated users
    const usersPerWorker = Math.ceil(config.concurrentUsers / config.workers);
    const testEndTime = Date.now() + (config.testDurationSec * 1000);
    
    const userPromises = [];
    for (let i = 0; i < usersPerWorker; i++) {
      userPromises.push((async () => {
        while (Date.now() < testEndTime) {
          try {
            const startTime = Date.now();
            const success = await makeRequest();
            const endTime = Date.now();
            
            workerMetrics.responseTimes.push(endTime - startTime);
            
            if (success) {
              workerMetrics.successfulRequests++;
            } else {
              workerMetrics.failedRequests++;
            }
            
            workerMetrics.totalRequests++;
            
            // Small delay to prevent CPU overload in the test script itself
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (err) {
            console.error(`Worker ${process.pid} error:`, err);
          }
        }
      })());
    }
    
    await Promise.all(userPromises);
    
    // Send results back to master
    process.send({
      type: 'result',
      data: workerMetrics
    });
    
    // Wait a bit before exiting to ensure message is sent
    setTimeout(() => process.exit(0), 500);
  }
}

/**
 * Print test results
 * @param {Object} stats - Test statistics
 */
function printResults(stats) {
  console.log('\n=== Load Test Results ===');
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful Requests: ${stats.successfulRequests}`);
  console.log(`Failed Requests: ${stats.failedRequests}`);
  console.log(`Success Rate: ${stats.successRate}%`);
  console.log(`Requests Per Second: ${stats.requestsPerSecond}`);
  console.log(`Average Response Time: ${stats.avgResponseTime} ms`);
  console.log(`50th Percentile (Median): ${stats.p50ResponseTime} ms`);
  console.log(`95th Percentile: ${stats.p95ResponseTime} ms`);
  console.log(`99th Percentile: ${stats.p99ResponseTime} ms`);
  console.log(`Test Duration: ${stats.testDuration} seconds`);
  console.log('=========================\n');
}

/**
 * Main function to run the load test
 */
async function runLoadTest() {
  console.log('=== Starting Load Test ===');
  console.log(`Target: ${config.targetUrl}`);
  console.log(`Endpoints: ${config.endpoints.join(', ')}`);
  console.log(`Concurrent Users: ${config.concurrentUsers}`);
  console.log(`Test Duration: ${config.testDurationSec} seconds`);
  console.log(`Workers: ${config.workers}`);
  console.log('=========================\n');
  
  if (config.workers > 1) {
    // Multi-process mode
    await runWorkerTest();
  } else {
    // Single process mode
    metrics.startTime = Date.now();
    
    // Create user promises
    const userPromises = [];
    for (let i = 0; i < config.concurrentUsers; i++) {
      userPromises.push(runUserTest());
    }
    
    // Wait for all users to complete
    await Promise.all(userPromises);
    
    metrics.endTime = Date.now();
    
    // Calculate and display results
    const stats = calculateStats(metrics);
    printResults(stats);
  }
}

// Run the load test
runLoadTest().catch(err => {
  console.error('Load test failed:', err);
  process.exit(1);
}); 