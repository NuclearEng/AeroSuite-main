/**
 * inspectionRepository.js
 * 
 * Repository implementation for Inspection domain
 */

const Repository = require('../../../core/Repository');
const Inspection = require('../models/Inspection');
const InspectionItem = require('../models/InspectionItem');
const Defect = require('../models/Defect');
const mongoose = require('mongoose');
const InspectionModel = mongoose.model('Inspection');
const CacheManager = require('../../../infrastructure/caching/CacheManager');
const logger = require('../../../infrastructure/logger');

class InspectionRepository extends Repository {
  /**
   * Find an inspection by its ID, with caching
   * @param {string} id - ID of the inspection to find
   * @returns {Promise<Inspection|null>} - Inspection if found, null otherwise
   */
  async findById(id) {
    const cacheKey = `inspection:${id}`;
    let cached = await CacheManager.get(cacheKey);
    if (cached) return this._mapToDomainEntity(cached);
    const start = Date.now();
    try {
      const inspectionDoc = await InspectionModel.findById(id);
      if (!inspectionDoc) return null;
      const entity = this._mapToDomainEntity(inspectionDoc);
      await CacheManager.set(cacheKey, inspectionDoc.toObject(), { ttl: 300 });
      logger.debug('findById query time', { ms: Date.now() - start, id });
      return entity;
    } catch (error) {
      logger.error('Error in InspectionRepository.findById:', error);
      throw error;
    }
  }

