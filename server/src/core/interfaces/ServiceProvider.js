/**
 * ServiceProvider.js
 * 
 * Provider for accessing services
 * Implements RF022 - Implement service interfaces
 */

const ServiceRegistry = require('./ServiceRegistry');

/**
 * Service provider
 * Provides easy access to services
 */
class ServiceProvider {
  /**
   * Get the supplier service
   * @returns {Object} - The supplier service
   */
  static getSupplierService() {
    return ServiceRegistry.getInstance().getService('supplierService');
  }
  
  /**
   * Get the customer service
   * @returns {Object} - The customer service
   */
  static getCustomerService() {
    return ServiceRegistry.getInstance().getService('customerService');
  }
  
  /**
   * Get the inspection service
   * @returns {Object} - The inspection service
   */
  static getInspectionService() {
    return ServiceRegistry.getInstance().getService('inspectionService');
  }
  
  /**
   * Get the component service
   * @returns {Object} - The component service
   */
  static getComponentService() {
    return ServiceRegistry.getInstance().getService('componentService');
  }
  
  /**
   * Get a service by name
   * @param {string} name - Name of the service
   * @returns {Object} - The service
   */
  static getService(name) {
    return ServiceRegistry.getInstance().getService(name);
  }
  
  /**
   * Check if a service is registered
   * @param {string} name - Name of the service
   * @returns {boolean} - True if the service is registered
   */
  static hasService(name) {
    return ServiceRegistry.getInstance().hasService(name);
  }
  
  /**
   * Get all registered service names
   * @returns {Array<string>} - Array of service names
   */
  static getServiceNames() {
    return ServiceRegistry.getInstance().getServiceNames();
  }
}

module.exports = ServiceProvider; 