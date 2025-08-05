/**
 * System Load Testing Module
 * 
 * This module tests the entire system under load by simulating
 * multiple concurrent users performing various actions.
 */

const autocannon = require('autocannon');
const axios = require('axios');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { createSpinner } = require('nanospinner');
const pidusage = require('pidusage');

// Default scenarios to test
const DEFAULT_SCENARIOS = [
  {
    name: 'mixed-load-test',
    description: 'Mixed load test with various API endpoints',
    duration: 60, // Override with config.duration
    connections: 10, // Override with config.users
    requests: [
      {
        method: 'GET',
        path: '/api/health'
      },
      {
        method: 'GET',
        path: '/api/suppliers'
      },
      {
        method: 'GET',
        path: '/api/customers'
      },
      {
        method: 'GET',
        path: '/api/inspections'
      },
      {
        method: 'GET',
        path: '/api/dashboard/stats'
      }
    ]
  },
  {
    name: 'read-heavy-load-test',
    description: 'Read-heavy load test focusing on GET operations',
    duration: 60, // Override with config.duration
    connections: 10, // Override with config.users
    requests: [
      {
        method: 'GET',
        path: '/api/suppliers'
      },
      {
        method: 'GET',
        path: '/api/suppliers/sup123'
      },
      {
        method: 'GET',
        path: '/api/customers'
      },
      {
        method: 'GET',
        path: '/api/customers/cust123'
      },
      {
        method: 'GET',
        path: '/api/inspections'
      },
      {
        method: 'GET',
        path: '/api/inspections/insp123'
      }
    ]
  },
  {
    name: 'write-heavy-load-test',
    description: 'Write-heavy load test with POST/PUT operations',
    duration: 60, // Override with config.duration
    connections: 5, // Half the users for write operations
    requests: [
      {
        method: 'POST',
        path: '/api/suppliers',
        body: JSON.stringify({
          name: 'Load Test Supplier',
          code: 'LTS-001',
          email: 'loadtest@example.com',
          status: 'Active'
        })
      },
      {
        method: 'POST',
        path: '/api/customers',
        body: JSON.stringify({
          name: 'Load Test Customer',
          code: 'LTC-001',
          email: 'loadtest@example.com',
          status: 'Active'
        })
      },
      {
        method: 'POST',
        path: '/api/inspections/schedule',
        body: JSON.stringify({
          title: 'Load Test Inspection',
          supplierId: 'sup123',
          scheduledDate: new Date().toISOString(),
          inspectionType: 'Regular'
        })
      }
    ]
  },
  {
    name: 'search-filter-load-test',
    description: 'Search and filter operations load test',
    duration: 60, // Override with config.duration
    connections: 10, // Override with config.users
    requests: [
      {
        method: 'GET',
        path: '/api/suppliers?search=aero'
      },
      {
        method: 'GET',
        path: '/api/suppliers?status=Active'
      },
      {
        method: 'GET',
        path: '/api/customers?search=air'
      },
      {
        method: 'GET',
        path: '/api/customers?status=Active'
      },
      {
        method: 'GET',
        path: '/api/inspections?status=Completed'
      },
      {
        method: 'GET',
        path: '/api/inspections?startDate=2023-01-01&endDate=2023-12-31'
      }
    ]
  }
];

/**
 * Run system load tests
 */
