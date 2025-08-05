/**
 * CustomerService.js
 * 
 * Domain service for the Customer domain
 * Implements RF021 - Extract business logic into domain services
 * Implements RF069 - Customer service implementation
 * Implements RF022 - Implement service interfaces
 */

const DomainService = require('../../../core/DomainService');
const Customer = require('../models/Customer');
const { DomainError, ValidationError } = require('../../../core/errors');
const customerRepository = require('../repositories/CustomerRepository');
const CustomerServiceInterface = require('../interfaces/CustomerServiceInterface');
const logger = require('../../../infrastructure/logger');

/**
 * Customer domain service
 * Encapsulates business logic for customers
 */
class CustomerService extends DomainService {
  /**
   * Create a new customer service
   * @param {Object} dependencies - Dependencies required by the service
   */
  constructor(dependencies = {}) {
    super({
      customerRepository: customerRepository,
      ...dependencies
    });
    
    // Register with the service interface
    const customerServiceInterface = CustomerServiceInterface.getInstance();
    customerServiceInterface.setImplementation(this);
  }
  
  /**
   * Validate dependencies
   * @throws {DomainError} - If a required dependency is missing
   */
  validateDependencies() {
    if (!this.dependencies.customerRepository) {
      throw new DomainError('CustomerRepository is required');
    }
  }
  
  /**
   * Get the customer repository
   * @returns {Object} - The customer repository
   */
  getRepository() {
    return this.getDependency('customerRepository');
  }
  
  /**
   * Find a customer by ID
   * @param {string} id - ID of the customer to find
   * @returns {Promise<Customer|null>} - Customer if found, null otherwise
   */
  async findById(id) {
    if (!id) {
      throw new ValidationError('Customer ID is required');
    }
    
    const start = Date.now();
    const customer = await this.getRepository().findById(id);
    logger.debug('findById duration', { ms: Date.now() - start, id });
    if (!customer) throw new Error('Customer not found');
    return customer;
  }
  
