/**
 * supplierRepository.js
 * 
 * Repository implementation for Supplier domain
 */

const Repository = require('../../../core/Repository');
const Supplier = require('../models/Supplier');
const Address = require('../models/Address');
const Contact = require('../models/Contact');
const Qualification = require('../models/Qualification');
const mongoose = require('mongoose');
const SupplierModel = mongoose.model('Supplier');
const CacheManager = require('../../../infrastructure/caching/CacheManager');
const logger = require('../../../infrastructure/logger');

class SupplierRepository extends Repository {
  /**
   * Find a supplier by its ID, with caching
   * @param {string} id - ID of the supplier to find
   * @returns {Promise<Supplier|null>} - Supplier if found, null otherwise
   */
  async findById(id) {
    const cacheKey = `supplier:${id}`;
    // Try cache first
    let cached = await CacheManager.get(cacheKey);
    if (cached) return this._mapToDomainEntity(cached);
    const start = Date.now();
    try {
      const supplierDoc = await SupplierModel.findById(id);
      if (!supplierDoc) return null;
      const entity = this._mapToDomainEntity(supplierDoc);
      await CacheManager.set(cacheKey, supplierDoc.toObject(), { ttl: 300 });
      logger.debug('findById query time', { ms: Date.now() - start, id });
      return entity;
    } catch (error) {
      logger.error('Error in SupplierRepository.findById:', error);
      throw error;
    }
  }

