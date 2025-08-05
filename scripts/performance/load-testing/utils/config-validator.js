/**
 * Configuration Validator
 * 
 * This module validates load test configuration to ensure it meets requirements.
 * It checks for required parameters and validates their values.
 * 
 * Task: TS354 - Load testing implementation
 */

/**
 * Validate load test configuration
 * @param {Object} config - Test configuration
 * @returns {Object} Validation result {valid: boolean, error: string}
 */
function validateConfig(config) {
  // Check if config is an object
  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      error: 'Configuration must be an object'
    };
  }
  
  // Check required parameters
  if (!config.targetUrl) {
    return {
      valid: false,
      error: 'Target URL is required'
    };
  }
  
  // Validate target URL format
  if (!isValidUrl(config.targetUrl)) {
    return {
      valid: false,
      error: `Invalid target URL: ${config.targetUrl}`
    };
  }
  
  // Validate concurrent users
  if (config.concurrentUsers !== undefined) {
    if (!Number.isInteger(config.concurrentUsers) || config.concurrentUsers < 1) {
      return {
        valid: false,
        error: 'Concurrent users must be a positive integer'
      };
    }
    
    // Warn about high number of users
    if (config.concurrentUsers > 1000) {
      console.warn(`Warning: High number of concurrent users (${config.concurrentUsers}). This may impact test system performance.`);
    }
  }
  
  // Validate test duration
  if (config.testDurationSec !== undefined) {
    if (!Number.isInteger(config.testDurationSec) || config.testDurationSec < 1) {
      return {
        valid: false,
        error: 'Test duration must be a positive integer'
      };
    }
    
    // Warn about long duration
    if (config.testDurationSec > 3600) {
      console.warn(`Warning: Long test duration (${config.testDurationSec} seconds). Consider using a shorter duration.`);
    }
  }
  
  // Validate worker count
  if (config.workers !== undefined) {
    if (!Number.isInteger(config.workers) || config.workers < 0) {
      return {
        valid: false,
        error: 'Worker count must be a non-negative integer'
      };
    }
  }
  
  // Validate warmup period
  if (config.warmupPeriodSec !== undefined) {
    if (!Number.isInteger(config.warmupPeriodSec) || config.warmupPeriodSec < 0) {
      return {
        valid: false,
        error: 'Warmup period must be a non-negative integer'
      };
    }
  }
  
  // Validate ramp-up period
  if (config.rampUpPeriodSec !== undefined) {
    if (!Number.isInteger(config.rampUpPeriodSec) || config.rampUpPeriodSec < 0) {
      return {
        valid: false,
        error: 'Ramp-up period must be a non-negative integer'
      };
    }
  }
  
  // Validate timeout
  if (config.timeout !== undefined) {
    if (!Number.isInteger(config.timeout) || config.timeout < 1000) {
      return {
        valid: false,
        error: 'Timeout must be at least 1000 ms'
      };
    }
  }
  
  // Validate headers if present
  if (config.headers !== undefined && typeof config.headers !== 'object') {
    return {
      valid: false,
      error: 'Headers must be an object'
    };
  }
  
  // Validate scenario if present
  if (config.scenario !== undefined && typeof config.scenario !== 'string') {
    return {
      valid: false,
      error: 'Scenario must be a string'
    };
  }
  
  // Validate endpoints if present
  if (config.endpoints !== undefined) {
    if (!Array.isArray(config.endpoints) || config.endpoints.length === 0) {
      return {
        valid: false,
        error: 'Endpoints must be a non-empty array'
      };
    }
    
    // Check that all endpoints are strings
    if (config.endpoints.some(endpoint => typeof endpoint !== 'string')) {
      return {
        valid: false,
        error: 'All endpoints must be strings'
      };
    }
  }
  
  // All validations passed
  return {
    valid: true
  };
}

/**
 * Check if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid URL
 */
function isValidUrl(url) {
  try {
    // Simple validation - proper URL validation is complex
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  validateConfig
}; 