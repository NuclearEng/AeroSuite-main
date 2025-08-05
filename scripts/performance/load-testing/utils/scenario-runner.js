/**
 * Scenario Runner
 * 
 * This module executes test scenarios defined in the scenarios directory.
 * It provides a consistent way to run scenarios and collect metrics.
 * 
 * Task: TS354 - Load testing implementation
 */

const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { performance } = require('perf_hooks');

// Create axios client with defaults
const createClient = (config) => {
  return axios.create({
    baseURL: config.targetUrl,
    timeout: config.timeout || 30000,
    headers: {
      'User-Agent': 'AeroSuite-LoadTest/1.0',
      'X-Load-Test': 'true',
      ...config.headers
    }
  });
};

/**
 * Run a predefined scenario
 * @param {Object} config - Test configuration
 * @param {Object} metrics - Metrics object to update
 * @returns {Promise<void>}
 */
async function runScenario(config, metrics = { 
  totalRequests: 0, 
  successfulRequests: 0, 
  failedRequests: 0, 
  responseTimes: [],
  scenarios: {} 
}) {
  // If specific scenario is specified, run it
  if (config.scenario) {
    await runNamedScenario(config.scenario, config, metrics);
  } else {
    // Otherwise run default request flow
    await runDefaultScenario(config, metrics);
  }
}

/**
 * Run a specific named scenario
 * @param {string} scenarioName - Name of the scenario
 * @param {Object} config - Test configuration
 * @param {Object} metrics - Metrics object to update
 * @returns {Promise<void>}
 */
async function runNamedScenario(scenarioName, config, metrics) {
  try {
    // Initialize scenario metrics if not exists
    if (!metrics.scenarios[scenarioName]) {
      metrics.scenarios[scenarioName] = {
        requests: 0,
        success: 0,
        failed: 0,
        responseTimes: []
      };
    }

    // Try to load the scenario module
    const scenarioPath = path.join(__dirname, '..', 'scenarios', `${scenarioName}.js`);
    if (fs.existsSync(scenarioPath)) {
      const scenario = require(scenarioPath);
      
      // Create a client for the scenario
      const client = createClient(config);
      
      // Measure execution time
      const startTime = performance.now();
      
      // Run the scenario
      await scenario.run(client, config);
      
      // Update metrics
      const duration = performance.now() - startTime;
      metrics.scenarios[scenarioName].requests++;
      metrics.scenarios[scenarioName].success++;
      metrics.scenarios[scenarioName].responseTimes.push(duration);
      
      // Update global metrics
      metrics.totalRequests++;
      metrics.successfulRequests++;
      metrics.responseTimes.push(duration);
    } else {
      console.error(`Scenario ${scenarioName} not found`);
      metrics.scenarios[scenarioName].failed++;
      metrics.failedRequests++;
    }
  } catch (error) {
    // Update error metrics
    metrics.scenarios[scenarioName].failed++;
    metrics.failedRequests++;
    
    // Rethrow for main error handling
    throw error;
  }
}

/**
 * Run the default scenario (making requests to random endpoints)
 * @param {Object} config - Test configuration
 * @param {Object} metrics - Metrics object to update
 * @returns {Promise<void>}
 */
async function runDefaultScenario(config, metrics) {
  // Default endpoints if none provided
  const endpoints = config.endpoints || ['/health', '/api/customers', '/api/suppliers', '/api/inspections'];
  
  // Select a random endpoint
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  // Generate request ID for tracing
  const requestId = `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  try {
    // Create a client
    const client = createClient(config);
    
    // Measure request time
    const startTime = performance.now();
    
    // Make the request
    await client.get(endpoint, {
      headers: {
        'X-Request-ID': requestId
      }
    });
    
    // Calculate duration
    const duration = performance.now() - startTime;
    
    // Update metrics
    metrics.totalRequests++;
    metrics.successfulRequests++;
    metrics.responseTimes.push(duration);
    
    // Initialize endpoint metrics if not exists
    const scenarioName = `endpoint_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    if (!metrics.scenarios[scenarioName]) {
      metrics.scenarios[scenarioName] = {
        requests: 0,
        success: 0,
        failed: 0,
        responseTimes: []
      };
    }
    
    // Update endpoint-specific metrics
    metrics.scenarios[scenarioName].requests++;
    metrics.scenarios[scenarioName].success++;
    metrics.scenarios[scenarioName].responseTimes.push(duration);
  } catch (error) {
    metrics.totalRequests++;
    metrics.failedRequests++;
    
    // Update endpoint-specific metrics if possible
    if (endpoint) {
      const scenarioName = `endpoint_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      if (!metrics.scenarios[scenarioName]) {
        metrics.scenarios[scenarioName] = {
          requests: 0,
          success: 0,
          failed: 0,
          responseTimes: []
        };
      }
      metrics.scenarios[scenarioName].requests++;
      metrics.scenarios[scenarioName].failed++;
    }
    
    // Rethrow for main error handling
    throw error;
  }
}

module.exports = {
  runScenario,
  runNamedScenario,
  runDefaultScenario
}; 