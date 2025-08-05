/**
 * CustomerServiceInterface.js
 * 
 * Interface for customer services
 * Implements RF022 - Implement service interfaces
 */

const ServiceInterface = require('../../../core/interfaces/ServiceInterface');
const ServiceRegistry = require('../../../core/interfaces/ServiceRegistry');

/**
 * Customer service interface
 * Defines the contract for customer services
 */
class CustomerServiceInterface extends ServiceInterface {
  /**
   * Create a new customer service interface
   */
  constructor() {
    super();
    this.implementation = null;
  }
  
  /**
   * Get the singleton instance of the customer service interface
   * @returns {CustomerServiceInterface} - The singleton instance
   */
  static getInstance() {
    if (!CustomerServiceInterface.instance) {
      CustomerServiceInterface.instance = new CustomerServiceInterface();
      
      // Register this interface with the service registry
      const registry = ServiceRegistry.getInstance();
      registry.registerInterface('customerService', CustomerServiceInterface.instance);
    }
    
    return CustomerServiceInterface.instance;
  }
  
  /**
   * Set the implementation for this interface
   * @param {Object} implementation - The customer service implementation
   */
  setImplementation(implementation) {
    if (!this.isValidImplementation(implementation)) {
      throw new Error('Implementation does not satisfy the CustomerServiceInterface');
    }
    
    this.implementation = implementation;
    
    // Register the implementation with the service registry
    const registry = ServiceRegistry.getInstance();
    registry.registerImplementation('customerService', implementation);
  }
  
  /**
   * Get the implementation of the customer service
   * @returns {Object} - The customer service implementation
   */
  getImplementation() {
    if (!this.implementation) {
      throw new Error('No implementation has been set for CustomerServiceInterface');
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
      'search',
      'getByIndustry',
      'getByType',
      'getByStatus'
    ];
    
    return requiredMethods.every(method => 
      typeof implementation[method] === 'function'
    );
  }
  
  // Proxy methods to the implementation
  
  /**
   * Find a customer by ID
   * @param {string} id - ID of the customer to find
   * @returns {Promise<Object|null>} - Customer if found, null otherwise
   */
  async findById(id) {
    return this.getImplementation().findById(id);
  }
  
  /**
   * Find all customers matching the query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Object containing customers and total count
   */
  async findAll(options) {
    return this.getImplementation().findAll(options);
  }
  
  /**
   * Create a new customer
   * @param {Object} customerData - Data for the new customer
   * @returns {Promise<Object>} - Created customer
   */
  async create(customerData) {
    return this.getImplementation().create(customerData);
  }
  
  /**
   * Update a customer
   * @param {string} id - ID of the customer to update
   * @param {Object} customerData - Data to update
   * @returns {Promise<Object>} - Updated customer
   */
  async update(id, customerData) {
    return this.getImplementation().update(id, customerData);
  }
  
  /**
   * Delete a customer
   * @param {string} id - ID of the customer to delete
   * @returns {Promise<boolean>} - True if the customer was deleted
   */
  async delete(id) {
    return this.getImplementation().delete(id);
  }
  
  /**
   * Add a contact to a customer
   * @param {string} customerId - ID of the customer
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Added contact
   */
  async addContact(customerId, contactData) {
    return this.getImplementation().addContact(customerId, contactData);
  }
  
  /**
   * Update a customer contact
   * @param {string} customerId - ID of the customer
   * @param {string} contactId - ID of the contact
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Updated contact
   */
  async updateContact(customerId, contactId, contactData) {
    return this.getImplementation().updateContact(customerId, contactId, contactData);
  }
  
  /**
   * Remove a contact from a customer
   * @param {string} customerId - ID of the customer
   * @param {string} contactId - ID of the contact
   * @returns {Promise<boolean>} - True if the contact was removed
   */
  async removeContact(customerId, contactId) {
    return this.getImplementation().removeContact(customerId, contactId);
  }
  
  /**
   * Search customers by name, email, or phone
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Search results
   */
  async search(query, options) {
    return this.getImplementation().search(query, options);
  }
  
  /**
   * Get customers by industry
   * @param {string} industry - Industry name
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Customers in the industry
   */
  async getByIndustry(industry, options) {
    return this.getImplementation().getByIndustry(industry, options);
  }
  
  /**
   * Get customers by type
   * @param {string} type - Customer type
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Customers of the type
   */
  async getByType(type, options) {
    return this.getImplementation().getByType(type, options);
  }
  
  /**
   * Get customers by status
   * @param {string} status - Customer status
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Customers with the status
   */
  async getByStatus(status, options) {
    return this.getImplementation().getByStatus(status, options);
  }
}

module.exports = CustomerServiceInterface; 