  /**
   * Find all customers matching the query
   * @param {Object} options - Query options
   * @param {Object} options.filter - Filter to match customers against
   * @param {number} options.page - Page number
   * @param {number} options.limit - Number of items per page
   * @param {string} options.sort - Sort field
   * @returns {Promise<Object>} - Object containing customers and total count
   */
  async findAll({ filter = {}, page = 1, limit = 10, sort = 'createdAt' }) {
    const skip = (page - 1) * limit;
    const sortDirection = sort.startsWith('-') ? -1 : 1;
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortOptions = { [sortField]: sortDirection };
    
    // Process filter
    const query = this.buildFilterQuery(filter);
    
    const start = Date.now();
    // Get customers and total count
    const customers = await this.getRepository().findAll(query, { skip, limit, sort: sortOptions });
    const total = await this.getRepository().count(query);
    logger.debug('findAll duration', { ms: Date.now() - start, query });
    
    return {
      data: customers,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Build a filter query from filter options
   * @param {Object} filter - Filter options
   * @returns {Object} - MongoDB query
   */
  buildFilterQuery(filter) {
    const query = {};
    
    if (filter.name) {
      query.name = { $regex: filter.name, $options: 'i' };
    }
    
    if (filter.email) {
      query.email = { $regex: filter.email, $options: 'i' };
    }
    
    if (filter.status) {
      query.status = filter.status;
    }
    
    if (filter.type) {
      query.type = filter.type;
    }
    
    if (filter.industry) {
      query.industry = filter.industry;
    }
    
    if (filter.country) {
      query['address.country'] = filter.country;
    }
    
    if (filter.city) {
      query['address.city'] = { $regex: filter.city, $options: 'i' };
    }
    
    if (filter.createdAfter) {
      query.createdAt = { $gte: new Date(filter.createdAfter) };
    }
    
    if (filter.createdBefore) {
      query.createdAt = { ...query.createdAt, $lte: new Date(filter.createdBefore) };
    }
    
    return query;
  }
  
  /**
   * Create a new customer
   * @param {Object} customerData - Data for the new customer
   * @returns {Promise<Customer>} - Created customer
   */
  async create(customerData) {
    // Validate required fields
    if (!customerData.name) {
      throw new ValidationError('Customer name is required');
    }
    
    if (!customerData.email) {
      throw new ValidationError('Customer email is required');
    }
    
    // Check if customer email already exists
    const emailExists = await this.getRepository().exists({ email: customerData.email });
    if (emailExists) {
      throw new ValidationError(`Customer with email ${customerData.email} already exists`);
    }
    
    // Create customer
    const customer = Customer.create(customerData);
    
    const start = Date.now();
    // Save customer
    const savedCustomer = await this.getRepository().save(customer);
    logger.debug('create duration', { ms: Date.now() - start });
    
    // Publish event
    this.publishEvent('customer.created', { customer: savedCustomer.toObject() });
    
    return savedCustomer;
  }
  
  /**
   * Update a customer
   * @param {string} id - ID of the customer to update
   * @param {Object} customerData - Data to update
   * @returns {Promise<Customer>} - Updated customer
   */
  async update(id, customerData) {
    // Find customer
    const customer = await this.findById(id);
    
    if (!customer) {
      throw new ValidationError(`Customer with ID ${id} not found`);
    }
    
    // Check if email is being changed and if it already exists
    if (customerData.email && customerData.email !== customer.email) {
      const emailExists = await this.getRepository().exists({ 
        email: customerData.email,
        _id: { $ne: id }
      });
      
      if (emailExists) {
        throw new ValidationError(`Customer with email ${customerData.email} already exists`);
      }
    }
    
    // Update basic details
    if (customerData.name || customerData.email || customerData.phone || 
        customerData.type || customerData.industry || customerData.website) {
      customer.updateDetails(customerData);
    }
    
    // Update address
    if (customerData.address) {
      customer.updateAddress(customerData.address);
    }
    
    // Update status
    if (customerData.status) {
      switch (customerData.status) {
        case 'active':
          customer.activate();
          break;
        case 'inactive':
          customer.deactivate();
          break;
      }
    }
    
    const start = Date.now();
    // Save customer
    const savedCustomer = await this.getRepository().save(customer);
    logger.debug('update duration', { ms: Date.now() - start });
    
    // Publish event
    this.publishEvent('customer.updated', { 
      customer: savedCustomer.toObject(),
      updatedFields: Object.keys(customerData)
    });
    
    return savedCustomer;
  }
  
  /**
   * Delete a customer
   * @param {string} id - ID of the customer to delete
   * @returns {Promise<boolean>} - True if the customer was deleted
   */
  async delete(id) {
    // Find customer
    const customer = await this.findById(id);
    
    if (!customer) {
      throw new ValidationError(`Customer with ID ${id} not found`);
    }
    
    const start = Date.now();
    // Delete customer
    const deleted = await this.getRepository().delete(id);
    logger.debug('delete duration', { ms: Date.now() - start, id });
    
    if (deleted) {
      // Publish event
      this.publishEvent('customer.deleted', { customerId: id });
    }
    
    return deleted;
  }
  
  /**
   * Add a contact to a customer
   * @param {string} customerId - ID of the customer
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Added contact
   */
  async addContact(customerId, contactData) {
    // Find customer
    const customer = await this.findById(customerId);
    
    if (!customer) {
      throw new ValidationError(`Customer with ID ${customerId} not found`);
    }
    
    // Validate contact data
    if (!contactData.name) {
      throw new ValidationError('Contact name is required');
    }
    
    if (!contactData.email && !contactData.phone) {
      throw new ValidationError('Contact must have either email or phone');
    }
    
    // Add contact
    const contact = customer.addContact(contactData);
    
    // Save customer
    await this.getRepository().save(customer);
    
    return contact;
  }
  
  /**
   * Update a customer contact
   * @param {string} customerId - ID of the customer
   * @param {string} contactId - ID of the contact
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Updated contact
   */
  async updateContact(customerId, contactId, contactData) {
    // Find customer
    const customer = await this.findById(customerId);
    
    if (!customer) {
      throw new ValidationError(`Customer with ID ${customerId} not found`);
    }
    
    // Update contact
    const contact = customer.updateContact(contactId, contactData);
    
    // Save customer
    await this.getRepository().save(customer);
    
    return contact;
  }
  
  /**
   * Remove a contact from a customer
   * @param {string} customerId - ID of the customer
   * @param {string} contactId - ID of the contact
   * @returns {Promise<boolean>} - True if the contact was removed
   */
  async removeContact(customerId, contactId) {
    // Find customer
    const customer = await this.findById(customerId);
    
    if (!customer) {
      throw new ValidationError(`Customer with ID ${customerId} not found`);
    }
    
    // Remove contact
    const removed = customer.removeContact(contactId);
    
    if (removed) {
      // Save customer
      await this.getRepository().save(customer);
    }
    
    return removed;
  }
  
  /**
   * Search customers by name, email, or phone
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Search results
   */
  async search(query, options = {}) {
    const { page = 1, limit = 10 } = options;
    
    // Build search query
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    };
    
    return this.findAll({ filter: searchQuery, page, limit });
  }
  
  /**
   * Get customers by industry
   * @param {string} industry - Industry name
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Customers in the industry
   */
  async getByIndustry(industry, options = {}) {
    return this.findAll({ 
      filter: { industry },
      ...options
    });
  }
  
  /**
   * Get customers by type
   * @param {string} type - Customer type
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Customers of the type
   */
  async getByType(type, options = {}) {
    return this.findAll({ 
      filter: { type },
      ...options
    });
  }
  
  /**
   * Get customers by status
   * @param {string} status - Customer status
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Customers with the status
   */
  async getByStatus(status, options = {}) {
    return this.findAll({ 
      filter: { status },
      ...options
    });
  }
}

// Export the singleton instance
const customerService = new CustomerService();
module.exports = customerService; 