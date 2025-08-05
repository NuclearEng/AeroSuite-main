/**
 * circuit-breaker-example.js
 * 
 * Example usage of circuit breakers
 * Implements RF043 - Add circuit breakers for resilience
 */

const express = require('express');
const { CircuitBreaker, CircuitBreakerRegistry } = require('../infrastructure');
const { circuitBreaker } = require('../core/middleware');
const CircuitBreakerMonitoring = require('../infrastructure/monitoring/CircuitBreakerMonitoring');

// Create Express app
const app = express();

// Initialize circuit breaker monitoring
const monitoring = CircuitBreakerMonitoring.getInstance();

// Example 1: Using the circuit breaker middleware
app.get('/api/example/middleware',
  // Apply circuit breaker middleware
  circuitBreaker({
    name: 'example-middleware',
    circuitOptions: {
      failureThreshold: 3,
      resetTimeout: 10000, // 10 seconds
      timeout: 5000 // 5 seconds
    }
  }),
  // Actual route handler
  (req, res) => {
    // Simulate random failures
    if (Math.random() < 0.5) {
      res.status(200).json({ success: true, message: 'Request successful' });
    } else {
      // This will trigger the circuit breaker after 3 failures
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// Example 2: Using the circuit breaker directly with a service
class ExampleService {
  constructor() {
    // Get circuit breaker registry
    this.registry = CircuitBreakerRegistry.getInstance();
    
    // Create circuit breaker for this service
    this.breaker = this.registry.getOrCreate('example-service', {
      failureThreshold: 3,
      resetTimeout: 10000, // 10 seconds
      timeout: 5000, // 5 seconds
      fallbackFn: this.fallbackMethod.bind(this)
    });
  }
  
  async getData(id) {
    // Execute with circuit breaker protection
    return this.breaker.execute(async () => {
      // Simulate API call or database query
      const result = await this.fetchData(id);
      return result;
    });
  }
  
  async fetchData(id) {
    // Simulate random failures
    if (Math.random() < 0.5) {
      return { id, name: 'Example Data', value: Math.random() };
    } else {
      throw new Error('Failed to fetch data');
    }
  }
  
  fallbackMethod(id, error) {
    // Return fallback data when circuit is open
    return {
      id,
      name: 'Fallback Data',
      value: 0,
      fromFallback: true,
      error: error.message
    };
  }
}

// Create example service
const exampleService = new ExampleService();

// Example 2 endpoint
app.get('/api/example/service/:id', async (req, res) => {
  try {
    const data = await exampleService.getData(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Circuit breaker dashboard
app.get('/circuit-breaker-dashboard', (req, res) => {
  res.send(monitoring.getDashboardHtml());
});

// Circuit breaker metrics API
app.get('/api/circuit-breakers', (req, res) => {
  res.json(monitoring.getMetrics());
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Circuit breaker example running on port ${PORT}`);
  console.log(`Dashboard available at: http://localhost:${PORT}/circuit-breaker-dashboard`);
  console.log(`Metrics API available at: http://localhost:${PORT}/api/circuit-breakers`);
});

// Example 3: Using circuit breaker with external API calls
const axios = require('axios');

// Create circuit breaker for external API
const apiBreaker = CircuitBreakerRegistry.getInstance().getOrCreate('external-api', {
  failureThreshold: 2,
  resetTimeout: 15000, // 15 seconds
  timeout: 3000 // 3 seconds
});

// Example API endpoint
app.get('/api/external-data', async (req, res) => {
  try {
    // Execute API call with circuit breaker protection
    const data = await apiBreaker.execute(async () => {
      const response = await axios.get('https://jsonplaceholder.typicode.com/posts/1', {
        timeout: 2000 // 2 seconds timeout
      });
      return response.data;
    });
    
    res.json(data);
  } catch (error) {
    if (error.message.includes('circuit breaker')) {
      res.status(503).json({ error: 'Service temporarily unavailable' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = app; // Export for testing 