  /**
   * Find all inspections matching the query, with projection and query time logging
   * @param {Object} query - Query to match inspections against
   * @param {Object} options - Options for pagination, sorting, projection, etc.
   * @returns {Promise<Array<Inspection>>} - Array of inspections
   */
  async findAll(query = {}, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 }, projection = null } = options;
    const start = Date.now();
    try {
      const inspectionDocs = await InspectionModel.find(query, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      logger.debug('findAll query time', { ms: Date.now() - start, query });
      return inspectionDocs.map(doc => this._mapToDomainEntity(doc));
    } catch (error) {
      logger.error('Error in InspectionRepository.findAll:', error);
      throw error;
    }
  }

  /**
   * Find inspections by name (partial match), with caching
   * @param {string} name - Name to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Inspection>>} - Array of matching inspections
   */
  async findByName(name, options = {}) {
    const cacheKey = `inspection:name:${name}`;
    let cached = await CacheManager.get(cacheKey);
    if (cached) return cached.map(doc => this._mapToDomainEntity(doc));
    try {
      const query = { name: { $regex: name, $options: 'i' } };
      const result = await this.findAll(query, options);
      await CacheManager.set(cacheKey, result.map(e => e), { ttl: 300 });
      return result;
    } catch (error) {
      logger.error('Error in InspectionRepository.findByName:', error);
      throw error;
    }
  }

  /**
   * Save an inspection and invalidate cache
   * @param {Inspection} inspection - Inspection to save
   * @returns {Promise<Inspection>} - Saved inspection
   */
  async save(inspection) {
    const saved = await super.save(inspection);
    if (saved && saved.id) {
      await CacheManager.del(`inspection:${saved.id}`);
      await CacheManager.del(`inspection:name:${saved.name}`);
    }
    return saved;
  }

  /**
   * Delete an inspection and invalidate cache
   * @param {string|Inspection} idOrEntity - ID of the inspection to delete or the inspection itself
   * @returns {Promise<boolean>} - True if the inspection was deleted
   */
  async delete(idOrEntity) {
    const id = idOrEntity instanceof Inspection ? idOrEntity.id : idOrEntity;
    const entity = await this.findById(id);
    const result = await super.delete(idOrEntity);
    if (entity) {
      await CacheManager.del(`inspection:${id}`);
      await CacheManager.del(`inspection:name:${entity.name}`);
    }
    return result;
  }

  /**
   * Count inspections matching the query
   * @param {Object} query - Query to match inspections against
   * @returns {Promise<number>} - Number of inspections matching the query
   */
  async count(query = {}) {
    try {
      return await InspectionModel.countDocuments(query);
    } catch (error) {
      console.error('Error in InspectionRepository.count:', error);
      throw error;
    }
  }

  /**
   * Check if an inspection exists
   * @param {Object} query - Query to match inspections against
   * @returns {Promise<boolean>} - True if an inspection matching the query exists
   */
  async exists(query) {
    try {
      return await InspectionModel.exists(query) !== null;
    } catch (error) {
      console.error('Error in InspectionRepository.exists:', error);
      throw error;
    }
  }

  /**
   * Find inspections by status
   * @param {string} status - Status to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Inspection>>} - Array of matching inspections
   */
  async findByStatus(status, options = {}) {
    try {
      const query = { status };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in InspectionRepository.findByStatus:', error);
      throw error;
    }
  }

  /**
   * Find inspections by supplier ID
   * @param {string} supplierId - Supplier ID to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Inspection>>} - Array of matching inspections
   */
  async findBySupplier(supplierId, options = {}) {
    try {
      const query = { supplierId };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in InspectionRepository.findBySupplier:', error);
      throw error;
    }
  }

  /**
   * Find inspections by component ID
   * @param {string} componentId - Component ID to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Inspection>>} - Array of matching inspections
   */
  async findByComponent(componentId, options = {}) {
    try {
      const query = { componentId };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in InspectionRepository.findByComponent:', error);
      throw error;
    }
  }

  /**
   * Find inspections by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Inspection>>} - Array of matching inspections
   */
  async findByDateRange(startDate, endDate, options = {}) {
    try {
      const query = {
        inspectionDate: {
          $gte: startDate,
          $lte: endDate
        }
      };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in InspectionRepository.findByDateRange:', error);
      throw error;
    }
  }

  /**
   * Map a database entity to a domain entity
   * @param {Object} dbEntity - Database entity
   * @returns {Inspection} - Domain entity
   */
  _mapToDomainEntity(dbEntity) {
    if (!dbEntity) return null;
    
    const inspectionData = {
      id: dbEntity._id.toString(),
      inspectionNumber: dbEntity.inspectionNumber,
      supplierId: dbEntity.supplierId,
      componentId: dbEntity.componentId,
      inspectionDate: dbEntity.inspectionDate,
      inspectorId: dbEntity.inspectorId,
      status: dbEntity.status,
      result: dbEntity.result,
      notes: dbEntity.notes,
      items: dbEntity.items,
      defects: dbEntity.defects,
      attachments: dbEntity.attachments,
      createdAt: dbEntity.createdAt,
      updatedAt: dbEntity.updatedAt
    };
    
    return new Inspection(inspectionData);
  }

  /**
   * Map a domain entity to a database entity
   * @param {Inspection} domainEntity - Domain entity
   * @returns {Object} - Database entity
   */
  _mapToDatabaseEntity(domainEntity) {
    const inspectionData = domainEntity.toObject();
    
    // Convert id to _id if it exists
    if (inspectionData.id) {
      inspectionData._id = inspectionData.id;
      delete inspectionData.id;
    }
    
    return inspectionData;
  }

  /**
   * Count inspections by status
   * @returns {Promise<Object>} - Object with counts by status
   */
  async countByStatus() {
    try {
      // In a real implementation, this would aggregate inspection data
      // For now, return mock data
      return {
        scheduled: Math.floor(Math.random() * 20) + 10,
        'in-progress': Math.floor(Math.random() * 15) + 5,
        completed: Math.floor(Math.random() * 50) + 30,
        cancelled: Math.floor(Math.random() * 10) + 1
      };
    } catch (error) {
      logger.error('Error counting inspections by status:', error);
      throw error;
    }
  }

  /**
   * Count inspections by type
   * @returns {Promise<Object>} - Object with counts by type
   */
  async countByType() {
    try {
      // In a real implementation, this would aggregate inspection data
      // For now, return mock data
      return {
        quality: Math.floor(Math.random() * 40) + 20,
        compliance: Math.floor(Math.random() * 30) + 15,
        safety: Math.floor(Math.random() * 20) + 10
      };
    } catch (error) {
      logger.error('Error counting inspections by type:', error);
      throw error;
    }
  }

  /**
   * Get monthly inspection trends
   * @returns {Promise<Array>} - Array of monthly data points
   */
  async getMonthlyTrends() {
    try {
      // In a real implementation, this would aggregate inspection data by month
      // For now, return mock data for the last 6 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      const trends = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        trends.push({
          month: months[monthIndex],
          completed: Math.floor(Math.random() * 20) + 5,
          scheduled: Math.floor(Math.random() * 15) + 5
        });
      }
      
      return trends;
    } catch (error) {
      logger.error('Error getting monthly inspection trends:', error);
      throw error;
    }
  }

  /**
   * Get supplier performance data based on inspections
   * @param {number} limit - Maximum number of suppliers to return
   * @returns {Promise<Array>} - Array of supplier performance data
   */
  async getSupplierPerformance(limit = 5) {
    try {
      // In a real implementation, this would join inspection and supplier data
      // For now, return mock data
      const performance = [];
      
      for (let i = 0; i < limit; i++) {
        performance.push({
          id: `supp-${i}`,
          name: `Supplier ${i+1}`,
          passRate: Math.floor(Math.random() * 30) + 70,
          inspectionCount: Math.floor(Math.random() * 20) + 5
        });
      }
      
      // Sort by pass rate descending
      return performance.sort((a, b) => b.passRate - a.passRate);
    } catch (error) {
      logger.error('Error getting supplier performance data:', error);
      throw error;
    }
  }

  /**
   * Find inspections by supplier ID with mock pagination (demo)
   * @param {string} supplierId - The supplier ID
   * @param {Object} options - Query options (pagination, etc.)
   * @returns {Promise<Object>} - The inspections for the supplier
   */
  async findBySupplierPaginated(supplierId, options = { page: 1, limit: 10 }) {
    try {
      // In a real implementation, this would query the inspection collection
      // For now, return mock data
      const mockInspections = [];
      const statuses = ['completed', 'scheduled', 'in-progress'];
      const types = ['quality', 'compliance', 'safety'];
      const total = Math.floor(Math.random() * 20) + 10;
      
      const start = (options.page - 1) * options.limit;
      const end = Math.min(start + options.limit, total);
      
      for (let i = start; i < end; i++) {
        mockInspections.push({
          id: `insp-${i}-${supplierId}`,
          supplierId,
          title: `Inspection ${i+1}`,
          type: types[Math.floor(Math.random() * types.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          scheduledDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          findings: Math.floor(Math.random() * 5)
        });
      }
      
      return {
        data: mockInspections,
        pagination: {
          page: options.page,
          limit: options.limit,
          total,
          pages: Math.ceil(total / options.limit)
        }
      };
    } catch (error) {
      logger.error(`Error finding inspections for supplier ${supplierId}:`, error);
      throw error;
    }
  }
}

module.exports = new InspectionRepository(); 