/**
 * Worker Process Handler
 * 
 * This module handles the worker process logic for multi-process load testing.
 * Each worker simulates multiple users and reports results back to the master process.
 * 
 * Task: TS354 - Load testing implementation
 */

const { performance } = require('perf_hooks');
const { runScenario } = require('./scenario-runner');

// Define worker metrics
const workerMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  scenarios: {},
  errorDetails: []
};

// Store configuration received from master
let config = {};
let running = true;
let testEndTime = 0;

// Listen for messages from master
process.on('message', async (message) => {
  if (message.type === 'config') {
    // Store configuration for use in the worker
    config = message.data;
    startTest();
  } else if (message.type === 'stop') {
    // Stop the test and report results
    running = false;
    reportResults();
  }
});

/**
 * Start the load test for this worker
 */
async function startTest() {
  console.log(`Worker ${process.pid} started load test`);
  
  try {
    // Calculate number of users per worker
    const usersPerWorker = Math.ceil(config.concurrentUsers / config.workers);
    testEndTime = Date.now() + (config.testDurationSec * 1000);
    
    // Calculate ramp-up delay if configured
    const rampUpDelayMs = config.rampUpPeriodSec > 0 
      ? (config.rampUpPeriodSec * 1000) / usersPerWorker 
      : 0;
    
    // Create user promises
    const userPromises = [];
    for (let i = 0; i < usersPerWorker; i++) {
      userPromises.push((async () => {
        // Apply ramp-up delay if configured
        if (rampUpDelayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, i * rampUpDelayMs));
        }
        
        // Run the user's scenario until test ends
        while (Date.now() < testEndTime && running) {
          try {
            await runScenario(config, workerMetrics);
          } catch (err) {
            workerMetrics.errorDetails.push({
              timestamp: new Date().toISOString(),
              message: err.message,
              stack: err.stack
            });
            
            // Log error but continue testing
            console.error(`Worker ${process.pid} error:`, err.message);
          }
        }
      })());
    }
    
    // Wait for all users to complete or for the test to be stopped
    await Promise.all(userPromises);
    
    // Report results if not already reported
    if (running) {
      reportResults();
    }
  } catch (error) {
    // Report any unexpected errors
    process.send({
      type: 'error',
      data: {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack
      }
    });
    
    // Exit with error code
    process.exit(1);
  }
}

/**
 * Report test results back to master process
 */
function reportResults() {
  // Send results back to master
  process.send({
    type: 'result',
    data: workerMetrics
  });
  
  // Wait a bit before exiting to ensure message is sent
  setTimeout(() => process.exit(0), 500);
}

// Send ready signal to master on startup
process.send({ type: 'ready', pid: process.pid });

// Handle unexpected errors
process.on('uncaughtException', (err) => {
  console.error(`Worker ${process.pid} uncaught exception:`, err);
  
  process.send({
    type: 'error',
    data: {
      timestamp: new Date().toISOString(),
      message: err.message,
      stack: err.stack
    }
  });
  
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(`Worker ${process.pid} unhandled rejection:`, reason);
  
  process.send({
    type: 'error',
    data: {
      timestamp: new Date().toISOString(),
      message: reason ? reason.message || String(reason) : 'Unknown promise rejection',
      stack: reason && reason.stack
    }
  });
  
  process.exit(1);
}); 