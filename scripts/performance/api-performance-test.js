/**
 * API Performance Test Module
 * Tests API endpoints for performance and reliability
 */

class ApiPerformanceTest {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:5002';
    this.endpoints = [
      '/api/health',
      '/api/suppliers',
      '/api/customers',
      '/api/inspections',
      '/api/auth/login'
    ];
  }

  async run(config) {
    console.log('Running API performance tests...');
    
    const results = {
      endpoints: {},
      summary: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        totalResponseTime: 0
      }
    };

    // Test each endpoint
    for (const endpoint of this.endpoints) {
      const endpointResults = await this.testEndpoint(endpoint, config);
      results.endpoints[endpoint] = endpointResults;
      
      // Update summary
      results.summary.totalRequests += endpointResults.totalRequests;
      results.summary.successfulRequests += endpointResults.successfulRequests;
      results.summary.failedRequests += endpointResults.failedRequests;
      results.summary.totalResponseTime += endpointResults.totalResponseTime;
    }

    // Calculate averages
    if (results.summary.totalRequests > 0) {
      results.summary.averageResponseTime = results.summary.totalResponseTime / results.summary.totalRequests;
    }

    return results;
  }

  async testEndpoint(endpoint, config) {
    const results = {
      endpoint,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      responseTimes: [],
      errors: []
    };

    const url = `${this.baseUrl}${endpoint}`;
    const requests = config.users || 10;
    const duration = config.duration || 30;

    console.log(`Testing endpoint: ${endpoint}`);
    console.log(`Requests: ${requests}, Duration: ${duration}s`);

    // Simulate load testing
    for (let i = 0; i < requests; i++) {
      const startTime = Date.now();
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const responseTime = Date.now() - startTime;
        results.totalResponseTime += responseTime;
        results.responseTimes.push(responseTime);
        results.totalRequests++;

        if (response.ok) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
          results.errors.push(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        results.failedRequests++;
        results.errors.push(error.message);
      }

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}

module.exports = new ApiPerformanceTest(); 