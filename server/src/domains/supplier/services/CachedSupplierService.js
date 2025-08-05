/**
 * CachedSupplierService.js
 * 
 * Cached implementation of the Supplier service
 * Implements RF026 - Add Redis caching for frequently accessed data
 * Enhanced for RF027 - Implement cache invalidation patterns
 */

const CachedService = require('../../../infrastructure/caching/CachedService');
const SupplierService = require('./SupplierService');
const { CachePolicies } = require('../../../infrastructure/caching');
const SupplierServiceInterface = require('../interfaces/SupplierServiceInterface');

/**
 * Cached Supplier Service
 * Wraps the Supplier service with caching capabilities
 */
class CachedSupplierService extends CachedService {
  /**
   * Create a new cached supplier service
   * @param {Object} options - Caching options
   */
  constructor(options = {}) {
    // Create the original supplier service
    const supplierService = options.service || new SupplierService();
    
    // Define cache policies for different methods
    const policies = {
      findById: CachePolicies.ENTITY,
      findAll: CachePolicies.DYNAMIC,
      search: CachePolicies.DYNAMIC,
      getByQualification: CachePolicies.DYNAMIC,
      getByStatus: CachePolicies.DYNAMIC,
      ...options.policies
    };
    
    // Create the cached service
    super(supplierService, {
      policies,
      keyPrefix: 'supplier:',
      defaultTags: ['supplier', 'entity'],
      entityTagPrefix: 'entity:supplier:',
      ...options
    });
    
    // Register with the service interface
    const supplierServiceInterface = SupplierServiceInterface.getInstance();
    supplierServiceInterface.setImplementation(this);
  }
  
  /**
   * Find a supplier by ID
   * @param {string} id - ID of the supplier to find
   * @returns {Promise<Object|null>} - Supplier if found, null otherwise
   */
  async findById(id) {
    return this.callWithCache('findById', [id]);
  }
  
  /**
   * Find all suppliers matching the query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Object containing suppliers and total count
   */
  async findAll(options) {
    // Generate tags based on query options
    const tags = ['supplier:list'];
    
    if (options.filter) {
      if (options.filter.status) {
        tags.push(`supplier:status:${options.filter.status}`);
      }
      if (options.filter.type) {
        tags.push(`supplier:type:${options.filter.type}`);
      }
    }
    
    return this.callWithCache('findAll', [options], { tags });
  }
  
  /**
   * Create a new supplier
   * @param {string} supplierData - Data for the new supplier
   * @returns {Promise<Object>} - Created supplier
   */
  async create(supplierData) {
    const result = await this.service.create(supplierData);
    
    // Invalidate list caches
    await this.invalidateByTags(['supplier:list']);
    
    // Invalidate specific tag caches based on the supplier data
    const tagsToInvalidate = ['supplier:list'];
    
    if (supplierData.status) {
      tagsToInvalidate.push(`supplier:status:${supplierData.status}`);
    }
    if (supplierData.type) {
      tagsToInvalidate.push(`supplier:type:${supplierData.type}`);
    }
    
    await this.invalidateByTags(tagsToInvalidate);
    
    return result;
  }
  
  /**
   * Update a supplier
   * @param {string} id - ID of the supplier to update
   * @param {Object} supplierData - Data to update
   * @returns {Promise<Object>} - Updated supplier
   */
  async update(id, supplierData) {
    // Get the supplier before update to compare changes
    const oldSupplier = await this.findById(id);
    const result = await this.service.update(id, supplierData);
    
    // Invalidate entity cache
    await this.invalidateEntityCache(id);
    
    // Collect tags to invalidate
    const tagsToInvalidate = ['supplier:list'];
    
    // If status changed, invalidate both old and new status caches
    if (supplierData.status && oldSupplier && oldSupplier.status !== supplierData.status) {
      tagsToInvalidate.push(`supplier:status:${oldSupplier.status}`);
      tagsToInvalidate.push(`supplier:status:${supplierData.status}`);
    } else if (supplierData.status) {
      tagsToInvalidate.push(`supplier:status:${supplierData.status}`);
    }
    
    // If type changed, invalidate both old and new type caches
    if (supplierData.type && oldSupplier && oldSupplier.type !== supplierData.type) {
      tagsToInvalidate.push(`supplier:type:${oldSupplier.type}`);
      tagsToInvalidate.push(`supplier:type:${supplierData.type}`);
    } else if (supplierData.type) {
      tagsToInvalidate.push(`supplier:type:${supplierData.type}`);
    }
    
    // If qualifications updated, invalidate qualification caches
    if (supplierData.qualifications) {
      tagsToInvalidate.push('supplier:qualification');
    }
    
    await this.invalidateByTags(tagsToInvalidate);
    
    return result;
  }
  
