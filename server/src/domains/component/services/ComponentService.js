/**
 * ComponentService.js
 * 
 * Domain service for the Component domain
 * Implements RF021 - Extract business logic into domain services
 * Implements RF071 - Component service implementation
 * Implements RF022 - Implement service interfaces
 */

const DomainService = require('../../../core/DomainService');
const Component = require('../models/Component');
const { DomainError, ValidationError } = require('../../../core/errors');
const componentRepository = require('../repositories/ComponentRepository');
const supplierRepository = require('../../supplier/repositories/SupplierRepository');
const ComponentServiceInterface = require('../interfaces/ComponentServiceInterface');
const logger = require('../../../infrastructure/logger');

/**
 * Component domain service
 * Encapsulates business logic for components
 */
class ComponentService extends DomainService {
  /**
   * Create a new component service
   * @param {Object} dependencies - Dependencies required by the service
   */
  constructor(dependencies = {}) {
    super({
      componentRepository: componentRepository,
      supplierRepository: supplierRepository,
      ...dependencies
    });
    
    // Register with the service interface
    const componentServiceInterface = ComponentServiceInterface.getInstance();
    componentServiceInterface.setImplementation(this);
  }
  
  /**
   * Validate dependencies
   * @throws {DomainError} - If a required dependency is missing
   */
  validateDependencies() {
    if (!this.dependencies.componentRepository) {
      throw new DomainError('ComponentRepository is required');
    }
    
    if (!this.dependencies.supplierRepository) {
      throw new DomainError('SupplierRepository is required');
    }
  }
  
  /**
   * Get the component repository
   * @returns {Object} - The component repository
   */
  getRepository() {
    return this.getDependency('componentRepository');
  }
  
  /**
   * Find a component by ID
   * @param {string} id - ID of the component to find
   * @returns {Promise<Component|null>} - Component if found, null otherwise
   */
  async findById(id) {
    if (!id) {
      throw new ValidationError('Component ID is required');
    }
    
    const start = Date.now();
    const result = await this.getRepository().findById(id);
    logger.debug('findById duration', { ms: Date.now() - start, id });
    return result;
  }
  
