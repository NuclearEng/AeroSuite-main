/**
 * SAP Anti-Corruption Layer
 * 
 * This class implements the Anti-Corruption Layer pattern for SAP ERP integration.
 * It translates between SAP ERP data models and AeroSuite domain models.
 */

const BaseAntiCorruptionLayer = require('./BaseAntiCorruptionLayer');
const { 
  mapSapVendorToSupplier, 
  mapSupplierToSapVendor,
  mapSapInspectionToAeroSuite,
  mapAeroSuiteInspectionToSap,
  mapSapPurchaseOrderToAeroSuite,
  mapAeroSuitePurchaseOrderToSap
} = require('../../utils/erp-mappers/sap-mappers');
const logger = require('../../utils/logger');

class SapAntiCorruptionLayer extends BaseAntiCorruptionLayer {
  constructor() {
    super('SAP ERP');
    
    // Define entity type mappings
    this.entityMappings = {
      'supplier': {
        toDomain: mapSapVendorToSupplier,
        fromDomain: mapSupplierToSapVendor,
        requiredFields: {
          external: ['CardCode', 'CardName'],
          domain: ['name']
        }
      },
      'inspection': {
        toDomain: mapSapInspectionToAeroSuite,
        fromDomain: mapAeroSuiteInspectionToSap,
        requiredFields: {
          external: ['DocEntry', 'U_InspectionType'],
          domain: ['type']
        }
      },
      'purchaseOrder': {
        toDomain: mapSapPurchaseOrderToAeroSuite,
        fromDomain: mapAeroSuitePurchaseOrderToSap,
        requiredFields: {
          external: ['DocEntry', 'DocNum', 'CardCode'],
          domain: ['supplier']
        }
      }
    };
  }

  /**
   * Translate SAP data to domain model
   * 
   * @param {string} entityType - Type of entity being translated
   * @param {Object} externalData - SAP data
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
          sourceSystem: 'SAP',
          sourceId: externalData.DocEntry || externalData.CardCode,
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
   * Translate domain model to SAP format
   * 
   * @param {string} entityType - Type of entity being translated
   * @param {Object} domainEntity - Domain entity data
   * @returns {Object} - Translated SAP data
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
   * Enrich domain entity with additional data from SAP
   * 
   * @param {string} entityType - Type of entity being enriched
   * @param {Object} domainEntity - Domain entity to enrich
   * @param {Object} sapData - Additional SAP data
   * @returns {Object} - Enriched domain entity
   */
  enrichDomainEntity(entityType, domainEntity, sapData) {
    if (!domainEntity || !sapData) {
      return domainEntity;
    }
    
    try {
      // Clone the domain entity to avoid modifying the original
      const enriched = { ...domainEntity };
      
      switch (entityType) {
        case 'supplier':
          // Add SAP-specific supplier data
          enriched.paymentTerms = sapData.PymntGroup;
          enriched.taxCode = sapData.VatStatus;
          enriched.creditLimit = sapData.CreditLimit;
          break;
          
        case 'inspection':
          // Add SAP-specific inspection data
          enriched.sapInspectionNumber = sapData.U_InspectionNum;
          enriched.sapWorkOrder = sapData.U_WorkOrder;
          break;
          
        case 'purchaseOrder':
          // Add SAP-specific purchase order data
          enriched.sapDocStatus = sapData.DocumentStatus;
          enriched.sapPaymentStatus = sapData.PaymentStatus;
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

module.exports = SapAntiCorruptionLayer; 