/**
 * ComponentServiceInterface.js
 * 
 * Interface for component services
 * Implements RF022 - Implement service interfaces
 */

const ServiceInterface = require('../../../core/interfaces/ServiceInterface');
const ServiceRegistry = require('../../../core/interfaces/ServiceRegistry');

/**
 * Component service interface
 * Defines the contract for component services
 */
class ComponentServiceInterface extends ServiceInterface {
  /**
   * Create a new component service interface
   */
  constructor() {
    super();
    this.implementation = null;
  }
  
  /**
   * Get the singleton instance of the component service interface
   * @returns {ComponentServiceInterface} - The singleton instance
   */
  static getInstance() {
    if (!ComponentServiceInterface.instance) {
      ComponentServiceInterface.instance = new ComponentServiceInterface();
      
      // Register this interface with the service registry
      const registry = ServiceRegistry.getInstance();
      registry.registerInterface('componentService', ComponentServiceInterface.instance);
    }
    
    return ComponentServiceInterface.instance;
  }
  
  /**
   * Set the implementation for this interface
   * @param {Object} implementation - The component service implementation
   */
  setImplementation(implementation) {
    if (!this.isValidImplementation(implementation)) {
      throw new Error('Implementation does not satisfy the ComponentServiceInterface');
    }
    
    this.implementation = implementation;
    
    // Register the implementation with the service registry
    const registry = ServiceRegistry.getInstance();
    registry.registerImplementation('componentService', implementation);
  }
  
  /**
   * Get the implementation of the component service
   * @returns {Object} - The component service implementation
   */
  getImplementation() {
    if (!this.implementation) {
      throw new Error('No implementation has been set for ComponentServiceInterface');
    }
    
    return this.implementation;
  }
  
  /**
   * Check if the implementation is valid
   * @param {Object} implementation - The implementation to check
   * @returns {boolean} - True if the implementation is valid
   */
  isValidImplementation(implementation) {
    // Check if the implementation has all required methods
    const requiredMethods = [
      'findById',
      'findAll',
      'create',
      'update',
      'delete',
      'addStock',
      'removeStock',
      'addDocument',
      'updateDocument',
      'removeDocument',
      'search',
      'getBySupplier',
      'getByCategory',
      'getByStatus',
      'getLowStock'
    ];
    
    return requiredMethods.every(method => 
      typeof implementation[method] === 'function'
    );
  }
  
  // Proxy methods to the implementation
  
  /**
   * Find a component by ID
   * @param {string} id - ID of the component to find
   * @returns {Promise<Object|null>} - Component if found, null otherwise
   */
  async findById(id) {
    return this.getImplementation().findById(id);
  }
  
  /**
   * Find all components matching the query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Object containing components and total count
   */
  async findAll(options) {
    return this.getImplementation().findAll(options);
  }
  
  /**
   * Create a new component
   * @param {Object} componentData - Data for the new component
   * @returns {Promise<Object>} - Created component
   */
  async create(componentData) {
    return this.getImplementation().create(componentData);
  }
  
  /**
   * Update a component
   * @param {string} id - ID of the component to update
   * @param {Object} componentData - Data to update
   * @returns {Promise<Object>} - Updated component
   */
  async update(id, componentData) {
    return this.getImplementation().update(id, componentData);
  }
  
  /**
   * Delete a component
   * @param {string} id - ID of the component to delete
   * @returns {Promise<boolean>} - True if the component was deleted
   */
  async delete(id) {
    return this.getImplementation().delete(id);
  }
  
  /**
   * Add stock to a component
   * @param {string} id - ID of the component
   * @param {number} quantity - Quantity to add
   * @param {string} reason - Reason for adding stock
   * @returns {Promise<Object>} - Updated component
   */
  async addStock(id, quantity, reason) {
    return this.getImplementation().addStock(id, quantity, reason);
  }
  
  /**
   * Remove stock from a component
   * @param {string} id - ID of the component
   * @param {number} quantity - Quantity to remove
   * @param {string} reason - Reason for removing stock
   * @returns {Promise<Object>} - Updated component
   */
  async removeStock(id, quantity, reason) {
    return this.getImplementation().removeStock(id, quantity, reason);
  }
  
  /**
   * Add a document to a component
   * @param {string} id - ID of the component
   * @param {Object} documentData - Document data
   * @returns {Promise<Object>} - Added document
   */
  async addDocument(id, documentData) {
    return this.getImplementation().addDocument(id, documentData);
  }
  
  /**
   * Update a document on a component
   * @param {string} id - ID of the component
   * @param {string} documentId - ID of the document
   * @param {Object} documentData - Document data
   * @returns {Promise<Object>} - Updated document
   */
  async updateDocument(id, documentId, documentData) {
    return this.getImplementation().updateDocument(id, documentId, documentData);
  }
  
  /**
   * Remove a document from a component
   * @param {string} id - ID of the component
   * @param {string} documentId - ID of the document
   * @returns {Promise<boolean>} - True if the document was removed
   */
  async removeDocument(id, documentId) {
    return this.getImplementation().removeDocument(id, documentId);
  }
  
  /**
   * Search components by name, part number, or description
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Search results
   */
  async search(query, options) {
    return this.getImplementation().search(query, options);
  }
  
  /**
   * Get components by supplier
   * @param {string} supplierId - Supplier ID
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Components from the supplier
   */
  async getBySupplier(supplierId, options) {
    return this.getImplementation().getBySupplier(supplierId, options);
  }
  
  /**
   * Get components by category
   * @param {string} category - Component category
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Components in the category
   */
  async getByCategory(category, options) {
    return this.getImplementation().getByCategory(category, options);
  }
  
  /**
   * Get components by status
   * @param {string} status - Component status
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Components with the status
   */
  async getByStatus(status, options) {
    return this.getImplementation().getByStatus(status, options);
  }
  
  /**
   * Get components with low stock
   * @param {number} threshold - Stock threshold
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Components with stock below threshold
   */
  async getLowStock(threshold, options) {
    return this.getImplementation().getLowStock(threshold, options);
  }
}

module.exports = ComponentServiceInterface; 