async function run(config) {
  // Get authentication token for authenticated requests
  let authToken;
  try {
    const baseURL = process.env.API_URL || 'http://localhost:5000';
    const response = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = response.data.token;
  } catch (error) {
    console.warn('Warning: Could not get authentication token. Load tests may fail.');
  }
  
  // Adjust scenarios with config values
  const scenarios = DEFAULT_SCENARIOS.map(scenario => ({
    ...scenario,
    duration: config.duration,
    connections: scenario.name.includes('write-heavy') ? Math.max(5, Math.floor(config.users / 2)) : config.users
  }));
  
  console.log(`Running ${scenarios.length} load test scenarios`);
  
  // Track process stats during test
  const processStats = {
    cpu: [],
    memory: [],
    timestamps: []
  };
  
  // Setup stat monitoring
  let statMonitoringInterval;
  
  // Run tests for each scenario
  const results = [];
  
  for (const scenario of scenarios) {
    const scenarioSpinner = createSpinner(`Running load test scenario: ${scenario.name}`).start();
    
    try {
      // Start monitoring system resource usage
      statMonitoringInterval = await startResourceMonitoring(processStats);
      
      // Run load test
      const result = await runLoadTest(scenario, authToken, config);
      
      // Stop monitoring
      clearInterval(statMonitoringInterval);
      
      // Calculate resource usage statistics
      const resourceStats = calculateResourceStats(processStats);
      
      // Combine results
      const combinedResult = {
        ...result,
        scenario: scenario.name,
        description: scenario.description,
        resourceStats,
        success: true
      };
      
      results.push(combinedResult);
      scenarioSpinner.success({ text: `Scenario ${scenario.name} completed successfully` });
      
      // Clear stats for next scenario
      processStats.cpu = [];
      processStats.memory = [];
      processStats.timestamps = [];
      
      // Wait a bit between scenarios to let system recover
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      // Stop monitoring if error occurs
      if (statMonitoringInterval) {
        clearInterval(statMonitoringInterval);
      }
      
      scenarioSpinner.error({ text: `Error running scenario ${scenario.name}: ${error.message}` });
      results.push({
        scenario: scenario.name,
        description: scenario.description,
        error: error.message,
        success: false
      });
      
      // Clear stats for next scenario
      processStats.cpu = [];
      processStats.memory = [];
      processStats.timestamps = [];
      
      // Wait a bit between scenarios to let system recover
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Generate summary stats
  const summary = generateSummary(results);
  
  // Save detailed results
  const resultPath = path.join(config.reportDir, `system-load-test-${config.timestamp}.json`);
  fs.writeFileSync(resultPath, JSON.stringify({ results, summary }, null, 2));
  
  return {
    results,
    summary,
    recommendations: generateRecommendations(results, summary)
  };
}

/**
 * Start monitoring system resources
 */
async function startResourceMonitoring(processStats) {
  // Get the server process ID (assuming it's the current process or its parent)
  const serverPid = process.env.SERVER_PID || process.pid;
  
  // Monitor every second
  return setInterval(async () => {
    try {
      const stats = await pidusage(serverPid);
      
      processStats.cpu.push(stats.cpu);
      processStats.memory.push(stats.memory / (1024 * 1024)); // Convert to MB
      processStats.timestamps.push(Date.now());
    } catch (error) {
      // Ignore errors - process might not be available
    }
  }, 1000);
}

/**
 * Calculate resource usage statistics
 */
function calculateResourceStats(processStats) {
  if (processStats.cpu.length === 0) {
    return {
      avgCpu: 0,
      maxCpu: 0,
      avgMemory: 0,
      maxMemory: 0
    };
  }
  
  const avgCpu = processStats.cpu.reduce((sum, val) => sum + val, 0) / processStats.cpu.length;
  const maxCpu = Math.max(...processStats.cpu);
  const avgMemory = processStats.memory.reduce((sum, val) => sum + val, 0) / processStats.memory.length;
  const maxMemory = Math.max(...processStats.memory);
  
  return {
    avgCpu,
    maxCpu,
    avgMemory,
    maxMemory,
    samples: processStats.cpu.length
  };
}

/**
 * Run a load test scenario using autocannon
 */
async function runLoadTest(scenario, authToken, config) {
  const baseURL = process.env.API_URL || 'http://localhost:5000';
  
  // Prepare request headers
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Setup autocannon configuration
  const cannonConfig = {
    url: baseURL,
    connections: scenario.connections,
    duration: scenario.duration,
    headers,
    requests: scenario.requests,
    timeout: 10,
    connectionRate: scenario.connections / config.rampUp,
    renderProgressBar: config.verbose,
    renderResultsTable: config.verbose,
    renderLatencyTable: config.verbose
  };
  
  // Run the test
  const result = await new Promise((resolve, reject) => {
    autocannon(cannonConfig, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          totalRequests: result.requests.total,
          successfulRequests: result.requests.total - result.non2xx,
          failedRequests: result.non2xx,
          timeouts: result.timeouts,
          errors: result.errors,
          requestsPerSecond: result.requests.average,
          latencyAvg: result.latency.average,
          latencyP95: result.latency.p95,
          latencyP99: result.latency.p99,
          throughputAvg: result.throughput.average,
          raw: {
            latency: result.latency,
            requests: result.requests,
            throughput: result.throughput
          }
        });
      }
    });
  });
  
  return result;
}

/**
 * Generate a summary of system load test results
 */
