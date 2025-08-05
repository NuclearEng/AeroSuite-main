/**
 * Service.js
 * 
 * Base class for all domain services
 * Services contain the business logic of the application
 */

const { DomainError } = require('./errors');

class Service {
  /**
   * Create a new Service
   * @param {Object} dependencies - Dependencies for the service
   */
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.logger = dependencies.logger || console;
  }

  /**
   * Get a dependency
   * @param {string} name - Name of the dependency
   * @returns {Object} - Dependency
   * @throws {Error} - If the dependency is not found
   */
  getDependency(name) {
    if (!this.dependencies[name]) {
      throw new Error(`Dependency ${name} not found`);
    }
    
    return this.dependencies[name];
  }

  /**
   * Validate input against a schema
   * @param {Object} input - Input to validate
   * @param {Object} schema - Schema to validate against
   * @returns {Object} - Validation result with isValid and errors properties
   */
  validate(input, schema) {
    if (!schema || typeof schema.validate !== 'function') {
      throw new Error('Invalid schema provided for validation');
    }
    
    try {
      const result = schema.validate(input, { abortEarly: false });
      
      if (result.error) {
        return {
          isValid: false,
          errors: result.error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        };
      }
      
      return {
        isValid: true,
        value: result.value
      };
    } catch (error) {
      this.logger.error('Validation error:', error);
      
      return {
        isValid: false,
        errors: [{ message: 'Validation failed' }]
      };
    }
  }

  /**
   * Execute a business rule
   * @param {Function} rule - Business rule function
   * @param {Array} args - Arguments for the rule
   * @returns {*} - Result of the rule
   * @throws {DomainError} - If the rule throws an error
   */
  executeRule(rule, ...args) {
    try {
      return rule(...args);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      
      throw new DomainError(error.message);
    }
  }
}

module.exports = Service; 