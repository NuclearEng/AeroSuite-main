/**
 * ServiceDiscovery.js
 * 
 * Service discovery implementation for microservices
 * Implements RF024 - Implement service discovery for microservices
 */

const EventEmitter = require('events');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { DomainError } = require('../errors');

/**
 * Service discovery for microservices
 * Provides service registration, discovery, and health monitoring
 */
class ServiceDiscovery {
  /**
   * Create a new service discovery instance
   * @param {Object} options - Configuration options
   * @param {Object} options.storage - Storage adapter for service registry
   * @param {number} options.heartbeatInterval - Interval in ms for sending heartbeats (default: 30000)
   * @param {number} options.timeoutThreshold - Time in ms after which a service is considered down (default: 90000)
   */
  constructor(options = {}) {
    this.serviceId = uuidv4();
    this.services = new Map();
    this.events = new EventEmitter();
    this.storage = options.storage;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.timeoutThreshold = options.timeoutThreshold || 90000;
    this.healthCheckInterval = null;
    this.heartbeatTimer = null;
    this.hostname = os.hostname();
    this.registeredServices = new Map();
  }

  /**
   * Get the singleton instance of the service discovery
   * @param {Object} options - Configuration options
   * @returns {ServiceDiscovery} - The singleton instance
   */
  static getInstance(options = {}) {
    if (!ServiceDiscovery.instance) {
      ServiceDiscovery.instance = new ServiceDiscovery(options);
    }
    
    return ServiceDiscovery.instance;
  }

  /**
   * Register a service with the discovery system
   * @param {Object} serviceInfo - Service information
   * @param {string} serviceInfo.name - Name of the service
   * @param {string} serviceInfo.version - Version of the service
   * @param {string} serviceInfo.host - Host of the service
   * @param {number} serviceInfo.port - Port of the service
   * @param {string} serviceInfo.protocol - Protocol of the service (http, https, etc.)
   * @param {Object} serviceInfo.metadata - Additional metadata for the service
   * @returns {string} - The service ID
   */
  async registerService(serviceInfo) {
    if (!serviceInfo.name) {
      throw new DomainError('Service name is required');
    }
    
    if (!serviceInfo.host) {
      serviceInfo.host = this.hostname;
    }
    
    const serviceId = `${serviceInfo.name}-${uuidv4()}`;
    
    const service = {
      id: serviceId,
      name: serviceInfo.name,
      version: serviceInfo.version || '1.0.0',
      host: serviceInfo.host,
      port: serviceInfo.port || 0,
      protocol: serviceInfo.protocol || 'http',
      status: 'up',
      metadata: serviceInfo.metadata || {},
      lastHeartbeat: Date.now(),
      registeredAt: Date.now()
    };
    
    this.services.set(serviceId, service);
    
    // Store in external storage if available
    if (this.storage) {
      await this.storage.registerService(service);
    }
    
    this.registeredServices.set(serviceId, service);
    
    // Start sending heartbeats if this is the first service
    if (this.registeredServices.size === 1) {
      this._startHeartbeat();
      this._startHealthCheck();
    }
    
    this.events.emit('service:registered', service);
    
    return serviceId;
  }

  /**
   * Deregister a service from the discovery system
   * @param {string} serviceId - ID of the service to deregister
   * @returns {boolean} - True if the service was deregistered
   */
  async deregisterService(serviceId) {
    const service = this.services.get(serviceId);
    
    if (!service) {
      return false;
    }
    
    this.services.delete(serviceId);
    this.registeredServices.delete(serviceId);
    
    // Remove from external storage if available
    if (this.storage) {
      await this.storage.deregisterService(serviceId);
    }
    
    // Stop heartbeat and health check if no more services
    if (this.registeredServices.size === 0) {
      this._stopHeartbeat();
      this._stopHealthCheck();
    }
    
    this.events.emit('service:deregistered', service);
    
    return true;
  }

