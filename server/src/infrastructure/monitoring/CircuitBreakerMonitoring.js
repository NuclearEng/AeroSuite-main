/**
 * CircuitBreakerMonitoring.js
 * 
 * Monitoring for circuit breakers
 * Implements RF043 - Add circuit breakers for resilience
 */

const CircuitBreakerRegistry = require('../CircuitBreakerRegistry');
const { CircuitState } = require('../CircuitBreaker');
const logger = require('../logger');

let promClient;
try {
  promClient = require('prom-client');
} catch (error) {
  logger.warn('prom-client not available, circuit breaker metrics will not be exported to Prometheus');
}

/**
 * Circuit breaker monitoring
 * Collects and exports circuit breaker metrics
 */
class CircuitBreakerMonitoring {
  /**
   * Create a new circuit breaker monitoring instance
   * @param {Object} options - Monitoring options
   * @param {Object} options.registry - Prometheus registry
   */
  constructor(options = {}) {
    this.registry = CircuitBreakerRegistry.getInstance();
    this.promRegistry = options.registry;
    this.metrics = {};
    
    if (promClient) {
      this._initializeMetrics();
    }
    
    logger.info('Circuit breaker monitoring initialized');
  }
  
  /**
   * Get the singleton instance
   * @param {Object} options - Monitoring options
   * @returns {CircuitBreakerMonitoring} - The singleton instance
   */
  static getInstance(options) {
    if (!CircuitBreakerMonitoring.instance) {
      CircuitBreakerMonitoring.instance = new CircuitBreakerMonitoring(options);
    }
    
    return CircuitBreakerMonitoring.instance;
  }
  
  /**
   * Initialize Prometheus metrics
   * @private
   */
  _initializeMetrics() {
    if (!promClient) {
      return;
    }
    
    this.metrics.state = new promClient.Gauge({
      name: 'circuit_breaker_state',
      help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
      labelNames: ['name'],
      registers: this.promRegistry ? [this.promRegistry] : undefined
    });
    
    this.metrics.failures = new promClient.Counter({
      name: 'circuit_breaker_failures_total',
      help: 'Total number of circuit breaker failures',
      labelNames: ['name'],
      registers: this.promRegistry ? [this.promRegistry] : undefined
    });
    
    this.metrics.successes = new promClient.Counter({
      name: 'circuit_breaker_successes_total',
      help: 'Total number of circuit breaker successes',
      labelNames: ['name'],
      registers: this.promRegistry ? [this.promRegistry] : undefined
    });
    
    this.metrics.opens = new promClient.Counter({
      name: 'circuit_breaker_opens_total',
      help: 'Total number of times a circuit breaker has opened',
      labelNames: ['name'],
      registers: this.promRegistry ? [this.promRegistry] : undefined
    });
    
    this.metrics.lastFailureTime = new promClient.Gauge({
      name: 'circuit_breaker_last_failure_timestamp',
      help: 'Timestamp of the last failure',
      labelNames: ['name'],
      registers: this.promRegistry ? [this.promRegistry] : undefined
    });
    
    // Attach event listeners to all circuit breakers
    this._attachEventListeners();
  }
  
  /**
   * Attach event listeners to circuit breakers
   * @private
   */
  _attachEventListeners() {
    const breakers = this.registry.getAll();
    
    for (const [name, breaker] of breakers.entries()) {
      this._attachBreakerListeners(name, breaker);
    }
    
    // Listen for new circuit breakers
    const originalGetOrCreate = this.registry.getOrCreate.bind(this.registry);
    this.registry.getOrCreate = (name, options) => {
      const breaker = originalGetOrCreate(name, options);
      
      // If this is a new breaker, attach listeners
      if (!this.registry.has(name)) {
        this._attachBreakerListeners(name, breaker);
      }
      
      return breaker;
    };
  }
  
  /**
   * Attach listeners to a specific circuit breaker
   * @param {string} name - Circuit breaker name
   * @param {CircuitBreaker} breaker - Circuit breaker instance
   * @private
   */
  _attachBreakerListeners(name, breaker) {
    if (!promClient) {
      return;
    }
    
    // Update state metric when state changes
    const updateState = () => {
      const state = breaker.getState();
      let stateValue;
      
      switch (state) {
        case CircuitState.CLOSED:
          stateValue = 0;
          break;
        case CircuitState.HALF_OPEN:
          stateValue = 1;
          break;
        case CircuitState.OPEN:
          stateValue = 2;
          break;
        default:
          stateValue = -1;
      }
      
      this.metrics.state.set({ name }, stateValue);
    };
    
    // Set initial state
    updateState();
    
    // Listen for state changes
    breaker.on('open', () => {
      updateState();
      this.metrics.opens.inc({ name });
    });
    
    breaker.on('half-open', updateState);
    breaker.on('closed', updateState);
    
    // Wrap execute method to track metrics
    const originalExecute = breaker.execute.bind(breaker);
    breaker.execute = async (fn, ...args) => {
      try {
        const result = await originalExecute(fn, ...args);
        this.metrics.successes.inc({ name });
        return result;
      } catch (error) {
        this.metrics.failures.inc({ name });
        
        const metrics = breaker.getMetrics();
        if (metrics.lastFailureTime) {
          this.metrics.lastFailureTime.set(
            { name },
            Math.floor(metrics.lastFailureTime / 1000)
          );
        }
        
        throw error;
      }
    };
  }
  
  /**
   * Get current metrics for all circuit breakers
   * @returns {Array<Object>} - Array of circuit breaker metrics
   */
  getMetrics() {
    return this.registry.getAllMetrics();
  }
  
  /**
   * Get HTML dashboard for circuit breakers
   * @returns {string} - HTML dashboard
   */
  getDashboardHtml() {
    const metrics = this.getMetrics();
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Circuit Breaker Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .breaker { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
          .closed { border-left: 5px solid green; }
          .half-open { border-left: 5px solid orange; }
          .open { border-left: 5px solid red; }
          .metrics { display: flex; flex-wrap: wrap; }
          .metric { margin-right: 20px; margin-bottom: 10px; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Circuit Breaker Dashboard</h1>
        <div id="breakers">
    `;
    
    metrics.forEach(metric => {
      const stateClass = metric.state.toLowerCase();
      const lastFailure = metric.lastFailureTime 
        ? new Date(metric.lastFailureTime).toLocaleString()
        : 'None';
      
      html += `
        <div class="breaker ${stateClass}">
          <h2>${metric.name}</h2>
          <div class="metrics">
            <div class="metric">
              <span class="label">State:</span> ${metric.state}
            </div>
            <div class="metric">
              <span class="label">Failures:</span> ${metric.failureCount}
            </div>
            <div class="metric">
              <span class="label">Successes:</span> ${metric.successCount}
            </div>
            <div class="metric">
              <span class="label">Last Failure:</span> ${lastFailure}
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
        <script>
          // Auto-refresh every 5 seconds
          setTimeout(() => {
            location.reload();
          }, 5000);
        </script>
      </body>
      </html>
    `;
    
    return html;
  }
}

module.exports = CircuitBreakerMonitoring; 