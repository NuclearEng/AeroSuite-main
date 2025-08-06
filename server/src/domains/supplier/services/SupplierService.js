/**
 * SupplierService.js
 * 
 * Domain service for the Supplier domain
 * Implements RF021 - Extract business logic into domain services
 * Implements RF068 - Supplier service implementation
 * Implements RF022 - Implement service interfaces
 */

const DomainService = require('../../../core/DomainService');
const Supplier = require('../models/Supplier');
const Address = require('../models/Address');
const Contact = require('../models/Contact');
const Qualification = require('../models/Qualification');
const { DomainError, ValidationError } = require('../../../core/errors');
const supplierRepository = require('../repositories/SupplierRepository');
const SupplierServiceInterface = require('../interfaces/SupplierServiceInterface');
const logger = require('../../../infrastructure/logger');

/**
 * Supplier domain service
 * Encapsulates business logic for suppliers
 */
class SupplierService extends DomainService {
  /**
   * Create a new supplier service
   * @param {Object} dependencies - Dependencies required by the service
   */
  constructor(dependencies = {}) {
    super({
      supplierRepository: supplierRepository,
      ...dependencies
    });
    
    // Register with the service interface
    const supplierServiceInterface = SupplierServiceInterface.getInstance();
    supplierServiceInterface.setImplementation(this);
  }
  
  /**
   * Validate dependencies
   * @throws {DomainError} - If a required dependency is missing
   */
  validateDependencies() {
    if (!this.dependencies.supplierRepository) {
      throw new DomainError('SupplierRepository is required');
    }
  }
  
  /**
   * Get the supplier repository
   * @returns {Object} - The supplier repository
   */
  getRepository() {
    return this.getDependency('supplierRepository');
  }
  
  /**
   * Find a supplier by ID
   * @param {string} id - ID of the supplier to find
   * @returns {Promise<Supplier|null>} - Supplier if found, null otherwise
   */
  async findById(id) {
    if (!id) {
      throw new ValidationError('Supplier ID is required');
    }
    
    const start = Date.now();
    const result = await this.getRepository().findById(id);
    logger.debug('findById duration', { ms: Date.now() - start, id });
    if (!result) throw new ValidationError('Supplier not found');
    return result;
  }
  
