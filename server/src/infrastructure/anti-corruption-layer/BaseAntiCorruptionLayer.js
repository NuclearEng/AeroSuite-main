/**
 * Base Anti-Corruption Layer
 * 
 * This class serves as the base for all Anti-Corruption Layer implementations.
 * The Anti-Corruption Layer pattern is used to isolate domain models from
 * external system models, providing translation between different conceptual models.
 */

const logger = require('../../infrastructure/logger');

class BaseAntiCorruptionLayer {
  constructor(name) {
    this.name = name;
    logger.info(`Initializing Anti-Corruption Layer for ${name}`);
  }

  /**
   * Translate external data to domain model
   * 
   * @param {string} entityType - Type of entity being translated
   * @param {Object} externalData - Data from external system
   * @returns {Object} - Translated domain entity
   */
  translateToDomain(entityType, externalData) {
    throw new Error('translateToDomain must be implemented by subclass');
  }

  /**
   * Translate domain model to external system format
   * 
   * @param {string} entityType - Type of entity being translated
   * @param {Object} domainEntity - Domain entity data
   * @returns {Object} - Translated external system data
   */
  translateFromDomain(entityType, domainEntity) {
    throw new Error('translateFromDomain must be implemented by subclass');
  }

  /**
   * Batch translate external data to domain models
   * 
   * @param {string} entityType - Type of entities being translated
   * @param {Array} externalDataList - List of external system data
   * @returns {Array} - List of translated domain entities
   */
  batchTranslateToDomain(entityType, externalDataList) {
    if (!Array.isArray(externalDataList)) {
      throw new Error('externalDataList must be an array');
    }
    
    return externalDataList.map(item => this.translateToDomain(entityType, item))
      .filter(item => item !== null);
  }

  /**
   * Batch translate domain models to external system format
   * 
   * @param {string} entityType - Type of entities being translated
   * @param {Array} domainEntities - List of domain entities
   * @returns {Array} - List of translated external system data
   */
  batchTranslateFromDomain(entityType, domainEntities) {
    if (!Array.isArray(domainEntities)) {
      throw new Error('domainEntities must be an array');
    }
    
    return domainEntities.map(item => this.translateFromDomain(entityType, item))
      .filter(item => item !== null);
  }

  /**
   * Validate that the external data has the required fields for translation
   * 
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - List of required field names
   * @returns {boolean} - True if valid, throws error if not
   */
  validateRequiredFields(data, requiredFields) {
    if (!data) {
      throw new Error('Data cannot be null or undefined');
    }
    
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        throw new Error(`Required field '${field}' is missing`);
      }
    }
    
    return true;
  }

  /**
   * Log translation errors without failing the entire batch
   * 
   * @param {Error} error - Error that occurred
   * @param {string} entityType - Type of entity being processed
   * @param {Object} data - Data being processed
   */
  logTranslationError(error, entityType, data) {
    logger.error(`Translation error for ${entityType}: ${error.message}`, {
      acl: this.name,
      entityType,
      error: error.stack,
      dataId: data.id || data._id || 'unknown'
    });
  }
}

module.exports = BaseAntiCorruptionLayer; 