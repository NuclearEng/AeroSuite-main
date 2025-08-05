/**
 * Oracle Anti-Corruption Layer
 * 
 * This class implements the Anti-Corruption Layer pattern for Oracle ERP integration.
 * It translates between Oracle ERP data models and AeroSuite domain models.
 */

const BaseAntiCorruptionLayer = require('./BaseAntiCorruptionLayer');
const oracleMappers = require('../../utils/erp-mappers/oracle-mappers');
const logger = require('../../utils/logger');

class OracleAntiCorruptionLayer extends BaseAntiCorruptionLayer {
  constructor() {
    super('Oracle ERP');
    
    // Define entity type mappings
    this.entityMappings = {
      'supplier': {
        toDomain: oracleMappers.mapOracleVendorToSupplier,
        fromDomain: oracleMappers.mapSupplierToOracleVendor,
        requiredFields: {
          external: ['VENDOR_ID', 'VENDOR_NAME'],
          domain: ['name']
        }
      },
      'inspection': {
        toDomain: oracleMappers.mapOracleInspectionToAeroSuite,
        fromDomain: oracleMappers.mapAeroSuiteInspectionToOracle,
        requiredFields: {
          external: ['INSPECTION_ID', 'INSPECTION_TYPE'],
          domain: ['type']
        }
      },
      'purchaseOrder': {
        toDomain: oracleMappers.mapOraclePurchaseOrderToAeroSuite,
        fromDomain: oracleMappers.mapAeroSuitePurchaseOrderToOracle,
        requiredFields: {
          external: ['PO_HEADER_ID', 'PO_NUMBER', 'VENDOR_ID'],
          domain: ['supplier']
        }
      },
      'component': {
        toDomain: oracleMappers.mapOracleItemToComponent,
        fromDomain: oracleMappers.mapComponentToOracleItem,
        requiredFields: {
          external: ['INVENTORY_ITEM_ID', 'ITEM_NUMBER'],
          domain: ['name', 'code']
        }
      }
    };
  }

  /**
   * Translate Oracle data to domain model
   * 
   * @param {string} entityType - Type of entity being translated
   * @param {Object} externalData - Oracle data
   * @returns {Object} - Translated domain entity
   */
  translateToDomain(entityType, externalData) {
    try {
      // Check if entity type is supported
      if (!this.entityMappings[entityType]) {
        throw new Error(`Unsupported entity type: ${entityType}`);
      }
      
      // Validate required fields
      const requiredFields = this.entityMappings[entityType].requiredFields.external;
      this.validateRequiredFields(externalData, requiredFields);
      
      // Use the appropriate mapper function
      const mapper = this.entityMappings[entityType].toDomain;
      const result = mapper(externalData);
      
      // Add metadata
      if (result) {
        result.metadata = {
          sourceSystem: 'Oracle',
          sourceId: this.getOracleSourceId(entityType, externalData),
          lastSyncedAt: new Date()
        };
      }
      
      return result;
    } catch (error) {
      this.logTranslationError(error, entityType, externalData);
      return null;
    }
  }

  /**
   * Translate domain model to Oracle format
   * 
   * @param {string} entityType - Type of entity being translated
   * @param {Object} domainEntity - Domain entity data
   * @returns {Object} - Translated Oracle data
   */
  translateFromDomain(entityType, domainEntity) {
    try {
      // Check if entity type is supported
      if (!this.entityMappings[entityType]) {
        throw new Error(`Unsupported entity type: ${entityType}`);
      }
      
      // Validate required fields
      const requiredFields = this.entityMappings[entityType].requiredFields.domain;
      this.validateRequiredFields(domainEntity, requiredFields);
      
      // Use the appropriate mapper function
      const mapper = this.entityMappings[entityType].fromDomain;
      return mapper(domainEntity);
    } catch (error) {
      this.logTranslationError(error, entityType, domainEntity);
      return null;
    }
  }

  /**
   * Get the appropriate source ID from Oracle data based on entity type
   * 
   * @param {string} entityType - Type of entity
   * @param {Object} oracleData - Oracle data
   * @returns {string} - Source ID
   */
  getOracleSourceId(entityType, oracleData) {
    switch (entityType) {
      case 'supplier':
        return oracleData.VENDOR_ID.toString();
      case 'inspection':
        return oracleData.INSPECTION_ID.toString();
      case 'purchaseOrder':
        return oracleData.PO_HEADER_ID.toString();
      case 'component':
        return oracleData.INVENTORY_ITEM_ID.toString();
      default:
        return 'unknown';
    }
  }

  /**
   * Enrich domain entity with additional data from Oracle
   * 
   * @param {string} entityType - Type of entity being enriched
   * @param {Object} domainEntity - Domain entity to enrich
   * @param {Object} oracleData - Additional Oracle data
   * @returns {Object} - Enriched domain entity
   */
  enrichDomainEntity(entityType, domainEntity, oracleData) {
    if (!domainEntity || !oracleData) {
      return domainEntity;
    }
    
    try {
      // Clone the domain entity to avoid modifying the original
      const enriched = { ...domainEntity };
      
      switch (entityType) {
        case 'supplier':
          // Add Oracle-specific supplier data
          enriched.paymentTerms = oracleData.TERMS_NAME;
          enriched.taxCode = oracleData.TAX_CODE;
          enriched.creditLimit = oracleData.CREDIT_LIMIT;
          break;
          
        case 'inspection':
          // Add Oracle-specific inspection data
          enriched.oracleInspectionNumber = oracleData.INSPECTION_NUMBER;
          enriched.oracleWorkOrder = oracleData.WORK_ORDER_NUMBER;
          break;
          
        case 'purchaseOrder':
          // Add Oracle-specific purchase order data
          enriched.oracleDocStatus = oracleData.STATUS_CODE;
          enriched.oraclePaymentStatus = oracleData.PAYMENT_STATUS;
          break;
          
        default:
          logger.warn(`No enrichment defined for entity type: ${entityType}`);
      }
      
      return enriched;
    } catch (error) {
      logger.error(`Error enriching ${entityType}: ${error.message}`);
      return domainEntity;
    }
  }
}

module.exports = OracleAntiCorruptionLayer; 