  /**
   * Delete a supplier
   * @param {string} id - ID of the supplier to delete
   * @returns {Promise<boolean>} - True if the supplier was deleted
   */
  async delete(id) {
    // Get the supplier before deletion to know what caches to invalidate
    const supplier = await this.findById(id);
    const result = await this.service.delete(id);
    
    // Invalidate entity cache
    await this.invalidateEntityCache(id);
    
    // Collect tags to invalidate
    const tagsToInvalidate = ['supplier:list'];
    
    if (supplier) {
      if (supplier.status) {
        tagsToInvalidate.push(`supplier:status:${supplier.status}`);
      }
      if (supplier.type) {
        tagsToInvalidate.push(`supplier:type:${supplier.type}`);
      }
    }
    
    await this.invalidateByTags(tagsToInvalidate);
    
    return result;
  }
  
  /**
   * Add a contact to a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Updated supplier
   */
  async addContact(supplierId, contactData) {
    const result = await this.service.addContact(supplierId, contactData);
    await this.invalidateEntityCache(supplierId);
    return result;
  }
  
  /**
   * Update a supplier contact
   * @param {string} supplierId - ID of the supplier
   * @param {string} contactId - ID of the contact
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Updated supplier
   */
  async updateContact(supplierId, contactId, contactData) {
    const result = await this.service.updateContact(supplierId, contactId, contactData);
    await this.invalidateEntityCache(supplierId);
    return result;
  }
  
  /**
   * Remove a contact from a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {string} contactId - ID of the contact
   * @returns {Promise<Object>} - Updated supplier
   */
  async removeContact(supplierId, contactId) {
    const result = await this.service.removeContact(supplierId, contactId);
    await this.invalidateEntityCache(supplierId);
    return result;
  }
  
  /**
   * Add a qualification to a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {Object} qualificationData - Qualification data
   * @returns {Promise<Object>} - Updated supplier
   */
  async addQualification(supplierId, qualificationData) {
    const result = await this.service.addQualification(supplierId, qualificationData);
    
    // Invalidate entity cache
    await this.invalidateEntityCache(supplierId);
    
    // Invalidate qualification-related caches
    await this.invalidateByTags([
      'supplier:qualification',
      `supplier:qualification:${qualificationData.type}`
    ]);
    
    return result;
  }
  
  /**
   * Update a supplier qualification
   * @param {string} supplierId - ID of the supplier
   * @param {string} qualificationId - ID of the qualification
   * @param {Object} qualificationData - Qualification data
   * @returns {Promise<Object>} - Updated supplier
   */
  async updateQualification(supplierId, qualificationId, qualificationData) {
    // Get the supplier before update to compare changes
    const supplier = await this.findById(supplierId);
    const oldQualification = supplier?.qualifications?.find(q => q.id === qualificationId);
    
    const result = await this.service.updateQualification(supplierId, qualificationId, qualificationData);
    
    // Invalidate entity cache
    await this.invalidateEntityCache(supplierId);
    
    // Collect tags to invalidate
    const tagsToInvalidate = ['supplier:qualification'];
    
    // If qualification type changed, invalidate both old and new type caches
    if (qualificationData.type && oldQualification && oldQualification.type !== qualificationData.type) {
      tagsToInvalidate.push(`supplier:qualification:${oldQualification.type}`);
      tagsToInvalidate.push(`supplier:qualification:${qualificationData.type}`);
    } else if (qualificationData.type) {
      tagsToInvalidate.push(`supplier:qualification:${qualificationData.type}`);
    }
    
    await this.invalidateByTags(tagsToInvalidate);
    
    return result;
  }
  
  /**
   * Remove a qualification from a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {string} qualificationId - ID of the qualification
   * @returns {Promise<Object>} - Updated supplier
   */
  async removeQualification(supplierId, qualificationId) {
    // Get the supplier before update to know what caches to invalidate
    const supplier = await this.findById(supplierId);
    const qualification = supplier?.qualifications?.find(q => q.id === qualificationId);
    
    const result = await this.service.removeQualification(supplierId, qualificationId);
    
    // Invalidate entity cache
    await this.invalidateEntityCache(supplierId);
    
    // Invalidate qualification-related caches
    const tagsToInvalidate = ['supplier:qualification'];
    
    if (qualification && qualification.type) {
      tagsToInvalidate.push(`supplier:qualification:${qualification.type}`);
    }
    
    await this.invalidateByTags(tagsToInvalidate);
    
    return result;
  }
  
  /**
   * Search for suppliers
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Search results
   */
  async search(query, options) {
    return this.callWithCache('search', [query, options], {
      tags: ['supplier:search', `supplier:search:${query}`]
    });
  }
  
  /**
   * Get suppliers by qualification type
   * @param {string} qualificationType - Qualification type
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Suppliers with the qualification
   */
  async getByQualification(qualificationType, options) {
    return this.callWithCache('getByQualification', [qualificationType, options], {
      tags: ['supplier:qualification', `supplier:qualification:${qualificationType}`]
    });
  }
  
  /**
   * Get suppliers by status
   * @param {string} status - Status
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Suppliers with the status
   */
  async getByStatus(status, options) {
    return this.callWithCache('getByStatus', [status, options], {
      tags: ['supplier:status', `supplier:status:${status}`]
    });
  }
}

module.exports = CachedSupplierService; 