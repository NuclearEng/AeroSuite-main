/**
 * StatelessSupplierService.js
 * 
 * Stateless implementation of the supplier service
 * Implements RF037 - Ensure all services are stateless
 */

const StatelessService = require('../../../core/StatelessService');
const Supplier = require('../models/Supplier');
const Address = require('../models/Address');
const Contact = require('../models/Contact');
const Qualification = require('../models/Qualification');
const { DomainError, ValidationError } = require('../../../core/errors');
const SupplierServiceInterface = require('../interfaces/SupplierServiceInterface');

/**
 * Stateless supplier service
 * Encapsulates business logic for suppliers without maintaining state
 */
class StatelessSupplierService extends StatelessService {
  /**
   * Create a new stateless supplier service
   * @param {Object} dependencies - Dependencies required by the service
   */
  constructor(dependencies = {}) {
    super({
      supplierRepository: dependencies.supplierRepository,
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
    if (!this.getDependency('supplierRepository')) {
      throw new DomainError('Supplier repository is required');
    }
  }
  
  /**
   * Find a supplier by ID
   * @param {string} id - ID of the supplier to find
   * @returns {Promise<Object|null>} - Supplier if found, null otherwise
   */
  async findById(id) {
    const supplierRepository = this.getDependency('supplierRepository');
    const supplier = await supplierRepository.findById(id);
    
    // Publish event
    if (supplier) {
      this.publishEvent('supplier.viewed', { supplierId: id });
    }
    
    return supplier;
  }
  
  /**
   * Find all suppliers matching the query
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Object containing suppliers and total count
   */
  async findAll(options) {
    const supplierRepository = this.getDependency('supplierRepository');
    const result = await supplierRepository.findAll(options);
    
    // Publish event
    this.publishEvent('supplier.list.viewed', { 
      count: result.suppliers.length,
      total: result.total,
      filters: options.filters
    });
    
    return result;
  }
  
  /**
   * Create a new supplier
   * @param {Object} supplierData - Data for the new supplier
   * @returns {Promise<Object>} - Created supplier
   */
  async create(supplierData) {
    const supplierRepository = this.getDependency('supplierRepository');
    
    // Validate supplier data
    this._validateSupplierData(supplierData);
    
    // Create supplier entity
    const supplier = new Supplier({
      name: supplierData.name,
      code: supplierData.code,
      type: supplierData.type,
      status: supplierData.status || 'active',
      taxId: supplierData.taxId,
      website: supplierData.website,
      industry: supplierData.industry,
      description: supplierData.description
    });
    
    // Add address if provided
    if (supplierData.address) {
      const address = new Address(supplierData.address);
      supplier.setAddress(address);
    }
    
    // Add contacts if provided
    if (supplierData.contacts && Array.isArray(supplierData.contacts)) {
      supplierData.contacts.forEach(contactData => {
        const contact = new Contact(contactData);
        supplier.addContact(contact);
      });
    }
    
    // Add qualifications if provided
    if (supplierData.qualifications && Array.isArray(supplierData.qualifications)) {
      supplierData.qualifications.forEach(qualificationData => {
        const qualification = new Qualification(qualificationData);
        supplier.addQualification(qualification);
      });
    }
    
    // Save supplier
    const createdSupplier = await supplierRepository.create(supplier);
    
    // Publish event
    this.publishEvent('supplier.created', { 
      supplierId: createdSupplier.id,
      name: createdSupplier.name,
      type: createdSupplier.type
    });
    
    return createdSupplier;
  }
  
  /**
   * Update a supplier
   * @param {string} id - ID of the supplier to update
   * @param {Object} supplierData - Data to update
   * @returns {Promise<Object>} - Updated supplier
   */
  async update(id, supplierData) {
    const supplierRepository = this.getDependency('supplierRepository');
    
    // Find existing supplier
    const existingSupplier = await supplierRepository.findById(id);
    if (!existingSupplier) {
      throw new DomainError(`Supplier not found: ${id}`);
    }
    
    // Update supplier properties
    if (supplierData.name) existingSupplier.name = supplierData.name;
    if (supplierData.code) existingSupplier.code = supplierData.code;
    if (supplierData.type) existingSupplier.type = supplierData.type;
    if (supplierData.status) existingSupplier.status = supplierData.status;
    if (supplierData.taxId) existingSupplier.taxId = supplierData.taxId;
    if (supplierData.website) existingSupplier.website = supplierData.website;
    if (supplierData.industry) existingSupplier.industry = supplierData.industry;
    if (supplierData.description) existingSupplier.description = supplierData.description;
    
    // Update address if provided
    if (supplierData.address) {
      const address = new Address(supplierData.address);
      existingSupplier.setAddress(address);
    }
    
    // Save updated supplier
    const updatedSupplier = await supplierRepository.update(id, existingSupplier);
    
    // Publish event
    this.publishEvent('supplier.updated', { 
      supplierId: updatedSupplier.id,
      name: updatedSupplier.name,
      changes: Object.keys(supplierData)
    });
    
    return updatedSupplier;
  }
  
  /**
   * Delete a supplier
   * @param {string} id - ID of the supplier to delete
   * @returns {Promise<boolean>} - True if the supplier was deleted
   */
  async delete(id) {
    const supplierRepository = this.getDependency('supplierRepository');
    
    // Find existing supplier
    const existingSupplier = await supplierRepository.findById(id);
    if (!existingSupplier) {
      throw new DomainError(`Supplier not found: ${id}`);
    }
    
    // Delete supplier
    const result = await supplierRepository.delete(id);
    
    // Publish event
    this.publishEvent('supplier.deleted', { 
      supplierId: id,
      name: existingSupplier.name
    });
    
    return result;
  }
  
  /**
   * Add a contact to a supplier
   * @param {string} supplierId - ID of the supplier
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} - Added contact
   */
  async addContact(supplierId, contactData) {
    const supplierRepository = this.getDependency('supplierRepository');
    
    // Find existing supplier
    const existingSupplier = await supplierRepository.findById(supplierId);
    if (!existingSupplier) {
      throw new DomainError(`Supplier not found: ${supplierId}`);
    }
    
    // Create and add contact
    const contact = new Contact(contactData);
    existingSupplier.addContact(contact);
    
    // Save updated supplier
    await supplierRepository.update(supplierId, existingSupplier);
    
    // Publish event
    this.publishEvent('supplier.contact.added', { 
      supplierId,
      contactId: contact.id,
      name: contact.name
    });
    
    return contact;
  }
  
  /**
   * Validate supplier data
   * @param {Object} supplierData - Data to validate
   * @throws {ValidationError} - If data is invalid
   * @private
   */
  _validateSupplierData(supplierData) {
    if (!supplierData.name) {
      throw new ValidationError('Supplier name is required');
    }
    
    if (!supplierData.code) {
      throw new ValidationError('Supplier code is required');
    }
    
    if (!supplierData.type) {
      throw new ValidationError('Supplier type is required');
    }
    
    // Additional validation can be added here
  }
}

module.exports = StatelessSupplierService; 