  /**
   * Find all suppliers matching the query
   * @param {Object} options - Query options
   * @param {Object} options.filter - Filter to match suppliers against
   * @param {number} options.page - Page number
   * @param {number} options.limit - Number of items per page
   * @param {string} options.sort - Sort field
   * @returns {Promise<Object>} - Object containing suppliers and total count
   */
  async findAll({ filter = {}, page = 1, limit = 10, sort = 'createdAt' }) {
    const skip = (page - 1) * limit;
    const sortDirection = sort.startsWith('-') ? -1 : 1;
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortOptions = { [sortField]: sortDirection };
    
    // Process filter
    const query = this.buildFilterQuery(filter);
    
    // Get suppliers and total count
    const start = Date.now();
    const suppliers = await this.getRepository().findAll(query, { skip, limit, sort: sortOptions });
    const total = await this.getRepository().count(query);
    logger.debug('findAll duration', { ms: Date.now() - start, query });
    
    return {
      data: suppliers,
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
    
    if (filter.code) {
      query.code = { $regex: filter.code, $options: 'i' };
    }
    
    if (filter.status) {
      query.status = filter.status;
    }
    
    if (filter.type) {
      query.type = filter.type;
    }
    
    if (filter.tags) {
      const tags = Array.isArray(filter.tags) ? filter.tags : [filter.tags];
      query.tags = { $in: tags };
    }
    
    if (filter.qualification) {
      query['qualifications.type'] = filter.qualification;
    }
    
    if (filter.country) {
      query['address.country'] = filter.country;
    }
    
    if (filter.city) {
      query['address.city'] = { $regex: filter.city, $options: 'i' };
    }
    
    return query;
  }
  
  /**
   * Create a new supplier
   * @param {Object} supplierData - Data for the new supplier
   * @returns {Promise<Supplier>} - Created supplier
   */
  async create(supplierData) {
    // Validate required fields
    if (!supplierData.name) {
      throw new ValidationError('Supplier name is required');
    }
    
    if (!supplierData.code) {
      throw new ValidationError('Supplier code is required');
    }
    
    // Check if supplier code already exists
    const codeExists = await this.getRepository().exists({ code: supplierData.code });
    if (codeExists) {
      throw new ValidationError(`Supplier with code ${supplierData.code} already exists`);
    }
    
    // Create supplier
    const start = Date.now();
    const supplier = Supplier.create(supplierData);
    
    // Save supplier
    const savedSupplier = await this.getRepository().save(supplier);
    logger.debug('create duration', { ms: Date.now() - start });
    
    // Publish event
    this.publishEvent('supplier.created', { supplier: savedSupplier.toObject() });
    
    return savedSupplier;
  }
  
  /**
   * Update a supplier
   * @param {string} id - ID of the supplier to update
   * @param {Object} supplierData - Data to update
   * @returns {Promise<Supplier>} - Updated supplier
   */
  async update(id, supplierData) {
    // Find supplier
    const supplier = await this.findById(id);
    
    if (!supplier) {
      throw new ValidationError(`Supplier with ID ${id} not found`);
    }
    
    // Check if code is being changed and if it already exists
    if (supplierData.code && supplierData.code !== supplier.code) {
      const codeExists = await this.getRepository().exists({ 
        code: supplierData.code,
        _id: { $ne: id }
      });
      
      if (codeExists) {
        throw new ValidationError(`Supplier with code ${supplierData.code} already exists`);
      }
    }
    
    // Update basic details
    if (supplierData.name || supplierData.code || supplierData.type || 
        supplierData.website !== undefined || supplierData.description !== undefined || 
        supplierData.tags) {
      supplier.updateDetails({
        name: supplierData.name,
        code: supplierData.code,
        type: supplierData.type,
        website: supplierData.website,
        description: supplierData.description,
        tags: supplierData.tags
      });
    }
    
    // Update address
    if (supplierData.address) {
      supplier.updateAddress(supplierData.address);
    }
    
    // Update status
    if (supplierData.status) {
      switch (supplierData.status) {
        case 'active':
          supplier.activate();
          break;
        case 'inactive':
          supplier.deactivate();
          break;
        case 'blacklisted':
          supplier.blacklist();
          break;
      }
    }
    
    // Save supplier
    const start = Date.now();
    const savedSupplier = await this.getRepository().save(supplier);
    logger.debug('update duration', { ms: Date.now() - start });
    
    // Publish event
    this.publishEvent('supplier.updated', { 
      supplier: savedSupplier.toObject(),
      updatedFields: Object.keys(supplierData)
    });
    
    return savedSupplier;
  }
  
  /**
   * Delete a supplier
   * @param {string} id - ID of the supplier to delete
   * @returns {Promise<boolean>} - True if the supplier was deleted
   */
  async delete(id) {
    // Find supplier
    const supplier = await this.findById(id);
    
    if (!supplier) {
      throw new ValidationError(`Supplier with ID ${id} not found`);
    }
    
    // Delete supplier
    const start = Date.now();
    const deleted = await this.getRepository().delete(id);
    logger.debug('delete duration', { ms: Date.now() - start, id });
    
    if (deleted) {
      // Publish event
      this.publishEvent('supplier.deleted', { supplierId: id });
    }
    
    return deleted;
  }
  
  /**
   * Add a contact to a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Added contact
   */
  async addContact(supplierId, contactData) {
    // Find supplier
    const supplier = await this.findById(supplierId);
    
    if (!supplier) {
      throw new ValidationError(`Supplier with ID ${supplierId} not found`);
    }
    
    // Validate contact data
    if (!contactData.name) {
      throw new ValidationError('Contact name is required');
    }
    
    if (!contactData.email && !contactData.phone) {
      throw new ValidationError('Contact must have either email or phone');
    }
    
    // Add contact
    const contact = supplier.addContact(contactData);
    
    // Save supplier
    await this.getRepository().save(supplier);
    
    return contact;
  }
  
  /**
   * Update a supplier contact
   * @param {string} supplierId - ID of the supplier
   * @param {string} contactId - ID of the contact
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Updated contact
   */
  async updateContact(supplierId, contactId, contactData) {
    // Find supplier
    const supplier = await this.findById(supplierId);
    
    if (!supplier) {
      throw new ValidationError(`Supplier with ID ${supplierId} not found`);
    }
    
    // Update contact
    const contact = supplier.updateContact(contactId, contactData);
    
    // Save supplier
    await this.getRepository().save(supplier);
    
    return contact;
  }
  
  /**
   * Remove a contact from a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {string} contactId - ID of the contact
   * @returns {Promise<boolean>} - True if the contact was removed
   */
  async removeContact(supplierId, contactId) {
    // Find supplier
    const supplier = await this.findById(supplierId);
    
    if (!supplier) {
      throw new ValidationError(`Supplier with ID ${supplierId} not found`);
    }
    
    // Remove contact
    const removed = supplier.removeContact(contactId);
    
    if (removed) {
      // Save supplier
      await this.getRepository().save(supplier);
    }
    
    return removed;
  }
  
  /**
   * Add a qualification to a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {Object} qualificationData - Qualification data
   * @returns {Promise<Object>} - Added qualification
   */
  async addQualification(supplierId, qualificationData) {
    // Find supplier
    const supplier = await this.findById(supplierId);
    
    if (!supplier) {
      throw new ValidationError(`Supplier with ID ${supplierId} not found`);
    }
    
    // Validate qualification data
    if (!qualificationData.type) {
      throw new ValidationError('Qualification type is required');
    }
    
    // Add qualification
    const qualification = supplier.addQualification(qualificationData);
    
    // Save supplier
    await this.getRepository().save(supplier);
    
    return qualification;
  }
  
  /**
   * Update a supplier qualification
   * @param {string} supplierId - ID of the supplier
   * @param {string} qualificationId - ID of the qualification
   * @param {Object} qualificationData - Qualification data
   * @returns {Promise<Object>} - Updated qualification
   */
  async updateQualification(supplierId, qualificationId, qualificationData) {
    // Find supplier
    const supplier = await this.findById(supplierId);
    
    if (!supplier) {
      throw new ValidationError(`Supplier with ID ${supplierId} not found`);
    }
    
    // Update qualification
    const qualification = supplier.updateQualification(qualificationId, qualificationData);
    
    // Save supplier
    await this.getRepository().save(supplier);
    
    return qualification;
  }
  
  /**
   * Remove a qualification from a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {string} qualificationId - ID of the qualification
   * @returns {Promise<boolean>} - True if the qualification was removed
   */
  async removeQualification(supplierId, qualificationId) {
    // Find supplier
    const supplier = await this.findById(supplierId);
    
    if (!supplier) {
      throw new ValidationError(`Supplier with ID ${supplierId} not found`);
    }
    
    // Remove qualification
    const removed = supplier.removeQualification(qualificationId);
    
    if (removed) {
      // Save supplier
      await this.getRepository().save(supplier);
    }
    
    return removed;
  }
  
  /**
   * Search suppliers by name, code, or tags
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
        { code: { $regex: query, $options: 'i' } },
        { tags: { $in: [query] } }
      ]
    };
    
    return this.findAll({ filter: searchQuery, page, limit });
  }
  
  /**
   * Get suppliers by qualification type
   * @param {string} qualificationType - Qualification type
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Suppliers with the qualification
   */
  async getByQualification(qualificationType, options = {}) {
    return this.findAll({ 
      filter: { qualification: qualificationType },
      ...options
    });
  }
  
  /**
   * Get suppliers by status
   * @param {string} status - Supplier status
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Suppliers with the status
   */
  async getByStatus(status, options = {}) {
    return this.findAll({ 
      filter: { status },
      ...options
    });
  }
  
  /**
   * Get performance metrics for a supplier
   * @param {string} id - The supplier ID
   * @returns {Promise<Object>} - The supplier metrics
   */
  async getMetrics(id) {
    try {
      logger.debug(`Getting metrics for supplier ${id}`);
      
      // Validate ID
      if (!id) {
        throw new ValidationError('Supplier ID is required');
      }

      // Check if supplier exists
      const supplier = await this.getRepository().findById(id);
      if (!supplier) {
        throw new DomainError('Supplier not found', 404);
      }

      // Get metrics from repository or calculate them
      const onTimeDeliveryRate = await this.getRepository().getOnTimeDeliveryRate(id);
      const qualityRate = await this.getRepository().getQualityRate(id);
      const responseTime = await this.getRepository().getAverageResponseTime(id);
      const complianceScore = await this.getRepository().getComplianceScore(id);
      
      // Get recent inspections
      const recentInspections = await this.getRepository().getRecentInspections(id, 5);
      
      // Format and return metrics
      return {
        id,
        name: supplier.name,
        metrics: {
          onTimeDeliveryRate,
          qualityRate,
          responseTime,
          complianceScore
        },
        recentInspections,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error(`Error getting metrics for supplier ${id}:`, error);
      throw error;
    }
  }
}

// Export the singleton instance
const supplierService = new SupplierService();
module.exports = supplierService; 