  /**
   * Discover services by name
   * @param {string} serviceName - Name of the service to discover
   * @param {Object} options - Discovery options
   * @param {boolean} options.onlyHealthy - Only return healthy services (default: true)
   * @param {Object} options.metadata - Metadata filter
   * @param {string} options.version - Version filter
   * @returns {Array<Object>} - Array of matching services
   */
  async discoverServices(serviceName, options = {}) {
    const onlyHealthy = options.onlyHealthy !== false;
    const metadata = options.metadata || {};
    const version = options.version;
    
    // Refresh services from storage if available
    if (this.storage) {
      const storedServices = await this.storage.getAllServices();
      
      for (const service of storedServices) {
        if (!this.services.has(service.id)) {
          this.services.set(service.id, service);
        }
      }
    }
    
    const matchingServices = Array.from(this.services.values()).filter(service => {
      // Match by name
      if (serviceName && service.name !== serviceName) {
        return false;
      }
      
      // Filter by health status
      if (onlyHealthy && service.status !== 'up') {
        return false;
      }
      
      // Filter by version
      if (version && service.version !== version) {
        return false;
      }
      
      // Filter by metadata
      for (const [key, value] of Object.entries(metadata)) {
        if (service.metadata[key] !== value) {
          return false;
        }
      }
      
      return true;
    });
    
    return matchingServices;
  }

  /**
   * Get a specific service by ID
   * @param {string} serviceId - ID of the service to get
   * @returns {Object|null} - The service or null if not found
   */
  async getService(serviceId) {
    // Try to get from local cache
    let service = this.services.get(serviceId);
    
    // If not found and storage is available, try to get from storage
    if (!service && this.storage) {
      service = await this.storage.getService(serviceId);
      
      if (service) {
        this.services.set(serviceId, service);
      }
    }
    
    return service || null;
  }

  /**
   * Update a service's metadata
   * @param {string} serviceId - ID of the service to update
   * @param {Object} metadata - New metadata to merge with existing
   * @returns {boolean} - True if the service was updated
   */
  async updateServiceMetadata(serviceId, metadata) {
    const service = this.services.get(serviceId);
    
    if (!service) {
      return false;
    }
    
    service.metadata = { ...service.metadata, ...metadata };
    
    // Update in external storage if available
    if (this.storage) {
      await this.storage.updateService(service);
    }
    
    this.events.emit('service:updated', service);
    
    return true;
  }

  /**
   * Send a heartbeat for a service
   * @param {string} serviceId - ID of the service
   * @returns {boolean} - True if the heartbeat was sent
   */
  async sendHeartbeat(serviceId) {
    const service = this.services.get(serviceId);
    
    if (!service) {
      return false;
    }
    
    service.lastHeartbeat = Date.now();
    service.status = 'up';
    
    // Update in external storage if available
    if (this.storage) {
      await this.storage.updateService(service);
    }
    
    return true;
  }

  /**
   * Subscribe to service discovery events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  on(event, listener) {
    this.events.on(event, listener);
  }

  /**
   * Unsubscribe from service discovery events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  off(event, listener) {
    this.events.off(event, listener);
  }

  /**
   * Start the service discovery system
   */
  async start() {
    // Load services from storage if available
    if (this.storage) {
      const storedServices = await this.storage.getAllServices();
      
      for (const service of storedServices) {
        this.services.set(service.id, service);
      }
    }
    
    // Start heartbeat and health check if there are registered services
    if (this.registeredServices.size > 0) {
      this._startHeartbeat();
      this._startHealthCheck();
    }
    
    this.events.emit('discovery:started');
  }

  /**
   * Stop the service discovery system
   */
  async stop() {
    this._stopHeartbeat();
    this._stopHealthCheck();
    
    // Deregister all registered services
    for (const serviceId of this.registeredServices.keys()) {
      await this.deregisterService(serviceId);
    }
    
    this.events.emit('discovery:stopped');
  }

  /**
   * Start sending heartbeats for registered services
   * @private
   */
  _startHeartbeat() {
    if (this.heartbeatTimer) {
      return;
    }
    
    this.heartbeatTimer = setInterval(async () => {
      for (const serviceId of this.registeredServices.keys()) {
        await this.sendHeartbeat(serviceId);
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop sending heartbeats
   * @private
   */
  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Start health checking services
   * @private
   */
  _startHealthCheck() {
    if (this.healthCheckInterval) {
      return;
    }
    
    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      
      for (const [serviceId, service] of this.services.entries()) {
        // Skip services that we registered (we're sending heartbeats for them)
        if (this.registeredServices.has(serviceId)) {
          continue;
        }
        
        // Check if the service has timed out
        if (now - service.lastHeartbeat > this.timeoutThreshold) {
          if (service.status === 'up') {
            service.status = 'down';
            this.events.emit('service:down', service);
          }
        } else if (service.status === 'down') {
          // Service has recovered
          service.status = 'up';
          this.events.emit('service:up', service);
        }
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop health checking
   * @private
   */
  _stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

module.exports = ServiceDiscovery; 