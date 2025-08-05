/**
 * CachedCustomerService.js
 * 
 * Cached implementation of the Customer service
 * Implements RF026 - Add Redis caching for frequently accessed data
 * Enhanced for RF027 - Implement cache invalidation patterns
 */

const CachedService = require('../../../infrastructure/caching/CachedService');
const CustomerService = require('./CustomerService');
const { CachePolicies } = require('../../../infrastructure/caching');
const CustomerServiceInterface = require('../interfaces/CustomerServiceInterface');

/**
 * Cached Customer Service
 * Wraps the Customer service with caching capabilities
 */
class CachedCustomerService extends CachedService {
  /**
   * Create a new cached customer service
   * @param {Object} options - Caching options
   */
  constructor(options = {}) {
    // Create the original customer service
    const customerService = options.service || new CustomerService();
    
    // Define cache policies for different methods
    const policies = {
      findById: CachePolicies.ENTITY,
      findAll: CachePolicies.DYNAMIC,
      search: CachePolicies.DYNAMIC,
      getByCategory: CachePolicies.DYNAMIC,
      getByStatus: CachePolicies.DYNAMIC,
      ...options.policies
    };
    
    // Create the cached service
    super(customerService, {
      policies,
      keyPrefix: 'customer:',
      defaultTags: ['customer', 'entity'],
      entityTagPrefix: 'entity:customer:',
      ...options
    });
    
    // Register with the service interface
    const customerServiceInterface = CustomerServiceInterface.getInstance();
    customerServiceInterface.setImplementation(this);
  }
  
  /**
   * Find a customer by ID
   * @param {string} id - ID of the customer to find
   * @returns {Promise<Object|null>} - Customer if found, null otherwise
   */
  async findById(id) {
    return this.callWithCache('findById', [id]);
  }
  
  /**
   * Find all customers matching the query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Object containing customers and total count
   */
  async findAll(options) {
    // Generate tags based on query options
    const tags = ['customer:list'];
    
    if (options.filter) {
      if (options.filter.status) {
        tags.push(`customer:status:${options.filter.status}`);
      }
      if (options.filter.category) {
        tags.push(`customer:category:${options.filter.category}`);
      }
    }
    
    return this.callWithCache('findAll', [options], { tags });
  }
  
  /**
   * Create a new customer
   * @param {Object} customerData - Data for the new customer
   * @returns {Promise<Object>} - Created customer
   */
  async create(customerData) {
    const result = await this.service.create(customerData);
    
    // Invalidate list caches
    await this.invalidateByTags(['customer:list']);
    
    // Invalidate specific tag caches based on the customer data
    const tagsToInvalidate = ['customer:list'];
    
    if (customerData.status) {
      tagsToInvalidate.push(`customer:status:${customerData.status}`);
    }
    if (customerData.category) {
      tagsToInvalidate.push(`customer:category:${customerData.category}`);
    }
    
    await this.invalidateByTags(tagsToInvalidate);
    
    return result;
  }
  
  /**
   * Update a customer
   * @param {string} id - ID of the customer to update
   * @param {Object} customerData - Data to update
   * @returns {Promise<Object>} - Updated customer
   */
  async update(id, customerData) {
    // Get the customer before update to compare changes
    const oldCustomer = await this.findById(id);
    const result = await this.service.update(id, customerData);
    
    // Invalidate entity cache
    await this.invalidateEntityCache(id);
    
    // Collect tags to invalidate
    const tagsToInvalidate = ['customer:list'];
    
    // If status changed, invalidate both old and new status caches
    if (customerData.status && oldCustomer && oldCustomer.status !== customerData.status) {
      tagsToInvalidate.push(`customer:status:${oldCustomer.status}`);
      tagsToInvalidate.push(`customer:status:${customerData.status}`);
    } else if (customerData.status) {
      tagsToInvalidate.push(`customer:status:${customerData.status}`);
    }
    
    // If category changed, invalidate both old and new category caches
    if (customerData.category && oldCustomer && oldCustomer.category !== customerData.category) {
      tagsToInvalidate.push(`customer:category:${oldCustomer.category}`);
      tagsToInvalidate.push(`customer:category:${customerData.category}`);
    } else if (customerData.category) {
      tagsToInvalidate.push(`customer:category:${customerData.category}`);
    }
    
    await this.invalidateByTags(tagsToInvalidate);
    
    return result;
  }
  
  /**
   * Delete a customer
   * @param {string} id - ID of the customer to delete
   * @returns {Promise<boolean>} - True if the customer was deleted
   */
  async delete(id) {
    // Get the customer before deletion to know what caches to invalidate
    const customer = await this.findById(id);
    const result = await this.service.delete(id);
    
    // Invalidate entity cache
    await this.invalidateEntityCache(id);
    
    // Collect tags to invalidate
    const tagsToInvalidate = ['customer:list'];
    
    if (customer) {
      if (customer.status) {
        tagsToInvalidate.push(`customer:status:${customer.status}`);
      }
      if (customer.category) {
        tagsToInvalidate.push(`customer:category:${customer.category}`);
      }
    }
    
    await this.invalidateByTags(tagsToInvalidate);
    
    return result;
  }
  
  /**
   * Add a contact to a customer
   * @param {string} customerId - ID of the customer
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Updated customer
   */
  async addContact(customerId, contactData) {
    const result = await this.service.addContact(customerId, contactData);
    await this.invalidateEntityCache(customerId);
    return result;
  }
  
  /**
   * Update a customer contact
   * @param {string} customerId - ID of the customer
   * @param {string} contactId - ID of the contact
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Updated customer
   */
  async updateContact(customerId, contactId, contactData) {
    const result = await this.service.updateContact(customerId, contactId, contactData);
    await this.invalidateEntityCache(customerId);
    return result;
  }
  
  /**
   * Remove a contact from a customer
   * @param {string} customerId - ID of the customer
   * @param {string} contactId - ID of the contact
   * @returns {Promise<Object>} - Updated customer
   */
  async removeContact(customerId, contactId) {
    const result = await this.service.removeContact(customerId, contactId);
    await this.invalidateEntityCache(customerId);
    return result;
  }
  
  /**
   * Search for customers
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Search results
   */
  async search(query, options) {
    return this.callWithCache('search', [query, options], {
      tags: ['customer:search', `customer:search:${query}`]
    });
  }
  
  /**
   * Get customers by category
   * @param {string} category - Category
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Customers in the category
   */
  async getByCategory(category, options) {
    return this.callWithCache('getByCategory', [category, options], {
      tags: ['customer:category', `customer:category:${category}`]
    });
  }
  
  /**
   * Get customers by status
   * @param {string} status - Status
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Customers with the status
   */
  async getByStatus(status, options) {
    return this.callWithCache('getByStatus', [status, options], {
      tags: ['customer:status', `customer:status:${status}`]
    });
  }
}

module.exports = CachedCustomerService; 