/**
 * CircuitBreakerRegistry.js
 * 
 * Registry for managing multiple circuit breakers
 * Implements RF043 - Add circuit breakers for resilience
 */

const { CircuitBreaker } = require('./CircuitBreaker');
const logger = require('./logger');

/**
 * Circuit breaker registry
 * Manages multiple circuit breakers by name
 */
class CircuitBreakerRegistry {
  /**
   * Create a new circuit breaker registry
   */
  constructor() {
    this.breakers = new Map();
    this.defaultOptions = {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenSuccessThreshold: 2,
      timeout: 10000
    };
    
    logger.info('Circuit breaker registry initialized');
  }
  
  /**
   * Get the singleton instance of the registry
   * @returns {CircuitBreakerRegistry} - The singleton instance
   */
  static getInstance() {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    
    return CircuitBreakerRegistry.instance;
  }
  
  /**
   * Set default options for new circuit breakers
   * @param {Object} options - Default options
   */
  setDefaultOptions(options) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
  
  /**
   * Get or create a circuit breaker
   * @param {string} name - Name of the circuit breaker
   * @param {Object} options - Circuit breaker options
   * @returns {CircuitBreaker} - The circuit breaker
   */
  getOrCreate(name, options = {}) {
    if (this.breakers.has(name)) {
      return this.breakers.get(name);
    }
    
    const breaker = new CircuitBreaker({
      ...this.defaultOptions,
      ...options,
      name
    });
    
    this.breakers.set(name, breaker);
    return breaker;
  }
  
  /**
   * Get a circuit breaker by name
   * @param {string} name - Name of the circuit breaker
   * @returns {CircuitBreaker|null} - The circuit breaker or null if not found
   */
  get(name) {
    return this.breakers.get(name) || null;
  }
  
  /**
   * Check if a circuit breaker exists
   * @param {string} name - Name of the circuit breaker
   * @returns {boolean} - True if the circuit breaker exists
   */
  has(name) {
    return this.breakers.has(name);
  }
  
  /**
   * Remove a circuit breaker
   * @param {string} name - Name of the circuit breaker
   * @returns {boolean} - True if the circuit breaker was removed
   */
  remove(name) {
    return this.breakers.delete(name);
  }
  
  /**
   * Get all circuit breakers
   * @returns {Map<string, CircuitBreaker>} - Map of all circuit breakers
   */
  getAll() {
    return this.breakers;
  }
  
  /**
   * Get metrics for all circuit breakers
   * @returns {Array<Object>} - Array of circuit breaker metrics
   */
  getAllMetrics() {
    const metrics = [];
    
    for (const [name, breaker] of this.breakers.entries()) {
      metrics.push(breaker.getMetrics());
    }
    
    return metrics;
  }
  
  /**
   * Reset all circuit breakers to closed state
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.forceClosed();
    }
    
    logger.info('All circuit breakers reset to closed state');
  }
}

module.exports = CircuitBreakerRegistry; 