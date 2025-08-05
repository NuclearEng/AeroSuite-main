/**
 * InspectionService.js
 * 
 * Domain service for the Inspection domain
 * Implements RF021 - Extract business logic into domain services
 * Implements RF070 - Inspection service implementation
 * Implements RF022 - Implement service interfaces
 */

const DomainService = require('../../../core/DomainService');
const Inspection = require('../models/Inspection');
const { DomainError, ValidationError } = require('../../../core/errors');
const inspectionRepository = require('../repositories/InspectionRepository');
const customerRepository = require('../../customer/repositories/CustomerRepository');
const supplierRepository = require('../../supplier/repositories/SupplierRepository');
const InspectionServiceInterface = require('../interfaces/InspectionServiceInterface');
const logger = require('../../../infrastructure/logger');

/**
 * Inspection domain service
 * Encapsulates business logic for inspections
 */
class InspectionService extends DomainService {
  /**
   * Create a new inspection service
   * @param {Object} dependencies - Dependencies required by the service
   */
  constructor(dependencies = {}) {
    super({
      inspectionRepository: inspectionRepository,
      customerRepository: customerRepository,
      supplierRepository: supplierRepository,
      ...dependencies
    });
    
    // Register with the service interface
    const inspectionServiceInterface = InspectionServiceInterface.getInstance();
    inspectionServiceInterface.setImplementation(this);
  }
  
  /**
   * Validate dependencies
   * @throws {DomainError} - If a required dependency is missing
   */
  validateDependencies() {
    if (!this.dependencies.inspectionRepository) {
      throw new DomainError('InspectionRepository is required');
    }
    
    if (!this.dependencies.customerRepository) {
      throw new DomainError('CustomerRepository is required');
    }
    
    if (!this.dependencies.supplierRepository) {
      throw new DomainError('SupplierRepository is required');
    }
  }
  
  /**
   * Get the inspection repository
   * @returns {Object} - The inspection repository
   */
  getRepository() {
    return this.getDependency('inspectionRepository');
  }
  
  /**
   * Get an inspection by ID with performance logging
   */
  async getInspection(id) {
    const start = Date.now();
    const result = await this.getRepository().findById(id);
    logger.debug('getInspection duration', { ms: Date.now() - start, id });
    if (!result) throw new Error('Inspection not found');
    return result;
  }
  
