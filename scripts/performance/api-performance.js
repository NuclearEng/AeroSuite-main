/**
 * API Performance Testing Module
 * 
 * This module tests the performance of API endpoints by sending a high volume
 * of requests and measuring response times, throughput, and error rates.
 */

const axios = require('axios');
const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');
const { createSpinner } = require('nanospinner');

// Default API endpoints to test if none specified
const DEFAULT_ENDPOINTS = [
  { name: 'health', path: '/api/health', method: 'GET' },
  { name: 'login', path: '/api/auth/login', method: 'POST', payload: { email: 'test@example.com', password: 'password123' } },
  { name: 'suppliers-list', path: '/api/suppliers', method: 'GET' },
  { name: 'customers-list', path: '/api/customers', method: 'GET' },
  { name: 'inspections-list', path: '/api/inspections', method: 'GET' },
  { name: 'dashboard-stats', path: '/api/dashboard/stats', method: 'GET' },
];

/**
 * Run API performance tests
 */
async function run(config) {
  // Determine which endpoints to test
  const endpointsToTest = config.endpoints.length > 0
    ? config.endpoints.map(endpoint => {
        const [path, method = 'GET'] = endpoint.split(':');
        return { name: path.replace(/\//g, '-').slice(1), path, method };
      })
    : DEFAULT_ENDPOINTS;

  console.log(`Testing ${endpointsToTest.length} API endpoints`);
  
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
    console.warn('Warning: Could not get authentication token. Some tests may fail.');
  }

  // Configure autocannon for each endpoint
  const results = [];
  
  for (const endpoint of endpointsToTest) {
    const spinner = createSpinner(`Testing endpoint: ${endpoint.path} [${endpoint.method}]`).start();
    
    try {
      const result = await testEndpoint(endpoint, config, authToken);
      results.push(result);
      spinner.success({ text: `Endpoint ${endpoint.path} [${endpoint.method}] tested successfully` });
    } catch (error) {
      spinner.error({ text: `Error testing endpoint ${endpoint.path}: ${error.message}` });
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        error: error.message,
        success: false
      });
    }
  }
  
  // Generate summary stats
  const summary = generateSummary(results);
  
  // Save detailed results
  const resultPath = path.join(config.reportDir, `api-performance-${config.timestamp}.json`);
  fs.writeFileSync(resultPath, JSON.stringify({ results, summary }, null, 2));
  
  return {
    results,
    summary,
    recommendations: generateRecommendations(results, summary)
  };
}

/**
 * Test a single API endpoint using autocannon
 */
async function testEndpoint(endpoint, config, authToken) {
  const baseURL = process.env.API_URL || 'http://localhost:5000';
  const url = `${baseURL}${endpoint.path}`;
  
  // Prepare request headers
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (authToken && endpoint.path !== '/api/auth/login') {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Setup autocannon configuration
  const cannonConfig = {
    url,
    method: endpoint.method,
    headers,
    connections: config.users,
    duration: config.duration,
    timeout: 10,
    maxConnectionRequests: 0,
    connectionRate: config.users / config.rampUp,
    renderProgressBar: config.verbose,
    renderResultsTable: config.verbose,
    renderLatencyTable: config.verbose
  };
  
  // Add body for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.payload) {
    cannonConfig.body = JSON.stringify(endpoint.payload);
  }
  
  // Run the test
  const result = await new Promise((resolve) => {
    autocannon(cannonConfig, (err, result) => {
      if (err) {
        resolve({ error: err.message, success: false });
      } else {
        resolve({
          endpoint: endpoint.path,
          method: endpoint.method,
          requestsPerSecond: result.requests.average,
          latencyAvg: result.latency.average,
          latencyP95: result.latency.p95,
          latencyP99: result.latency.p99,
          throughput: result.throughput.average,
          errors: result.errors,
          timeouts: result.timeouts,
          non2xx: result.non2xx,
          success: result.non2xx === 0 && result.errors === 0 && result.timeouts === 0,
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
 * Generate a summary of the API performance test results
 */
function generateSummary(results) {
  // Filter out failed tests
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length === 0) {
    return {
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: 0,
      errorRate: 100,
      successRate: 0,
      throughput: 0
    };
  }
  
  // Calculate aggregate metrics
  const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.latencyAvg, 0) / successfulResults.length;
  const maxResponseTime = Math.max(...successfulResults.map(r => r.latencyP99));
  const minResponseTime = Math.min(...successfulResults.map(r => r.latencyAvg));
  const p95ResponseTime = successfulResults.reduce((sum, r) => sum + r.latencyP95, 0) / successfulResults.length;
  const p99ResponseTime = successfulResults.reduce((sum, r) => sum + r.latencyP99, 0) / successfulResults.length;
  const requestsPerSecond = successfulResults.reduce((sum, r) => sum + r.requestsPerSecond, 0);
  const throughput = successfulResults.reduce((sum, r) => sum + r.throughput, 0);
  
  // Calculate error metrics
  const totalEndpoints = results.length;
  const failedEndpoints = results.filter(r => !r.success).length;
  const errorRate = (failedEndpoints / totalEndpoints) * 100;
  const successRate = ((totalEndpoints - failedEndpoints) / totalEndpoints) * 100;
  
  return {
    avgResponseTime,
    maxResponseTime,
    minResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    requestsPerSecond,
    errorRate,
    successRate,
    throughput,
    // Identify slowest endpoints
    slowestEndpoints: successfulResults
      .sort((a, b) => b.latencyAvg - a.latencyAvg)
      .slice(0, 3)
      .map(r => ({
        endpoint: r.endpoint,
        method: r.method,
        latency: r.latencyAvg
      }))
  };
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results, summary) {
  const recommendations = [];
  
  // Check for slow endpoints
  if (summary.avgResponseTime > 500) {
    recommendations.push('API response times are above 500ms on average. Consider optimizing database queries or implementing caching.');
  }
  
  // Check for high error rate
  if (summary.errorRate > 5) {
    recommendations.push(`Error rate of ${summary.errorRate.toFixed(2)}% exceeds recommended threshold of 5%. Review error logs for details.`);
  }
  
  // Specific endpoint recommendations
  summary.slowestEndpoints.forEach(endpoint => {
    if (endpoint.latency > 1000) {
      recommendations.push(`Endpoint ${endpoint.endpoint} [${endpoint.method}] is very slow (${endpoint.latency.toFixed(2)}ms). Consider optimizing or adding caching.`);
    }
  });
  
  // Throughput recommendations
  if (summary.requestsPerSecond < 50) {
    recommendations.push('API throughput is below target. Consider horizontal scaling or optimizing request handling.');
  }
  
  return recommendations;
}

module.exports = {
  run
}; 