/**
 * Repository.js
 * 
 * Base class for all domain repositories
 * Repositories are responsible for persisting and retrieving aggregates
 */

class Repository {
  /**
   * Find an entity by its ID
   * @param {string} id - ID of the entity to find
   * @returns {Promise<Entity|null>} - Entity if found, null otherwise
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Find all entities matching the query
   * @param {Object} query - Query to match entities against
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Entity>>} - Array of entities
   */
  async findAll(query, options) {
    throw new Error('Method not implemented');
  }

  /**
   * Save an entity
   * @param {Entity} entity - Entity to save
   * @returns {Promise<Entity>} - Saved entity
   */
  async save(entity) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete an entity
   * @param {string|Entity} idOrEntity - ID of the entity to delete or the entity itself
   * @returns {Promise<boolean>} - True if the entity was deleted
   */
  async delete(idOrEntity) {
    throw new Error('Method not implemented');
  }

  /**
   * Count entities matching the query
   * @param {Object} query - Query to match entities against
   * @returns {Promise<number>} - Number of entities matching the query
   */
  async count(query) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if an entity exists
   * @param {Object} query - Query to match entities against
   * @returns {Promise<boolean>} - True if an entity matching the query exists
   */
  async exists(query) {
    throw new Error('Method not implemented');
  }

  /**
   * Map a database entity to a domain entity
   * @param {Object} dbEntity - Database entity
   * @returns {Entity} - Domain entity
   */
  _mapToDomainEntity(dbEntity) {
    throw new Error('Method not implemented');
  }

  /**
   * Map a domain entity to a database entity
   * @param {Entity} domainEntity - Domain entity
   * @returns {Object} - Database entity
   */
  _mapToDatabaseEntity(domainEntity) {
    throw new Error('Method not implemented');
  }
}

module.exports = Repository; 