function generateSummary(results) {
  // Filter out failed tests
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length === 0) {
    return {
      avgResponseTime: 0,
      peakResponseTime: 0,
      totalRequests: 0,
      totalErrors: 0,
      sustainableRPS: 0,
      errorRate: 100,
      cpuUtilization: 0,
      memoryUtilization: 0
    };
  }
  
  // Calculate aggregate metrics
  const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.latencyAvg, 0) / successfulResults.length;
  const peakResponseTime = Math.max(...successfulResults.map(r => r.latencyP99));
  const totalRequests = successfulResults.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalErrors = successfulResults.reduce((sum, r) => sum + r.failedRequests, 0);
  const errorRate = (totalErrors / totalRequests) * 100;
  
  // Calculate sustainable RPS
  // We define sustainable RPS as the average RPS across all scenarios
  const sustainableRPS = successfulResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) / successfulResults.length;
  
  // Calculate system resource utilization
  const cpuUtilization = successfulResults.reduce((sum, r) => sum + (r.resourceStats ? r.resourceStats.avgCpu : 0), 0) / successfulResults.length;
  const memoryUtilization = successfulResults.reduce((sum, r) => sum + (r.resourceStats ? r.resourceStats.avgMemory : 0), 0) / successfulResults.length;
  
  return {
    avgResponseTime,
    peakResponseTime,
    totalRequests,
    totalErrors,
    errorRate,
    sustainableRPS,
    cpuUtilization,
    memoryUtilization,
    // Identify most resource-intensive scenario
    mostIntensiveScenario: successfulResults
      .sort((a, b) => {
        const aCpu = a.resourceStats ? a.resourceStats.maxCpu : 0;
        const bCpu = b.resourceStats ? b.resourceStats.maxCpu : 0;
        return bCpu - aCpu;
      })[0].scenario,
    // Identify highest throughput scenario
    highestThroughputScenario: successfulResults
      .sort((a, b) => b.requestsPerSecond - a.requestsPerSecond)[0].scenario
  };
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results, summary) {
  const recommendations = [];
  
  // Check for high error rate
  if (summary.errorRate > 1) {
    recommendations.push(`Error rate of ${summary.errorRate.toFixed(2)}% under load exceeds target of 1%. Investigate error handling and stability issues.`);
  }
  
  // Check for high response times
  if (summary.avgResponseTime > 500) {
    recommendations.push(`Average response time of ${summary.avgResponseTime.toFixed(2)}ms under load exceeds target of 500ms. Consider optimizing request handling or scaling resources.`);
  }
  
  // Check for CPU utilization
  if (summary.cpuUtilization > 80) {
    recommendations.push(`High CPU utilization (${summary.cpuUtilization.toFixed(2)}%) during load test. Consider horizontal scaling or optimizing CPU-intensive operations.`);
  }
  
  // Check for memory utilization
  if (summary.memoryUtilization > 2000) { // 2GB
    recommendations.push(`High memory usage (${summary.memoryUtilization.toFixed(2)}MB) during load test. Check for memory leaks or consider increasing memory allocation.`);
  }
  
  // Check for sustainable throughput
  if (summary.sustainableRPS < 50) {
    recommendations.push(`Sustainable throughput of ${summary.sustainableRPS.toFixed(2)} requests per second is below target of 50. Consider performance optimizations or scaling the system.`);
  }
  
  // Provide specific scenario recommendations
  const successfulResults = results.filter(r => r.success);
  
  // Check if write operations are slower
  const writeScenario = successfulResults.find(r => r.scenario === 'write-heavy-load-test');
  const readScenario = successfulResults.find(r => r.scenario === 'read-heavy-load-test');
  
  if (writeScenario && readScenario && writeScenario.latencyAvg > readScenario.latencyAvg * 2) {
    recommendations.push(`Write operations are significantly slower than read operations. Consider optimizing database writes or adding write-behind caching.`);
  }
  
  // Check if search/filter operations are slower
  const searchScenario = successfulResults.find(r => r.scenario === 'search-filter-load-test');
  const mixedScenario = successfulResults.find(r => r.scenario === 'mixed-load-test');
  
  if (searchScenario && mixedScenario && searchScenario.latencyAvg > mixedScenario.latencyAvg * 1.5) {
    recommendations.push(`Search and filter operations are slower than other operations. Consider adding database indexes or implementing a search service.`);
  }
  
  return recommendations;
}

module.exports = {
  run
}; 