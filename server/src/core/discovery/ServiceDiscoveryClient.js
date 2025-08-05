/**
 * ServiceDiscoveryClient.js
 * 
 * Client for service discovery
 * Implements RF024 - Implement service discovery for microservices
 */

const ServiceDiscovery = require('./ServiceDiscovery');

/**
 * Service discovery client
 * Provides easy access to service discovery functionality
 */
class ServiceDiscoveryClient {
  /**
   * Create a new service discovery client
   * @param {Object} options - Client options
   * @param {ServiceDiscovery} options.discovery - Service discovery instance (optional)
   * @param {Object} options.serviceInfo - Service information for registration (optional)
   */
  constructor(options = {}) {
    this.discovery = options.discovery || ServiceDiscovery.getInstance();
    this.serviceId = null;
    this.serviceInfo = options.serviceInfo;
    this.loadBalancers = new Map();
  }

  /**
   * Register this service with the discovery system
   * @param {Object} serviceInfo - Service information (optional, uses constructor value if not provided)
   * @returns {Promise<string>} - The service ID
   */
  async register(serviceInfo = null) {
    const info = serviceInfo || this.serviceInfo;
    
    if (!info) {
      throw new Error('Service information is required for registration');
    }
    
    this.serviceId = await this.discovery.registerService(info);
    return this.serviceId;
  }

  /**
   * Deregister this service from the discovery system
   * @returns {Promise<boolean>} - True if the service was deregistered
   */
  async deregister() {
    if (!this.serviceId) {
      return false;
    }
    
    const result = await this.discovery.deregisterService(this.serviceId);
    
    if (result) {
      this.serviceId = null;
    }
    
    return result;
  }

  /**
   * Discover services by name
   * @param {string} serviceName - Name of the service to discover
   * @param {Object} options - Discovery options
   * @returns {Promise<Array<Object>>} - Array of matching services
   */
  async discover(serviceName, options = {}) {
    return this.discovery.discoverServices(serviceName, options);
  }

  /**
   * Get a specific service by ID
   * @param {string} serviceId - ID of the service to get
   * @returns {Promise<Object|null>} - The service or null if not found
   */
  async getService(serviceId) {
    return this.discovery.getService(serviceId);
  }

  /**
   * Update this service's metadata
   * @param {Object} metadata - New metadata to merge with existing
   * @returns {Promise<boolean>} - True if the service was updated
   */
  async updateMetadata(metadata) {
    if (!this.serviceId) {
      return false;
    }
    
    return this.discovery.updateServiceMetadata(this.serviceId, metadata);
  }

  /**
   * Get a service instance using load balancing
   * @param {string} serviceName - Name of the service to get
   * @param {Object} options - Options for service selection
   * @param {string} options.strategy - Load balancing strategy (default: 'round-robin')
   * @param {Object} options.filter - Filter options for service discovery
   * @returns {Promise<Object|null>} - A service instance or null if none available
   */
  async getServiceInstance(serviceName, options = {}) {
    const strategy = options.strategy || 'round-robin';
    const filter = options.filter || {};
    
    // Get all healthy services matching the name and filter
    const services = await this.discovery.discoverServices(serviceName, {
      onlyHealthy: true,
      ...filter
    });
    
    if (!services || services.length === 0) {
      return null;
    }
    
    // Get or create load balancer for this service name
    let loadBalancer = this.loadBalancers.get(serviceName);
    
    if (!loadBalancer) {
      loadBalancer = {
        strategy,
        lastIndex: -1,
        services: []
      };
      this.loadBalancers.set(serviceName, loadBalancer);
    }
    
    // Update services in the load balancer
    loadBalancer.services = services;
    
    // Select a service instance based on the strategy
    switch (strategy) {
      case 'random':
        return this._selectRandomInstance(loadBalancer);
      case 'round-robin':
      default:
        return this._selectRoundRobinInstance(loadBalancer);
    }
  }

  /**
   * Get a service URL using load balancing
   * @param {string} serviceName - Name of the service to get
   * @param {string} path - Path to append to the service URL
   * @param {Object} options - Options for service selection
   * @returns {Promise<string|null>} - Service URL or null if no service available
   */
  async getServiceUrl(serviceName, path = '', options = {}) {
    const service = await this.getServiceInstance(serviceName, options);
    
    if (!service) {
      return null;
    }
    
    const protocol = service.protocol || 'http';
    const host = service.host;
    const port = service.port;
    const basePath = path.startsWith('/') ? path : `/${path}`;
    
    return `${protocol}://${host}:${port}${basePath}`;
  }

  /**
   * Subscribe to service discovery events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  on(event, listener) {
    this.discovery.on(event, listener);
  }

  /**
   * Unsubscribe from service discovery events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  off(event, listener) {
    this.discovery.off(event, listener);
  }

  /**
   * Select a service instance using round-robin strategy
   * @param {Object} loadBalancer - Load balancer state
   * @returns {Object} - Selected service instance
   * @private
   */
  _selectRoundRobinInstance(loadBalancer) {
    const { services } = loadBalancer;
    
    if (services.length === 0) {
      return null;
    }
    
    // Update the index for next selection
    loadBalancer.lastIndex = (loadBalancer.lastIndex + 1) % services.length;
    
    return services[loadBalancer.lastIndex];
  }

  /**
   * Select a service instance using random strategy
   * @param {Object} loadBalancer - Load balancer state
   * @returns {Object} - Selected service instance
   * @private
   */
  _selectRandomInstance(loadBalancer) {
    const { services } = loadBalancer;
    
    if (services.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * services.length);
    return services[randomIndex];
  }
}

module.exports = ServiceDiscoveryClient; 