/**
 * MongoRepository.js
 * 
 * MongoDB implementation of the Repository interface
 */

const Repository = require('../core/Repository');
const { InfrastructureError } = require('../core/errors');

class MongoRepository extends Repository {
  /**
   * Create a new MongoRepository
   * @param {Object} model - Mongoose model
   * @param {Function} toDomainEntity - Function to map database entity to domain entity
   * @param {Function} toDatabaseEntity - Function to map domain entity to database entity
   */
  constructor(model, toDomainEntity, toDatabaseEntity) {
    super();
    this.model = model;
    this._toDomainEntity = toDomainEntity;
    this._toDatabaseEntity = toDatabaseEntity;
  }

  /**
   * Find an entity by its ID
   * @param {string} id - ID of the entity to find
   * @returns {Promise<Entity|null>} - Entity if found, null otherwise
   */
  async findById(id) {
    try {
      const entity = await this.model.findById(id).lean();
      
      if (!entity) {
        return null;
      }
      
      return this._mapToDomainEntity(entity);
    } catch (error) {
      throw new InfrastructureError(`Error finding entity by ID: ${error.message}`);
    }
  }

  /**
   * Find all entities matching the query
   * @param {Object} query - Query to match entities against
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Object>} - Object with entities and pagination info
   */
  async findAll(query = {}, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sort = { createdAt: -1 },
        populate = []
      } = options;
      
      const skip = (page - 1) * limit;
      
      let queryBuilder = this.model.find(query);
      
      // Apply population
      if (populate && populate.length) {
        populate.forEach(field => {
          queryBuilder = queryBuilder.populate(field);
        });
      }
      
      // Execute query with pagination
      const [entities, total] = await Promise.all([
        queryBuilder
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        this.model.countDocuments(query)
      ]);
      
      return {
        entities: entities.map(entity => this._mapToDomainEntity(entity)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new InfrastructureError(`Error finding entities: ${error.message}`);
    }
  }

  /**
   * Save an entity
   * @param {Entity} entity - Entity to save
   * @returns {Promise<Entity>} - Saved entity
   */
  async save(entity) {
    try {
      const dbEntity = this._mapToDatabaseEntity(entity);
      
      if (dbEntity._id) {
        // Update existing entity
        const { _id, ...updateData } = dbEntity;
        
        const updatedEntity = await this.model.findByIdAndUpdate(
          _id,
          { $set: updateData },
          { new: true, runValidators: true }
        ).lean();
        
        return this._mapToDomainEntity(updatedEntity);
      } else {
        // Create new entity
        const newEntity = await this.model.create(dbEntity);
        return this._mapToDomainEntity(newEntity.toObject());
      }
    } catch (error) {
      throw new InfrastructureError(`Error saving entity: ${error.message}`);
    }
  }

  /**
   * Delete an entity
   * @param {string|Entity} idOrEntity - ID of the entity to delete or the entity itself
   * @returns {Promise<boolean>} - True if the entity was deleted
   */
  async delete(idOrEntity) {
    try {
      const id = typeof idOrEntity === 'string' ? idOrEntity : idOrEntity.id;
      
      const result = await this.model.findByIdAndDelete(id);
      
      return !!result;
    } catch (error) {
      throw new InfrastructureError(`Error deleting entity: ${error.message}`);
    }
  }

  /**
   * Count entities matching the query
   * @param {Object} query - Query to match entities against
   * @returns {Promise<number>} - Number of entities matching the query
   */
  async count(query = {}) {
    try {
      return await this.model.countDocuments(query);
    } catch (error) {
      throw new InfrastructureError(`Error counting entities: ${error.message}`);
    }
  }

  /**
   * Check if an entity exists
   * @param {Object} query - Query to match entities against
   * @returns {Promise<boolean>} - True if an entity matching the query exists
   */
  async exists(query) {
    try {
      return await this.model.exists(query);
    } catch (error) {
      throw new InfrastructureError(`Error checking if entity exists: ${error.message}`);
    }
  }

  /**
   * Map a database entity to a domain entity
   * @param {Object} dbEntity - Database entity
   * @returns {Entity} - Domain entity
   */
  _mapToDomainEntity(dbEntity) {
    if (!this._toDomainEntity) {
      throw new Error('toDomainEntity function not provided');
    }
    
    return this._toDomainEntity(dbEntity);
  }

  /**
   * Map a domain entity to a database entity
   * @param {Entity} domainEntity - Domain entity
   * @returns {Object} - Database entity
   */
  _mapToDatabaseEntity(domainEntity) {
    if (!this._toDatabaseEntity) {
      throw new Error('toDatabaseEntity function not provided');
    }
    
    const dbEntity = this._toDatabaseEntity(domainEntity);
    
    // Convert id to _id for MongoDB
    if (dbEntity.id && !dbEntity._id) {
      dbEntity._id = dbEntity.id;
      delete dbEntity.id;
    }
    
    return dbEntity;
  }
}

module.exports = MongoRepository; 