  /**
   * Find all inspections matching the query
   * @param {Object} options - Query options
   * @param {Object} options.filter - Filter to match inspections against
   * @param {number} options.page - Page number
   * @param {number} options.limit - Number of items per page
   * @param {string} options.sort - Sort field
   * @returns {Promise<Object>} - Object containing inspections and total count
   */
  async findAll({ filter = {}, page = 1, limit = 10, sort = 'scheduledDate' }) {
    const skip = (page - 1) * limit;
    const sortDirection = sort.startsWith('-') ? -1 : 1;
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortOptions = { [sortField]: sortDirection };
    
    // Process filter
    const query = this.buildFilterQuery(filter);
    
    // Get inspections and total count
    const start = Date.now();
    const inspections = await this.getRepository().findAll(query, { skip, limit, sort: sortOptions });
    const total = await this.getRepository().count(query);
    logger.debug('findAll duration', { ms: Date.now() - start, query });
    
    return {
      data: inspections,
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
    
    if (filter.type) {
      query.type = filter.type;
    }
    
    if (filter.status) {
      query.status = filter.status;
    }
    
    if (filter.customerId) {
      query.customerId = filter.customerId;
    }
    
    if (filter.supplierId) {
      query.supplierId = filter.supplierId;
    }
    
    if (filter.inspectorId) {
      query.inspectorId = filter.inspectorId;
    }
    
    if (filter.location) {
      query['location.address'] = { $regex: filter.location, $options: 'i' };
    }
    
    if (filter.dateFrom) {
      query.scheduledDate = { $gte: new Date(filter.dateFrom) };
    }
    
    if (filter.dateTo) {
      query.scheduledDate = { ...query.scheduledDate, $lte: new Date(filter.dateTo) };
    }
    
    if (filter.priority) {
      query.priority = filter.priority;
    }
    
    return query;
  }
  
  /**
   * Create a new inspection with performance logging
   */
  async create(inspectionData) {
    const start = Date.now();
    // Validate required fields
    if (!inspectionData.type) {
      throw new ValidationError('Inspection type is required');
    }
    
    if (!inspectionData.scheduledDate) {
      throw new ValidationError('Scheduled date is required');
    }
    
    if (!inspectionData.customerId) {
      throw new ValidationError('Customer ID is required');
    }
    
    // Verify that the customer exists
    const customerExists = await this.getDependency('customerRepository').exists({ _id: inspectionData.customerId });
    if (!customerExists) {
      throw new ValidationError(`Customer with ID ${inspectionData.customerId} not found`);
    }
    
    // Verify that the supplier exists if provided
    if (inspectionData.supplierId) {
      const supplierExists = await this.getDependency('supplierRepository').exists({ _id: inspectionData.supplierId });
      if (!supplierExists) {
        throw new ValidationError(`Supplier with ID ${inspectionData.supplierId} not found`);
      }
    }
    
    // Create inspection
    const inspection = Inspection.create(inspectionData);
    
    // Save inspection
    const savedInspection = await this.getRepository().save(inspection);
    logger.debug('createInspection duration', { ms: Date.now() - start });
    
    // Publish event
    this.publishEvent('inspection.created', { inspection: savedInspection.toObject() });
    
    return savedInspection;
  }
  
  /**
   * Update an inspection with performance logging
   */
  async update(id, inspectionData) {
    const start = Date.now();
    // Find inspection
    const inspection = await this.getInspection(id);
    
    if (!inspection) {
      throw new ValidationError(`Inspection with ID ${id} not found`);
    }
    
    // Verify that the customer exists if being updated
    if (inspectionData.customerId && inspectionData.customerId !== inspection.customerId) {
      const customerExists = await this.getDependency('customerRepository').exists({ _id: inspectionData.customerId });
      if (!customerExists) {
        throw new ValidationError(`Customer with ID ${inspectionData.customerId} not found`);
      }
    }
    
    // Verify that the supplier exists if being updated
    if (inspectionData.supplierId && inspectionData.supplierId !== inspection.supplierId) {
      const supplierExists = await this.getDependency('supplierRepository').exists({ _id: inspectionData.supplierId });
      if (!supplierExists) {
        throw new ValidationError(`Supplier with ID ${inspectionData.supplierId} not found`);
      }
    }
    
    // Update basic details
    if (inspectionData.type || inspectionData.scheduledDate || inspectionData.customerId || 
        inspectionData.supplierId || inspectionData.inspectorId || inspectionData.description ||
        inspectionData.priority || inspectionData.notes) {
      inspection.updateDetails(inspectionData);
    }
    
    // Update location
    if (inspectionData.location) {
      inspection.updateLocation(inspectionData.location);
    }
    
    // Update status
    if (inspectionData.status) {
      switch (inspectionData.status) {
        case 'scheduled':
          inspection.schedule(inspectionData.scheduledDate);
          break;
        case 'in-progress':
          inspection.start();
          break;
        case 'completed':
          inspection.complete(inspectionData.completionDetails);
          break;
        case 'cancelled':
          inspection.cancel(inspectionData.cancellationReason);
          break;
      }
    }
    
    // Save inspection
    const savedInspection = await this.getRepository().save(inspection);
    logger.debug('updateInspection duration', { ms: Date.now() - start });
    
    // Publish event
    this.publishEvent('inspection.updated', { 
      inspection: savedInspection.toObject(),
      updatedFields: Object.keys(inspectionData)
    });
    
    return savedInspection;
  }
  
  /**
   * Delete an inspection with performance logging
   */
  async delete(id) {
    const start = Date.now();
    // Find inspection
    const inspection = await this.getInspection(id);
    
    if (!inspection) {
      throw new ValidationError(`Inspection with ID ${id} not found`);
    }
    
    // Check if the inspection can be deleted
    if (['in-progress', 'completed'].includes(inspection.status)) {
      throw new ValidationError(`Cannot delete an inspection with status: ${inspection.status}`);
    }
    
    // Delete inspection
    const deleted = await this.getRepository().delete(id);
    logger.debug('deleteInspection duration', { ms: Date.now() - start, id });
    
    if (deleted) {
      // Publish event
      this.publishEvent('inspection.deleted', { inspectionId: id });
    }
    
    return deleted;
  }
  
  /**
   * Schedule an inspection
   * @param {string} id - ID of the inspection to schedule
   * @param {Date} scheduledDate - Date to schedule the inspection for
   * @returns {Promise<Inspection>} - Scheduled inspection
   */
  async schedule(id, scheduledDate) {
    // Find inspection
    const inspection = await this.getInspection(id);
    
    if (!inspection) {
      throw new ValidationError(`Inspection with ID ${id} not found`);
    }
    
    // Schedule inspection
    inspection.schedule(scheduledDate);
    
    // Save inspection
    const savedInspection = await this.getRepository().save(inspection);
    
    // Publish event
    this.publishEvent('inspection.scheduled', { 
      inspection: savedInspection.toObject(),
      scheduledDate
    });
    
    return savedInspection;
  }
  
  /**
   * Start an inspection
   * @param {string} id - ID of the inspection to start
   * @returns {Promise<Inspection>} - Started inspection
   */
  async start(id) {
    // Find inspection
    const inspection = await this.getInspection(id);
    
    if (!inspection) {
      throw new ValidationError(`Inspection with ID ${id} not found`);
    }
    
    // Start inspection
    inspection.start();
    
    // Save inspection
    const savedInspection = await this.getRepository().save(inspection);
    
    // Publish event
    this.publishEvent('inspection.started', { 
      inspection: savedInspection.toObject()
    });
    
    return savedInspection;
  }
  
  /**
   * Complete an inspection
   * @param {string} id - ID of the inspection to complete
   * @param {Object} completionDetails - Details of the completion
   * @returns {Promise<Inspection>} - Completed inspection
   */
  async complete(id, completionDetails) {
    // Find inspection
    const inspection = await this.getInspection(id);
    
    if (!inspection) {
      throw new ValidationError(`Inspection with ID ${id} not found`);
    }
    
    // Complete inspection
    inspection.complete(completionDetails);
    
    // Save inspection
    const savedInspection = await this.getRepository().save(inspection);
    
    // Publish event
    this.publishEvent('inspection.completed', { 
      inspection: savedInspection.toObject(),
      completionDetails
    });
    
    return savedInspection;
  }
  
  /**
   * Cancel an inspection
   * @param {string} id - ID of the inspection to cancel
   * @param {string} reason - Reason for cancellation
   * @returns {Promise<Inspection>} - Cancelled inspection
   */
  async cancel(id, reason) {
    // Find inspection
    const inspection = await this.getInspection(id);
    
    if (!inspection) {
      throw new ValidationError(`Inspection with ID ${id} not found`);
    }
    
    // Cancel inspection
    inspection.cancel(reason);
    
    // Save inspection
    const savedInspection = await this.getRepository().save(inspection);
    
    // Publish event
    this.publishEvent('inspection.cancelled', { 
      inspection: savedInspection.toObject(),
      reason
    });
    
    return savedInspection;
  }
  
  /**
   * Add a finding to an inspection
   * @param {string} inspectionId - ID of the inspection
   * @param {Object} findingData - Finding data
   * @returns {Promise<Object>} - Added finding
   */
  async addFinding(inspectionId, findingData) {
    // Find inspection
    const inspection = await this.getInspection(inspectionId);
    
    if (!inspection) {
      throw new ValidationError(`Inspection with ID ${inspectionId} not found`);
    }
    
    // Validate finding data
    if (!findingData.description) {
      throw new ValidationError('Finding description is required');
    }
    
    if (!findingData.severity) {
      throw new ValidationError('Finding severity is required');
    }
    
    // Add finding
    const finding = inspection.addFinding(findingData);
    
    // Save inspection
    await this.getRepository().save(inspection);
    
    // Publish event
    this.publishEvent('inspection.finding.added', { 
      inspectionId,
      finding
    });
    
    return finding;
  }
  
  /**
   * Update a finding in an inspection
   * @param {string} inspectionId - ID of the inspection
   * @param {string} findingId - ID of the finding
   * @param {Object} findingData - Finding data
   * @returns {Promise<Object>} - Updated finding
   */
  async updateFinding(inspectionId, findingId, findingData) {
    // Find inspection
    const inspection = await this.getInspection(inspectionId);
    
    if (!inspection) {
      throw new ValidationError(`Inspection with ID ${inspectionId} not found`);
    }
    
    // Update finding
    const finding = inspection.updateFinding(findingId, findingData);
    
    // Save inspection
    await this.getRepository().save(inspection);
    
    // Publish event
    this.publishEvent('inspection.finding.updated', { 
      inspectionId,
      findingId,
      finding
    });
    
    return finding;
  }
  
  /**
   * Remove a finding from an inspection
   * @param {string} inspectionId - ID of the inspection
   * @param {string} findingId - ID of the finding
   * @returns {Promise<boolean>} - True if the finding was removed
   */
  async removeFinding(inspectionId, findingId) {
    // Find inspection
    const inspection = await this.getInspection(inspectionId);
    
    if (!inspection) {
      throw new ValidationError(`Inspection with ID ${inspectionId} not found`);
    }
    
    // Remove finding
    const removed = inspection.removeFinding(findingId);
    
    if (removed) {
      // Save inspection
      await this.getRepository().save(inspection);
      
      // Publish event
      this.publishEvent('inspection.finding.removed', { 
        inspectionId,
        findingId
      });
    }
    
    return removed;
  }
  
  /**
   * Get inspections by customer
   * @param {string} customerId - Customer ID
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Inspections for the customer
   */
  async getByCustomer(customerId, options = {}) {
    return this.findAll({ 
      filter: { customerId },
      ...options
    });
  }
  
  /**
   * Get inspections by supplier
   * @param {string} supplierId - Supplier ID
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Inspections for the supplier
   */
  async getBySupplier(supplierId, options = {}) {
    return this.findAll({ 
      filter: { supplierId },
      ...options
    });
  }
  
  /**
   * Get inspections by inspector
   * @param {string} inspectorId - Inspector ID
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Inspections for the inspector
   */
  async getByInspector(inspectorId, options = {}) {
    return this.findAll({ 
      filter: { inspectorId },
      ...options
    });
  }
  
  /**
   * Get inspections by status
   * @param {string} status - Inspection status
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Inspections with the status
   */
  async getByStatus(status, options = {}) {
    return this.findAll({ 
      filter: { status },
      ...options
    });
  }
  
  /**
   * Get inspections by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Inspections in the date range
   */
  async getByDateRange(startDate, endDate, options = {}) {
    return this.findAll({ 
      filter: { dateFrom: startDate, dateTo: endDate },
      ...options
    });
  }
  
  /**
   * Get inspection statistics
   * @returns {Promise<Object>} - The inspection statistics
   */
  async getStats() {
    try {
      logger.debug('Getting inspection statistics');
      
      // Get counts by status
      const statusCounts = await this.getRepository().countByStatus();
      
      // Get counts by type
      const typeCounts = await this.getRepository().countByType();
      
      // Get monthly trend data
      const monthlyTrends = await this.getRepository().getMonthlyTrends();
      
      // Get supplier performance data
      const supplierPerformance = await this.getRepository().getSupplierPerformance(5);
      
      // Format and return statistics
      return {
        statusCounts,
        typeCounts,
        monthlyTrends,
        supplierPerformance,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error getting inspection statistics:', error);
      throw error;
    }
  }

  /**
   * Find inspections by supplier ID
   * @param {string} supplierId - The supplier ID
   * @param {Object} options - Query options (pagination, etc.)
   * @returns {Promise<Object>} - The inspections for the supplier
   */
  async findBySupplier(supplierId, options = { page: 1, limit: 10 }) {
    try {
      logger.debug(`Finding inspections for supplier ${supplierId}`);
      
      // Validate supplier ID
      if (!supplierId) {
        throw new ValidationError('Supplier ID is required');
      }

      // Get inspections from repository
      const inspections = await this.getRepository().findBySupplier(supplierId, options);
      
      // Return formatted result
      return {
        data: inspections.data,
        pagination: inspections.pagination
      };
    } catch (error) {
      logger.error(`Error finding inspections for supplier ${supplierId}:`, error);
      throw error;
    }
  }
}

// Export the singleton instance
const inspectionService = new InspectionService();
module.exports = inspectionService; 