  /**
   * Find all components matching the query
   * @param {Object} options - Query options
   * @param {Object} options.filter - Filter to match components against
   * @param {number} options.page - Page number
   * @param {number} options.limit - Number of items per page
   * @param {string} options.sort - Sort field
   * @returns {Promise<Object>} - Object containing components and total count
   */
  async findAll({ filter = {}, page = 1, limit = 10, sort = 'name' }) {
    const skip = (page - 1) * limit;
    const sortDirection = sort.startsWith('-') ? -1 : 1;
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortOptions = { [sortField]: sortDirection };
    
    // Process filter
    const query = this.buildFilterQuery(filter);
    
    const start = Date.now();
    // Get components and total count
    const components = await this.getRepository().findAll(query, { skip, limit, sort: sortOptions });
    const total = await this.getRepository().count(query);
    logger.debug('findAll duration', { ms: Date.now() - start, query });
    
    return {
      data: components,
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
    
    if (filter.partNumber) {
      query.partNumber = { $regex: filter.partNumber, $options: 'i' };
    }
    
    if (filter.status) {
      query.status = filter.status;
    }
    
    if (filter.category) {
      query.category = filter.category;
    }
    
    if (filter.supplierId) {
      query.supplierId = filter.supplierId;
    }
    
    if (filter.minStock !== undefined) {
      query.stockQuantity = { $gte: Number(filter.minStock) };
    }
    
    if (filter.maxStock !== undefined) {
      query.stockQuantity = { ...query.stockQuantity, $lte: Number(filter.maxStock) };
    }
    
    if (filter.tags) {
      const tags = Array.isArray(filter.tags) ? filter.tags : [filter.tags];
      query.tags = { $in: tags };
    }
    
    return query;
  }
  
  /**
   * Create a new component
   * @param {Object} componentData - Data for the new component
   * @returns {Promise<Component>} - Created component
   */
  async create(componentData) {
    // Validate required fields
    if (!componentData.name) {
      throw new ValidationError('Component name is required');
    }
    
    if (!componentData.partNumber) {
      throw new ValidationError('Component part number is required');
    }
    
    // Check if component part number already exists
    const partNumberExists = await this.getRepository().exists({ partNumber: componentData.partNumber });
    if (partNumberExists) {
      throw new ValidationError(`Component with part number ${componentData.partNumber} already exists`);
    }
    
    // Verify that the supplier exists if provided
    if (componentData.supplierId) {
      const supplierExists = await this.getDependency('supplierRepository').exists({ _id: componentData.supplierId });
      if (!supplierExists) {
        throw new ValidationError(`Supplier with ID ${componentData.supplierId} not found`);
      }
    }
    
    // Create component
    const component = Component.create(componentData);
    
    const start = Date.now();
    // Save component
    const savedComponent = await this.getRepository().save(component);
    logger.debug('create duration', { ms: Date.now() - start });
    
    // Publish event
    this.publishEvent('component.created', { component: savedComponent.toObject() });
    
    return savedComponent;
  }
  
  /**
   * Update a component
   * @param {string} id - ID of the component to update
   * @param {Object} componentData - Data to update
   * @returns {Promise<Component>} - Updated component
   */
  async update(id, componentData) {
    // Find component
    const component = await this.findById(id);
    
    if (!component) {
      throw new ValidationError(`Component with ID ${id} not found`);
    }
    
    // Check if part number is being changed and if it already exists
    if (componentData.partNumber && componentData.partNumber !== component.partNumber) {
      const partNumberExists = await this.getRepository().exists({ 
        partNumber: componentData.partNumber,
        _id: { $ne: id }
      });
      
      if (partNumberExists) {
        throw new ValidationError(`Component with part number ${componentData.partNumber} already exists`);
      }
    }
    
    // Verify that the supplier exists if being updated
    if (componentData.supplierId && componentData.supplierId !== component.supplierId) {
      const supplierExists = await this.getDependency('supplierRepository').exists({ _id: componentData.supplierId });
      if (!supplierExists) {
        throw new ValidationError(`Supplier with ID ${componentData.supplierId} not found`);
      }
    }
    
    // Update basic details
    if (componentData.name || componentData.partNumber || componentData.description || 
        componentData.category || componentData.supplierId || componentData.tags) {
      component.updateDetails(componentData);
    }
    
    // Update specifications
    if (componentData.specifications) {
      component.updateSpecifications(componentData.specifications);
    }
    
    // Update stock quantity
    if (componentData.stockQuantity !== undefined) {
      component.updateStock(componentData.stockQuantity);
    }
    
    // Update status
    if (componentData.status) {
      switch (componentData.status) {
        case 'active':
          component.activate();
          break;
        case 'discontinued':
          component.discontinue();
          break;
        case 'out-of-stock':
          component.markOutOfStock();
          break;
      }
    }
    
    const start = Date.now();
    // Save component
    const savedComponent = await this.getRepository().save(component);
    logger.debug('update duration', { ms: Date.now() - start });
    
    // Publish event
    this.publishEvent('component.updated', { 
      component: savedComponent.toObject(),
      updatedFields: Object.keys(componentData)
    });
    
    return savedComponent;
  }
  
  /**
   * Delete a component
   * @param {string} id - ID of the component to delete
   * @returns {Promise<boolean>} - True if the component was deleted
   */
  async delete(id) {
    // Find component
    const component = await this.findById(id);
    
    if (!component) {
      throw new ValidationError(`Component with ID ${id} not found`);
    }
    
    const start = Date.now();
    // Delete component
    const deleted = await this.getRepository().delete(id);
    logger.debug('delete duration', { ms: Date.now() - start, id });
    
    if (deleted) {
      // Publish event
      this.publishEvent('component.deleted', { componentId: id });
    }
    
    return deleted;
  }
  
  /**
   * Add stock to a component
   * @param {string} id - ID of the component
   * @param {number} quantity - Quantity to add
   * @param {string} reason - Reason for adding stock
   * @returns {Promise<Component>} - Updated component
   */
  async addStock(id, quantity, reason) {
    // Find component
    const component = await this.findById(id);
    
    if (!component) {
      throw new ValidationError(`Component with ID ${id} not found`);
    }
    
    // Validate quantity
    if (quantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero');
    }
    
    // Add stock
    component.addStock(quantity, reason);
    
    // Save component
    const savedComponent = await this.getRepository().save(component);
    
    // Publish event
    this.publishEvent('component.stock.added', { 
      componentId: id,
      quantity,
      reason,
      newStockLevel: savedComponent.stockQuantity
    });
    
    return savedComponent;
  }
  
  /**
   * Remove stock from a component
   * @param {string} id - ID of the component
   * @param {number} quantity - Quantity to remove
   * @param {string} reason - Reason for removing stock
   * @returns {Promise<Component>} - Updated component
   */
  async removeStock(id, quantity, reason) {
    // Find component
    const component = await this.findById(id);
    
    if (!component) {
      throw new ValidationError(`Component with ID ${id} not found`);
    }
    
    // Validate quantity
    if (quantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero');
    }
    
    if (quantity > component.stockQuantity) {
      throw new ValidationError(`Cannot remove ${quantity} units. Only ${component.stockQuantity} in stock.`);
    }
    
    // Remove stock
    component.removeStock(quantity, reason);
    
    // Save component
    const savedComponent = await this.getRepository().save(component);
    
    // Publish event
    this.publishEvent('component.stock.removed', { 
      componentId: id,
      quantity,
      reason,
      newStockLevel: savedComponent.stockQuantity
    });
    
    return savedComponent;
  }
  
  /**
   * Add a document to a component
   * @param {string} id - ID of the component
   * @param {Object} documentData - Document data
   * @returns {Promise<Object>} - Added document
   */
  async addDocument(id, documentData) {
    // Find component
    const component = await this.findById(id);
    
    if (!component) {
      throw new ValidationError(`Component with ID ${id} not found`);
    }
    
    // Validate document data
    if (!documentData.name) {
      throw new ValidationError('Document name is required');
    }
    
    if (!documentData.url) {
      throw new ValidationError('Document URL is required');
    }
    
    // Add document
    const document = component.addDocument(documentData);
    
    // Save component
    await this.getRepository().save(component);
    
    // Publish event
    this.publishEvent('component.document.added', { 
      componentId: id,
      document
    });
    
    return document;
  }
  
  /**
   * Update a document on a component
   * @param {string} id - ID of the component
   * @param {string} documentId - ID of the document
   * @param {Object} documentData - Document data
   * @returns {Promise<Object>} - Updated document
   */
  async updateDocument(id, documentId, documentData) {
    // Find component
    const component = await this.findById(id);
    
    if (!component) {
      throw new ValidationError(`Component with ID ${id} not found`);
    }
    
    // Update document
    const document = component.updateDocument(documentId, documentData);
    
    // Save component
    await this.getRepository().save(component);
    
    // Publish event
    this.publishEvent('component.document.updated', { 
      componentId: id,
      documentId,
      document
    });
    
    return document;
  }
  
  /**
   * Remove a document from a component
   * @param {string} id - ID of the component
   * @param {string} documentId - ID of the document
   * @returns {Promise<boolean>} - True if the document was removed
   */
  async removeDocument(id, documentId) {
    // Find component
    const component = await this.findById(id);
    
    if (!component) {
      throw new ValidationError(`Component with ID ${id} not found`);
    }
    
    // Remove document
    const removed = component.removeDocument(documentId);
    
    if (removed) {
      // Save component
      await this.getRepository().save(component);
      
      // Publish event
      this.publishEvent('component.document.removed', { 
        componentId: id,
        documentId
      });
    }
    
    return removed;
  }
  
  /**
   * Search components by name, part number, or description
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
        { partNumber: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [query] } }
      ]
    };
    
    return this.findAll({ filter: searchQuery, page, limit });
  }
  
  /**
   * Get components by supplier
   * @param {string} supplierId - Supplier ID
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Components from the supplier
   */
  async getBySupplier(supplierId, options = {}) {
    return this.findAll({ 
      filter: { supplierId },
      ...options
    });
  }
  
  /**
   * Get components by category
   * @param {string} category - Component category
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Components in the category
   */
  async getByCategory(category, options = {}) {
    return this.findAll({ 
      filter: { category },
      ...options
    });
  }
  
  /**
   * Get components by status
   * @param {string} status - Component status
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Components with the status
   */
  async getByStatus(status, options = {}) {
    return this.findAll({ 
      filter: { status },
      ...options
    });
  }
  
  /**
   * Get components with low stock
   * @param {number} threshold - Stock threshold
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Components with stock below threshold
   */
  async getLowStock(threshold = 10, options = {}) {
    return this.findAll({ 
      filter: { maxStock: threshold },
      ...options
    });
  }
}

// Export the singleton instance
const componentService = new ComponentService();
module.exports = componentService; 