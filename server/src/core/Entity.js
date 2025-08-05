/**
 * Entity.js
 * 
 * Base class for all domain entities
 * Provides common functionality for identity and equality
 */

const { v4: uuidv4 } = require('uuid');

class Entity {
  constructor(props) {
    this.id = props.id || uuidv4();
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  /**
   * Check if this entity is equal to another entity
   * Entities are equal if they have the same ID
   * 
   * @param {Entity} entity - Entity to compare with
   * @returns {boolean} - True if entities are equal
   */
  equals(entity) {
    if (entity === null || entity === undefined) {
      return false;
    }
    
    if (this === entity) {
      return true;
    }
    
    if (!(entity instanceof Entity)) {
      return false;
    }
    
    return this.id === entity.id;
  }

  /**
   * Update the updatedAt timestamp
   */
  markModified() {
    this.updatedAt = new Date();
  }

  /**
   * Convert entity to a plain object
   * @returns {Object} - Plain object representation of the entity
   */
  toObject() {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Convert entity to JSON
   * @returns {Object} - JSON representation of the entity
   */
  toJSON() {
    return this.toObject();
  }
}

module.exports = Entity; 