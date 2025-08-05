/**
 * CircuitBreaker.js
 * 
 * Circuit breaker pattern implementation for resilient service calls
 * Implements RF043 - Add circuit breakers for resilience
 */

const EventEmitter = require('events');
const logger = require('./logger');

/**
 * Circuit breaker states
 */
const CircuitState = {
  CLOSED: 'CLOSED',     // Circuit is closed, requests flow normally
  OPEN: 'OPEN',         // Circuit is open, requests are short-circuited
  HALF_OPEN: 'HALF_OPEN' // Circuit is testing if service is healthy again
};

/**
 * Circuit breaker implementation
 * Prevents cascading failures by stopping requests to failing services
 */
class CircuitBreaker {
  /**
   * Create a new circuit breaker
   * @param {Object} options - Circuit breaker options
   * @param {number} options.failureThreshold - Number of failures before opening circuit (default: 5)
   * @param {number} options.resetTimeout - Time in ms to wait before trying again (default: 30000)
   * @param {number} options.halfOpenSuccessThreshold - Number of successful calls to close circuit (default: 2)
   * @param {number} options.timeout - Timeout for function calls in ms (default: 10000)
   * @param {Function} options.fallbackFn - Fallback function to call when circuit is open
   * @param {string} options.name - Name of this circuit breaker (for logging)
   */
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold || 2;
    this.timeout = options.timeout || 10000;
    this.fallbackFn = options.fallbackFn;
    this.name = options.name || 'default';
    
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.resetTimer = null;
    
    this.events = new EventEmitter();
    
    logger.info(`Circuit breaker '${this.name}' initialized`);
  }
  
  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Function to execute
   * @param {Array} args - Arguments to pass to the function
   * @returns {Promise<*>} - Result of the function or fallback
   */
  async execute(fn, ...args) {
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try again
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this._setHalfOpen();
      } else {
        return this._handleOpenCircuit(args);
      }
    }
    
    try {
      // Execute with timeout
      const result = await this._executeWithTimeout(fn, args);
      
      this._handleSuccess();
      return result;
    } catch (error) {
      return this._handleFailure(error, args);
    }
  }
  
  /**
   * Execute a function with a timeout
   * @param {Function} fn - Function to execute
   * @param {Array} args - Arguments to pass to the function
   * @returns {Promise<*>} - Result of the function
   * @private
   */
  async _executeWithTimeout(fn, args) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Circuit breaker '${this.name}' timeout after ${this.timeout}ms`));
      }, this.timeout);
      
      Promise.resolve(fn(...args))
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
  
  /**
   * Handle a successful execution
   * @private
   */
  _handleSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this._setClosed();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count after a successful call
      this.failureCount = 0;
    }
  }
  
  /**
   * Handle a failed execution
   * @param {Error} error - The error that occurred
   * @param {Array} args - Arguments passed to the original function
   * @returns {Promise<*>} - Result of the fallback function
   * @private
   */
  async _handleFailure(error, args) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    // Log the failure
    logger.warn(`Circuit breaker '${this.name}' failure: ${error.message}`);
    
    // Check if we need to open the circuit
    if (this.state === CircuitState.CLOSED && this.failureCount >= this.failureThreshold) {
      this._setOpen();
    } else if (this.state === CircuitState.HALF_OPEN) {
      this._setOpen();
    }
    
    // Call fallback or rethrow
    if (typeof this.fallbackFn === 'function') {
      return this.fallbackFn(...args, error);
    }
    
    throw error;
  }
  
  /**
   * Handle an open circuit
   * @param {Array} args - Arguments passed to the original function
   * @returns {Promise<*>} - Result of the fallback function
   * @private
   */
  async _handleOpenCircuit(args) {
    logger.debug(`Circuit breaker '${this.name}' is open, short-circuiting request`);
    
    if (typeof this.fallbackFn === 'function') {
      return this.fallbackFn(...args, new Error(`Circuit breaker '${this.name}' is open`));
    }
    
    throw new Error(`Circuit breaker '${this.name}' is open`);
  }
  
  /**
   * Set circuit to closed state
   * @private
   */
  _setClosed() {
    if (this.state !== CircuitState.CLOSED) {
      logger.info(`Circuit breaker '${this.name}' closed`);
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.successCount = 0;
      this.events.emit('closed');
    }
  }
  
  /**
   * Set circuit to open state
   * @private
   */
  _setOpen() {
    if (this.state !== CircuitState.OPEN) {
      logger.warn(`Circuit breaker '${this.name}' opened`);
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      this.events.emit('open');
      
      // Schedule reset timer
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
      
      this.resetTimer = setTimeout(() => {
        this._setHalfOpen();
      }, this.resetTimeout);
    }
  }
  
  /**
   * Set circuit to half-open state
   * @private
   */
  _setHalfOpen() {
    if (this.state !== CircuitState.HALF_OPEN) {
      logger.info(`Circuit breaker '${this.name}' half-open`);
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      this.events.emit('half-open');
    }
  }
  
  /**
   * Force circuit to closed state
   */
  forceClosed() {
    this._setClosed();
  }
  
  /**
   * Force circuit to open state
   */
  forceOpen() {
    this._setOpen();
  }
  
  /**
   * Get current circuit state
   * @returns {string} - Current state
   */
  getState() {
    return this.state;
  }
  
  /**
   * Get circuit metrics
   * @returns {Object} - Circuit metrics
   */
  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      name: this.name
    };
  }
  
  /**
   * Subscribe to circuit events
   * @param {string} event - Event name ('open', 'closed', 'half-open')
   * @param {Function} listener - Event listener
   */
  on(event, listener) {
    this.events.on(event, listener);
  }
  
  /**
   * Unsubscribe from circuit events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  off(event, listener) {
    this.events.off(event, listener);
  }
}

module.exports = {
  CircuitBreaker,
  CircuitState
}; 