  /**
   * Find all suppliers matching the query, with projection and query time logging
   * @param {Object} query - Query to match suppliers against
   * @param {Object} options - Options for pagination, sorting, projection, etc.
   * @returns {Promise<Array<Supplier>>} - Array of suppliers
   */
  async findAll(query = {}, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 }, projection = null } = options;
    const start = Date.now();
    try {
      const supplierDocs = await SupplierModel.find(query, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      logger.debug('findAll query time', { ms: Date.now() - start, query });
      return supplierDocs.map(doc => this._mapToDomainEntity(doc));
    } catch (error) {
      logger.error('Error in SupplierRepository.findAll:', error);
      throw error;
    }
  }

  /**
   * Save a supplier and invalidate cache
   * @param {Supplier} supplier - Supplier to save
   * @returns {Promise<Supplier>} - Saved supplier
   */
  async save(supplier) {
    const saved = await super.save(supplier);
    if (saved && saved.id) {
      await CacheManager.del(`supplier:${saved.id}`);
      await CacheManager.del(`supplier:name:${saved.name}`);
    }
    return saved;
  }

  /**
   * Delete a supplier and invalidate cache
   * @param {string|Supplier} idOrEntity - ID of the supplier to delete or the supplier itself
   * @returns {Promise<boolean>} - True if the supplier was deleted
   */
  async delete(idOrEntity) {
    const id = idOrEntity instanceof Supplier ? idOrEntity.id : idOrEntity;
    const entity = await this.findById(id);
    const result = await super.delete(idOrEntity);
    if (entity) {
      await CacheManager.del(`supplier:${id}`);
      await CacheManager.del(`supplier:name:${entity.name}`);
    }
    return result;
  }

  /**
   * Count suppliers matching the query
   * @param {Object} query - Query to match suppliers against
   * @returns {Promise<number>} - Number of suppliers matching the query
   */
  async count(query = {}) {
    try {
      return await SupplierModel.countDocuments(query);
    } catch (error) {
      console.error('Error in SupplierRepository.count:', error);
      throw error;
    }
  }

  /**
   * Check if a supplier exists
   * @param {Object} query - Query to match suppliers against
   * @returns {Promise<boolean>} - True if a supplier matching the query exists
   */
  async exists(query) {
    try {
      return await SupplierModel.exists(query) !== null;
    } catch (error) {
      console.error('Error in SupplierRepository.exists:', error);
      throw error;
    }
  }

  /**
   * Find suppliers by name (partial match), with caching
   * @param {string} name - Name to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Supplier>>} - Array of matching suppliers
   */
  async findByName(name, options = {}) {
    const cacheKey = `supplier:name:${name}`;
    let cached = await CacheManager.get(cacheKey);
    if (cached) return cached.map(doc => this._mapToDomainEntity(doc));
    try {
      const query = { name: { $regex: name, $options: 'i' } };
      const result = await this.findAll(query, options);
      await CacheManager.set(cacheKey, result.map(e => e), { ttl: 300 });
      return result;
    } catch (error) {
      logger.error('Error in SupplierRepository.findByName:', error);
      throw error;
    }
  }

  /**
   * Find suppliers by status
   * @param {string} status - Status to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Supplier>>} - Array of matching suppliers
   */
  async findByStatus(status, options = {}) {
    try {
      const query = { status };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in SupplierRepository.findByStatus:', error);
      throw error;
    }
  }

  /**
   * Find suppliers by category
   * @param {string} category - Category to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Supplier>>} - Array of matching suppliers
   */
  async findByCategory(category, options = {}) {
    try {
      const query = { categories: category };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in SupplierRepository.findByCategory:', error);
      throw error;
    }
  }

  /**
   * Find suppliers by qualification
   * @param {string} qualificationType - Qualification type to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Supplier>>} - Array of matching suppliers
   */
  async findByQualification(qualificationType, options = {}) {
    try {
      const query = { 'qualifications.type': qualificationType };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in SupplierRepository.findByQualification:', error);
      throw error;
    }
  }

  /**
   * Map a database entity to a domain entity
   * @param {Object} dbEntity - Database entity
   * @returns {Supplier} - Domain entity
   */
  _mapToDomainEntity(dbEntity) {
    if (!dbEntity) return null;
    
    const supplierData = {
      id: dbEntity._id.toString(),
      name: dbEntity.name,
      code: dbEntity.code,
      status: dbEntity.status,
      type: dbEntity.type,
      categories: dbEntity.categories,
      qualifications: dbEntity.qualifications,
      address: dbEntity.address,
      contacts: dbEntity.contacts,
      website: dbEntity.website,
      taxId: dbEntity.taxId,
      registrationNumber: dbEntity.registrationNumber,
      notes: dbEntity.notes,
      tags: dbEntity.tags,
      createdAt: dbEntity.createdAt,
      updatedAt: dbEntity.updatedAt
    };
    
    return new Supplier(supplierData);
  }

  /**
   * Map a domain entity to a database entity
   * @param {Supplier} domainEntity - Domain entity
   * @returns {Object} - Database entity
   */
  _mapToDatabaseEntity(domainEntity) {
    const supplierData = domainEntity.toObject();
    
    // Convert id to _id if it exists
    if (supplierData.id) {
      supplierData._id = supplierData.id;
      delete supplierData.id;
    }
    
    return supplierData;
  }

  /**
   * Get on-time delivery rate for a supplier
   * @param {string} id - The supplier ID
   * @returns {Promise<number>} - The on-time delivery rate (percentage)
   */
  async getOnTimeDeliveryRate(id) {
    try {
      // In a real implementation, this would query delivery data
      // For now, return a random value between 80-100%
      return Math.floor(Math.random() * 20) + 80;
    } catch (error) {
      logger.error(`Error getting on-time delivery rate for supplier ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get quality rate for a supplier
   * @param {string} id - The supplier ID
   * @returns {Promise<number>} - The quality rate (percentage)
   */
  async getQualityRate(id) {
    try {
      // In a real implementation, this would query quality inspection data
      // For now, return a random value between 85-100%
      return Math.floor(Math.random() * 15) + 85;
    } catch (error) {
      logger.error(`Error getting quality rate for supplier ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get average response time for a supplier
   * @param {string} id - The supplier ID
   * @returns {Promise<number>} - The average response time (hours)
   */
  async getAverageResponseTime(id) {
    try {
      // In a real implementation, this would query communication data
      // For now, return a random value between 1-48 hours
      return Math.floor(Math.random() * 47) + 1;
    } catch (error) {
      logger.error(`Error getting average response time for supplier ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get compliance score for a supplier
   * @param {string} id - The supplier ID
   * @returns {Promise<number>} - The compliance score (percentage)
   */
  async getComplianceScore(id) {
    try {
      // In a real implementation, this would query compliance data
      // For now, return a random value between 70-100%
      return Math.floor(Math.random() * 30) + 70;
    } catch (error) {
      logger.error(`Error getting compliance score for supplier ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get recent inspections for a supplier
   * @param {string} id - The supplier ID
   * @param {number} limit - Maximum number of inspections to return
   * @returns {Promise<Array>} - The recent inspections
   */
  async getRecentInspections(id, limit = 5) {
    try {
      // In a real implementation, this would query the inspection collection
      // For now, return mock data
      const mockInspections = [];
      const statuses = ['completed', 'scheduled', 'in-progress'];
      const types = ['quality', 'compliance', 'safety'];
      
      for (let i = 0; i < limit; i++) {
        mockInspections.push({
          id: `insp-${i}-${id}`,
          title: `Inspection ${i+1}`,
          type: types[Math.floor(Math.random() * types.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        });
      }
      
      return mockInspections;
    } catch (error) {
      logger.error(`Error getting recent inspections for supplier ${id}:`, error);
      throw error;
    }
  }
}

module.exports = new SupplierRepository(); 