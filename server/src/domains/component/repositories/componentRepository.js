/**
 * componentRepository.js
 * 
 * Repository implementation for Component domain
 */

const Repository = require('../../../core/Repository');
const Component = require('../models/Component');
const Specification = require('../models/Specification');
const Revision = require('../models/Revision');
const mongoose = require('mongoose');
const ComponentModel = mongoose.model('Component');
const CacheManager = require('../../../infrastructure/caching/CacheManager');
const logger = require('../../../infrastructure/logger');

class ComponentRepository extends Repository {
  /**
   * Find a component by its ID, with caching
   * @param {string} id - ID of the component to find
   * @returns {Promise<Component|null>} - Component if found, null otherwise
   */
  async findById(id) {
    const cacheKey = `component:${id}`;
    let cached = await CacheManager.get(cacheKey);
    if (cached) return this._mapToDomainEntity(cached);
    const start = Date.now();
    try {
      const componentDoc = await ComponentModel.findById(id);
      if (!componentDoc) return null;
      const entity = this._mapToDomainEntity(componentDoc);
      await CacheManager.set(cacheKey, componentDoc.toObject(), { ttl: 300 });
      logger.debug('findById query time', { ms: Date.now() - start, id });
      return entity;
    } catch (error) {
      logger.error('Error in ComponentRepository.findById:', error);
      throw error;
    }
  }

  /**
   * Find all components matching the query, with projection and query time logging
   * @param {Object} query - Query to match components against
   * @param {Object} options - Options for pagination, sorting, projection, etc.
   * @returns {Promise<Array<Component>>} - Array of components
   */
  async findAll(query = {}, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 }, projection = null } = options;
    const start = Date.now();
    try {
      const componentDocs = await ComponentModel.find(query, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      logger.debug('findAll query time', { ms: Date.now() - start, query });
      return componentDocs.map(doc => this._mapToDomainEntity(doc));
    } catch (error) {
      logger.error('Error in ComponentRepository.findAll:', error);
      throw error;
    }
  }

  /**
   * Save a component and invalidate cache
   * @param {Component} component - Component to save
   * @returns {Promise<Component>} - Saved component
   */
  async save(component) {
    const saved = await super.save(component);
    if (saved && saved.id) {
      await CacheManager.del(`component:${saved.id}`);
      await CacheManager.del(`component:name:${saved.name}`);
    }
    return saved;
  }

  /**
   * Delete a component and invalidate cache
   * @param {string|Component} idOrEntity - ID of the component to delete or the component itself
   * @returns {Promise<boolean>} - True if the component was deleted
   */
  async delete(idOrEntity) {
    const id = idOrEntity instanceof Component ? idOrEntity.id : idOrEntity;
    const entity = await this.findById(id);
    const result = await super.delete(idOrEntity);
    if (entity) {
      await CacheManager.del(`component:${id}`);
      await CacheManager.del(`component:name:${entity.name}`);
    }
    return result;
  }

  /**
   * Count components matching the query
   * @param {Object} query - Query to match components against
   * @returns {Promise<number>} - Number of components matching the query
   */
  async count(query = {}) {
    try {
      return await ComponentModel.countDocuments(query);
    } catch (error) {
      console.error('Error in ComponentRepository.count:', error);
      throw error;
    }
  }

  /**
   * Check if a component exists
   * @param {Object} query - Query to match components against
   * @returns {Promise<boolean>} - True if a component matching the query exists
   */
  async exists(query) {
    try {
      return await ComponentModel.exists(query) !== null;
    } catch (error) {
      console.error('Error in ComponentRepository.exists:', error);
      throw error;
    }
  }

  /**
   * Find components by name (partial match), with caching
   * @param {string} name - Name to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Component>>} - Array of matching components
   */
  async findByName(name, options = {}) {
    const cacheKey = `component:name:${name}`;
    let cached = await CacheManager.get(cacheKey);
    if (cached) return cached.map(doc => this._mapToDomainEntity(doc));
    try {
      const query = { name: { $regex: name, $options: 'i' } };
      const result = await this.findAll(query, options);
      await CacheManager.set(cacheKey, result.map(e => e), { ttl: 300 });
      return result;
    } catch (error) {
      logger.error('Error in ComponentRepository.findByName:', error);
      throw error;
    }
  }

  /**
   * Find components by part number
   * @param {string} partNumber - Part number to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Component>>} - Array of matching components
   */
  async findByPartNumber(partNumber, options = {}) {
    try {
      const query = { partNumber };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in ComponentRepository.findByPartNumber:', error);
      throw error;
    }
  }

  /**
   * Find components by category
   * @param {string} category - Category to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Component>>} - Array of matching components
   */
  async findByCategory(category, options = {}) {
    try {
      const query = { category };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in ComponentRepository.findByCategory:', error);
      throw error;
    }
  }

  /**
   * Find components by supplier ID
   * @param {string} supplierId - Supplier ID to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Component>>} - Array of matching components
   */
  async findBySupplier(supplierId, options = {}) {
    try {
      const query = { supplierId };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in ComponentRepository.findBySupplier:', error);
      throw error;
    }
  }

  /**
   * Map a database entity to a domain entity
   * @param {Object} dbEntity - Database entity
   * @returns {Component} - Domain entity
   */
  _mapToDomainEntity(dbEntity) {
    if (!dbEntity) return null;
    
    const componentData = {
      id: dbEntity._id.toString(),
      name: dbEntity.name,
      partNumber: dbEntity.partNumber,
      description: dbEntity.description,
      category: dbEntity.category,
      supplierId: dbEntity.supplierId,
      status: dbEntity.status,
      specifications: dbEntity.specifications,
      revisions: dbEntity.revisions,
      material: dbEntity.material,
      dimensions: dbEntity.dimensions,
      weight: dbEntity.weight,
      notes: dbEntity.notes,
      tags: dbEntity.tags,
      createdAt: dbEntity.createdAt,
      updatedAt: dbEntity.updatedAt
    };
    
    return new Component(componentData);
  }

  /**
   * Map a domain entity to a database entity
   * @param {Component} domainEntity - Domain entity
   * @returns {Object} - Database entity
   */
  _mapToDatabaseEntity(domainEntity) {
    const componentData = domainEntity.toObject();
    
    // Convert id to _id if it exists
    if (componentData.id) {
      componentData._id = componentData.id;
      delete componentData.id;
    }
    
    return componentData;
  }
}

module.exports = new ComponentRepository(); 