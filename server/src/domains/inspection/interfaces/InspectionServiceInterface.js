/**
 * InspectionServiceInterface.js
 * 
 * Interface for inspection services
 * Implements RF022 - Implement service interfaces
 */

const ServiceInterface = require('../../../core/interfaces/ServiceInterface');
const ServiceRegistry = require('../../../core/interfaces/ServiceRegistry');

/**
 * Inspection service interface
 * Defines the contract for inspection services
 */
class InspectionServiceInterface extends ServiceInterface {
  /**
   * Create a new inspection service interface
   */
  constructor() {
    super();
    this.implementation = null;
  }
  
  /**
   * Get the singleton instance of the inspection service interface
   * @returns {InspectionServiceInterface} - The singleton instance
   */
  static getInstance() {
    if (!InspectionServiceInterface.instance) {
      InspectionServiceInterface.instance = new InspectionServiceInterface();
      
      // Register this interface with the service registry
      const registry = ServiceRegistry.getInstance();
      registry.registerInterface('inspectionService', InspectionServiceInterface.instance);
    }
    
    return InspectionServiceInterface.instance;
  }
  
  /**
   * Set the implementation for this interface
   * @param {Object} implementation - The inspection service implementation
   */
  setImplementation(implementation) {
    if (!this.isValidImplementation(implementation)) {
      throw new Error('Implementation does not satisfy the InspectionServiceInterface');
    }
    
    this.implementation = implementation;
    
    // Register the implementation with the service registry
    const registry = ServiceRegistry.getInstance();
    registry.registerImplementation('inspectionService', implementation);
  }
  
  /**
   * Get the implementation of the inspection service
   * @returns {Object} - The inspection service implementation
   */
  getImplementation() {
    if (!this.implementation) {
      throw new Error('No implementation has been set for InspectionServiceInterface');
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
      'schedule',
      'start',
      'complete',
      'cancel',
      'addFinding',
      'updateFinding',
      'removeFinding',
      'getByCustomer',
      'getBySupplier',
      'getByInspector',
      'getByStatus',
      'getByDateRange'
    ];
    
    return requiredMethods.every(method => 
      typeof implementation[method] === 'function'
    );
  }
  
  // Proxy methods to the implementation
  
  /**
   * Find an inspection by ID
   * @param {string} id - ID of the inspection to find
   * @returns {Promise<Object|null>} - Inspection if found, null otherwise
   */
  async findById(id) {
    return this.getImplementation().findById(id);
  }
  
  /**
   * Find all inspections matching the query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Object containing inspections and total count
   */
  async findAll(options) {
    return this.getImplementation().findAll(options);
  }
  
  /**
   * Create a new inspection
   * @param {Object} inspectionData - Data for the new inspection
   * @returns {Promise<Object>} - Created inspection
   */
  async create(inspectionData) {
    return this.getImplementation().create(inspectionData);
  }
  
  /**
   * Update an inspection
   * @param {string} id - ID of the inspection to update
   * @param {Object} inspectionData - Data to update
   * @returns {Promise<Object>} - Updated inspection
   */
  async update(id, inspectionData) {
    return this.getImplementation().update(id, inspectionData);
  }
  
  /**
   * Delete an inspection
   * @param {string} id - ID of the inspection to delete
   * @returns {Promise<boolean>} - True if the inspection was deleted
   */
  async delete(id) {
    return this.getImplementation().delete(id);
  }
  
  /**
   * Schedule an inspection
   * @param {string} id - ID of the inspection to schedule
   * @param {Date} scheduledDate - Date to schedule the inspection for
   * @returns {Promise<Object>} - Scheduled inspection
   */
  async schedule(id, scheduledDate) {
    return this.getImplementation().schedule(id, scheduledDate);
  }
  
  /**
   * Start an inspection
   * @param {string} id - ID of the inspection to start
   * @returns {Promise<Object>} - Started inspection
   */
  async start(id) {
    return this.getImplementation().start(id);
  }
  
  /**
   * Complete an inspection
   * @param {string} id - ID of the inspection to complete
   * @param {Object} completionDetails - Details of the completion
   * @returns {Promise<Object>} - Completed inspection
   */
  async complete(id, completionDetails) {
    return this.getImplementation().complete(id, completionDetails);
  }
  
  /**
   * Cancel an inspection
   * @param {string} id - ID of the inspection to cancel
   * @param {string} reason - Reason for cancellation
   * @returns {Promise<Object>} - Cancelled inspection
   */
  async cancel(id, reason) {
    return this.getImplementation().cancel(id, reason);
  }
  
  /**
   * Add a finding to an inspection
   * @param {string} inspectionId - ID of the inspection
   * @param {Object} findingData - Finding data
   * @returns {Promise<Object>} - Added finding
   */
  async addFinding(inspectionId, findingData) {
    return this.getImplementation().addFinding(inspectionId, findingData);
  }
  
  /**
   * Update a finding in an inspection
   * @param {string} inspectionId - ID of the inspection
   * @param {string} findingId - ID of the finding
   * @param {Object} findingData - Finding data
   * @returns {Promise<Object>} - Updated finding
   */
  async updateFinding(inspectionId, findingId, findingData) {
    return this.getImplementation().updateFinding(inspectionId, findingId, findingData);
  }
  
  /**
   * Remove a finding from an inspection
   * @param {string} inspectionId - ID of the inspection
   * @param {string} findingId - ID of the finding
   * @returns {Promise<boolean>} - True if the finding was removed
   */
  async removeFinding(inspectionId, findingId) {
    return this.getImplementation().removeFinding(inspectionId, findingId);
  }
  
  /**
   * Get inspections by customer
   * @param {string} customerId - Customer ID
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Inspections for the customer
   */
  async getByCustomer(customerId, options) {
    return this.getImplementation().getByCustomer(customerId, options);
  }
  
  /**
   * Get inspections by supplier
   * @param {string} supplierId - Supplier ID
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Inspections for the supplier
   */
  async getBySupplier(supplierId, options) {
    return this.getImplementation().getBySupplier(supplierId, options);
  }
  
  /**
   * Get inspections by inspector
   * @param {string} inspectorId - Inspector ID
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Inspections for the inspector
   */
  async getByInspector(inspectorId, options) {
    return this.getImplementation().getByInspector(inspectorId, options);
  }
  
  /**
   * Get inspections by status
   * @param {string} status - Inspection status
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Inspections with the status
   */
  async getByStatus(status, options) {
    return this.getImplementation().getByStatus(status, options);
  }
  
  /**
   * Get inspections by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Inspections in the date range
   */
  async getByDateRange(startDate, endDate, options) {
    return this.getImplementation().getByDateRange(startDate, endDate, options);
  }
}

module.exports = InspectionServiceInterface; 