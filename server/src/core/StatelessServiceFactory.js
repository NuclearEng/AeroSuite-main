/**
 * StatelessServiceFactory.js
 * 
 * Factory for creating stateless service instances
 * Implements RF037 - Ensure all services are stateless
 */

const { DomainError } = require('./errors');
const EventEmitter = require('./EventEmitter');
const ServiceRegistry = require('./interfaces/ServiceRegistry');

/**
 * Stateless Service Factory
 * Creates and manages stateless service instances
 */
class StatelessServiceFactory {
  /**
   * Create a new stateless service factory
   */
  constructor() {
    this.serviceRegistry = ServiceRegistry.getInstance();
    this.eventEmitter = EventEmitter.getInstance();
    this.serviceConstructors = new Map();
    this.serviceConfigs = new Map();
    this.serviceInstances = new Map();
  }
  
  /**
   * Get the singleton instance of the factory
   * @returns {StatelessServiceFactory} - The singleton instance
   */
  static getInstance() {
    if (!StatelessServiceFactory.instance) {
      StatelessServiceFactory.instance = new StatelessServiceFactory();
    }
    
    return StatelessServiceFactory.instance;
  }
  
  /**
   * Register a service constructor
   * @param {string} serviceType - Type of service
   * @param {Function} constructor - Service constructor
   * @param {Object} defaultConfig - Default configuration for the service
   */
  registerServiceType(serviceType, constructor, defaultConfig = {}) {
    if (this.serviceConstructors.has(serviceType)) {
      throw new DomainError(`Service type ${serviceType} is already registered`);
    }
    
    this.serviceConstructors.set(serviceType, constructor);
    this.serviceConfigs.set(serviceType, defaultConfig);
  }
  
  /**
   * Create a stateless service instance
   * @param {string} serviceType - Type of service to create
   * @param {Object} config - Configuration for the service
   * @returns {Object} - Service instance
   */
  createService(serviceType, config = {}) {
    if (!this.serviceConstructors.has(serviceType)) {
      throw new DomainError(`Service type ${serviceType} is not registered`);
    }
    
    const Constructor = this.serviceConstructors.get(serviceType);
    const defaultConfig = this.serviceConfigs.get(serviceType);
    
    // Merge default config with provided config
    const mergedConfig = { ...defaultConfig, ...config };
    
    // Add eventEmitter to dependencies
    const dependencies = {
      ...mergedConfig,
      eventEmitter: this.eventEmitter
    };
    
    // Create service instance
    const serviceInstance = new Constructor(dependencies);
    
    return serviceInstance;
  }
  
  /**
   * Get or create a service instance
   * This method ensures we don't create duplicate service instances
   * @param {string} serviceType - Type of service
   * @param {string} serviceId - Unique ID for the service instance
   * @param {Object} config - Configuration for the service
   * @returns {Object} - Service instance
   */
  getOrCreateService(serviceType, serviceId, config = {}) {
    const instanceKey = `${serviceType}:${serviceId}`;
    
    if (!this.serviceInstances.has(instanceKey)) {
      const serviceInstance = this.createService(serviceType, config);
      this.serviceInstances.set(instanceKey, serviceInstance);
    }
    
    return this.serviceInstances.get(instanceKey);
  }
  
  /**
   * Get all service instances of a specific type
   * @param {string} serviceType - Type of service
   * @returns {Array} - Array of service instances
   */
  getServicesByType(serviceType) {
    const instances = [];
    
    for (const [key, instance] of this.serviceInstances.entries()) {
      if (key.startsWith(`${serviceType}:`)) {
        instances.push(instance);
      }
    }
    
    return instances;
  }
  
  /**
   * Clear all service instances
   * Useful for testing and cleanup
   */
  clearInstances() {
    this.serviceInstances.clear();
  }
}

module.exports = StatelessServiceFactory; 