/**
 * SupplierServiceInterface.js
 * 
 * Interface for supplier services
 * Implements RF022 - Implement service interfaces
 */

const ServiceInterface = require('../../../core/interfaces/ServiceInterface');
const ServiceRegistry = require('../../../core/interfaces/ServiceRegistry');

/**
 * Supplier service interface
 * Defines the contract for supplier services
 */
class SupplierServiceInterface extends ServiceInterface {
  /**
   * Create a new supplier service interface
   */
  constructor() {
    super();
    this.implementation = null;
  }
  
  /**
   * Get the singleton instance of the supplier service interface
   * @returns {SupplierServiceInterface} - The singleton instance
   */
  static getInstance() {
    if (!SupplierServiceInterface.instance) {
      SupplierServiceInterface.instance = new SupplierServiceInterface();
      
      // Register this interface with the service registry
      const registry = ServiceRegistry.getInstance();
      registry.registerInterface('supplierService', SupplierServiceInterface.instance);
    }
    
    return SupplierServiceInterface.instance;
  }
  
  /**
   * Set the implementation for this interface
   * @param {Object} implementation - The supplier service implementation
   */
  setImplementation(implementation) {
    if (!this.isValidImplementation(implementation)) {
      throw new Error('Implementation does not satisfy the SupplierServiceInterface');
    }
    
    this.implementation = implementation;
    
    // Register the implementation with the service registry
    const registry = ServiceRegistry.getInstance();
    registry.registerImplementation('supplierService', implementation);
  }
  
  /**
   * Get the implementation of the supplier service
   * @returns {Object} - The supplier service implementation
   */
  getImplementation() {
    if (!this.implementation) {
      throw new Error('No implementation has been set for SupplierServiceInterface');
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
      'addContact',
      'updateContact',
      'removeContact',
      'addQualification',
      'updateQualification',
      'removeQualification',
      'search',
      'getByQualification',
      'getByStatus'
    ];
    
    return requiredMethods.every(method => 
      typeof implementation[method] === 'function'
    );
  }
  
  // Proxy methods to the implementation
  
  /**
   * Find a supplier by ID
   * @param {string} id - ID of the supplier to find
   * @returns {Promise<Object|null>} - Supplier if found, null otherwise
   */
  async findById(id) {
    return this.getImplementation().findById(id);
  }
  
  /**
   * Find all suppliers matching the query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Object containing suppliers and total count
   */
  async findAll(options) {
    return this.getImplementation().findAll(options);
  }
  
  /**
   * Create a new supplier
   * @param {Object} supplierData - Data for the new supplier
   * @returns {Promise<Object>} - Created supplier
   */
  async create(supplierData) {
    return this.getImplementation().create(supplierData);
  }
  
  /**
   * Update a supplier
   * @param {string} id - ID of the supplier to update
   * @param {Object} supplierData - Data to update
   * @returns {Promise<Object>} - Updated supplier
   */
  async update(id, supplierData) {
    return this.getImplementation().update(id, supplierData);
  }
  
  /**
   * Delete a supplier
   * @param {string} id - ID of the supplier to delete
   * @returns {Promise<boolean>} - True if the supplier was deleted
   */
  async delete(id) {
    return this.getImplementation().delete(id);
  }
  
  /**
   * Add a contact to a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Added contact
   */
  async addContact(supplierId, contactData) {
    return this.getImplementation().addContact(supplierId, contactData);
  }
  
  /**
   * Update a supplier contact
   * @param {string} supplierId - ID of the supplier
   * @param {string} contactId - ID of the contact
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Updated contact
   */
  async updateContact(supplierId, contactId, contactData) {
    return this.getImplementation().updateContact(supplierId, contactId, contactData);
  }
  
  /**
   * Remove a contact from a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {string} contactId - ID of the contact
   * @returns {Promise<boolean>} - True if the contact was removed
   */
  async removeContact(supplierId, contactId) {
    return this.getImplementation().removeContact(supplierId, contactId);
  }
  
  /**
   * Add a qualification to a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {Object} qualificationData - Qualification data
   * @returns {Promise<Object>} - Added qualification
   */
  async addQualification(supplierId, qualificationData) {
    return this.getImplementation().addQualification(supplierId, qualificationData);
  }
  
  /**
   * Update a supplier qualification
   * @param {string} supplierId - ID of the supplier
   * @param {string} qualificationId - ID of the qualification
   * @param {Object} qualificationData - Qualification data
   * @returns {Promise<Object>} - Updated qualification
   */
  async updateQualification(supplierId, qualificationId, qualificationData) {
    return this.getImplementation().updateQualification(supplierId, qualificationId, qualificationData);
  }
  
  /**
   * Remove a qualification from a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {string} qualificationId - ID of the qualification
   * @returns {Promise<boolean>} - True if the qualification was removed
   */
  async removeQualification(supplierId, qualificationId) {
    return this.getImplementation().removeQualification(supplierId, qualificationId);
  }
  
  /**
   * Search suppliers by name, code, or tags
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Search results
   */
  async search(query, options) {
    return this.getImplementation().search(query, options);
  }
  
  /**
   * Get suppliers by qualification type
   * @param {string} qualificationType - Qualification type
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Suppliers with the qualification
   */
  async getByQualification(qualificationType, options) {
    return this.getImplementation().getByQualification(qualificationType, options);
  }
  
  /**
   * Get suppliers by status
   * @param {string} status - Supplier status
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Suppliers with the status
   */
  async getByStatus(status, options) {
    return this.getImplementation().getByStatus(status, options);
  }
}

module.exports = SupplierServiceInterface; 