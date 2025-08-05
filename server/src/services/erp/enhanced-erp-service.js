/**
 * Enhanced ERP Service with Anti-Corruption Layer
 * 
 * This service enhances the base ERP service by using the Anti-Corruption Layer pattern
 * to isolate domain models from external ERP system models.
 * 
 * @task RF011 - Anti-corruption layer implementation
 */

const { getActiveConfig } = require('../../config/erp-config');
const logger = require('../../utils/logger');
const { acl } = require('../../infrastructure');
const SapERPService = require('./sap-erp-service');
const OracleERPService = require('./oracle-erp-service');
const SupplierModel = require('../../models/supplier');
const InspectionModel = require('../../models/inspection');
const ComponentModel = require('../../models/component');

class EnhancedERPService {
  constructor() {
    this.initializeProvider();
    this.antiCorruptionLayer = acl.createAcl();
  }
  
  /**
   * Initialize the configured ERP provider
   */
  initializeProvider() {
    const config = getActiveConfig();
    logger.info(`Initializing Enhanced ERP service with provider: ${config.provider}`);
    
    switch (config.provider) {
      case 'sap':
        this.provider = new SapERPService();
        break;
      case 'oracle':
        this.provider = new OracleERPService();
        break;
      case 'mock':
        // For development and testing
        this.provider = require('./mock-erp-service');
        break;
      default:
        throw new Error(`Unsupported ERP provider: ${config.provider}`);
    }
  }
  
  /**
   * Get suppliers from the ERP system, translated to domain model
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Suppliers in domain model format
   */
  async getSuppliers(params = {}) {
    try {
      // Get vendors from ERP
      const vendors = await this.provider.getVendors(params);
      
      // Use ACL to translate to domain model
      const suppliers = this.antiCorruptionLayer.batchTranslateToDomain('supplier', vendors);
      
      logger.info(`Translated ${suppliers.length} suppliers from ERP`);
      return suppliers;
    } catch (error) {
      logger.error(`Error getting suppliers from ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get inspections from the ERP system, translated to domain model
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Inspections in domain model format
   */
  async getInspections(params = {}) {
    try {
      // Get inspections from ERP
      const inspections = await this.provider.getQualityInspections(params);
      
      // Use ACL to translate to domain model
      const domainInspections = this.antiCorruptionLayer.batchTranslateToDomain('inspection', inspections);
      
      logger.info(`Translated ${domainInspections.length} inspections from ERP`);
      return domainInspections;
    } catch (error) {
      logger.error(`Error getting inspections from ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get purchase orders from the ERP system, translated to domain model
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Purchase orders in domain model format
   */
  async getPurchaseOrders(params = {}) {
    try {
      // Get purchase orders from ERP
      const purchaseOrders = await this.provider.getPurchaseOrders(params);
      
      // Use ACL to translate to domain model
      const domainPurchaseOrders = this.antiCorruptionLayer.batchTranslateToDomain('purchaseOrder', purchaseOrders);
      
      logger.info(`Translated ${domainPurchaseOrders.length} purchase orders from ERP`);
      return domainPurchaseOrders;
    } catch (error) {
      logger.error(`Error getting purchase orders from ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create a supplier in the ERP system
   * 
   * @param {Object} supplier - Supplier domain entity
   * @returns {Promise<Object>} - Created supplier with ERP metadata
   */
  async createSupplier(supplier) {
    try {
      // Use ACL to translate domain model to ERP format
      const erpSupplier = this.antiCorruptionLayer.translateFromDomain('supplier', supplier);
      
      if (!erpSupplier) {
        throw new Error('Failed to translate supplier to ERP format');
      }
      
      // Create in ERP system
      const createdErpSupplier = await this.provider.createVendor(erpSupplier);
      
      // Translate back to domain model with ERP metadata
      const createdSupplier = this.antiCorruptionLayer.translateToDomain('supplier', createdErpSupplier);
      
      logger.info(`Created supplier in ERP: ${createdSupplier.name}`);
      return createdSupplier;
    } catch (error) {
      logger.error(`Error creating supplier in ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create an inspection in the ERP system
   * 
   * @param {Object} inspection - Inspection domain entity
   * @returns {Promise<Object>} - Created inspection with ERP metadata
   */
  async createInspection(inspection) {
    try {
      // Use ACL to translate domain model to ERP format
      const erpInspection = this.antiCorruptionLayer.translateFromDomain('inspection', inspection);
      
      if (!erpInspection) {
        throw new Error('Failed to translate inspection to ERP format');
      }
      
      // Create in ERP system
      const createdErpInspection = await this.provider.createQualityInspection(erpInspection);
      
      // Translate back to domain model with ERP metadata
      const createdInspection = this.antiCorruptionLayer.translateToDomain('inspection', createdErpInspection);
      
      logger.info(`Created inspection in ERP: ${createdInspection.id}`);
      return createdInspection;
    } catch (error) {
      logger.error(`Error creating inspection in ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create a purchase order in the ERP system
   * 
   * @param {Object} purchaseOrder - Purchase order domain entity
   * @returns {Promise<Object>} - Created purchase order with ERP metadata
   */
  async createPurchaseOrder(purchaseOrder) {
    try {
      // Use ACL to translate domain model to ERP format
      const erpPurchaseOrder = this.antiCorruptionLayer.translateFromDomain('purchaseOrder', purchaseOrder);
      
      if (!erpPurchaseOrder) {
        throw new Error('Failed to translate purchase order to ERP format');
      }
      
      // Create in ERP system
      const createdErpPurchaseOrder = await this.provider.createPurchaseOrder(erpPurchaseOrder);
      
      // Translate back to domain model with ERP metadata
      const createdPurchaseOrder = this.antiCorruptionLayer.translateToDomain('purchaseOrder', createdErpPurchaseOrder);
      
      logger.info(`Created purchase order in ERP: ${createdPurchaseOrder.id}`);
      return createdPurchaseOrder;
    } catch (error) {
      logger.error(`Error creating purchase order in ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync suppliers from AeroSuite to ERP system
   * 
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncSuppliersToERP(options = {}) {
    logger.info('Starting supplier sync to ERP using ACL');
    
    try {
      // Get suppliers from AeroSuite database
      const query = options.filter ? options.filter : {};
      const suppliers = await SupplierModel.find(query).lean();
      
      logger.info(`Found ${suppliers.length} suppliers to sync to ERP`);
      
      // Use ACL to translate to ERP format
      const erpSuppliers = this.antiCorruptionLayer.batchTranslateFromDomain('supplier', suppliers);
      
      // Call provider's sync method with translated data
      const syncResults = await this.provider.syncToERP('suppliers', erpSuppliers);
      
      logger.info(`Supplier sync completed: ${syncResults.successCount} successful, ${syncResults.failureCount} failed`);
      return syncResults;
    } catch (error) {
      logger.error(`Error syncing suppliers to ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync inspections from AeroSuite to ERP system
   * 
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncInspectionsToERP(options = {}) {
    logger.info('Starting inspection sync to ERP using ACL');
    
    try {
      // Get inspections from AeroSuite database
      const query = options.filter ? options.filter : {};
      const inspections = await InspectionModel.find(query)
        .populate('supplier')
        .populate('customer')
        .lean();
      
      logger.info(`Found ${inspections.length} inspections to sync to ERP`);
      
      // Use ACL to translate to ERP format
      const erpInspections = this.antiCorruptionLayer.batchTranslateFromDomain('inspection', inspections);
      
      // Call provider's sync method with translated data
      const syncResults = await this.provider.syncToERP('inspections', erpInspections);
      
      logger.info(`Inspection sync completed: ${syncResults.successCount} successful, ${syncResults.failureCount} failed`);
      return syncResults;
    } catch (error) {
      logger.error(`Error syncing inspections to ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync suppliers from ERP to AeroSuite
   * 
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncSuppliersFromERP(options = {}) {
    logger.info('Starting supplier sync from ERP using ACL');
    
    try {
      // Get vendors from ERP
      const vendors = await this.provider.getVendors(options.params || {});
      
      if (!vendors.length) {
        logger.info('No vendors found in ERP system');
        return {
          successCount: 0,
          failureCount: 0,
          newCount: 0,
          updatedCount: 0
        };
      }
      
      // Use ACL to translate to domain model
      const suppliers = this.antiCorruptionLayer.batchTranslateToDomain('supplier', vendors);
      
      logger.info(`Translated ${suppliers.length} suppliers from ERP`);
      
      // Process each supplier and update or create in AeroSuite
      let newCount = 0;
      let updatedCount = 0;
      let failureCount = 0;
      
      for (const supplier of suppliers) {
        try {
          // Check if supplier already exists by source ID or other identifying info
          const existingSupplier = await SupplierModel.findOne({
            $or: [
              { 'metadata.sourceId': supplier.metadata.sourceId },
              { code: supplier.code },
              { name: supplier.name, email: supplier.email }
            ]
          });
          
          if (existingSupplier) {
            // Update existing supplier
            await SupplierModel.updateOne(
              { _id: existingSupplier._id },
              { $set: { ...supplier, updatedAt: new Date() } }
            );
            updatedCount++;
          } else {
            // Create new supplier
            await SupplierModel.create({
              ...supplier,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            newCount++;
          }
        } catch (error) {
          logger.error(`Error processing supplier ${supplier.name}: ${error.message}`);
          failureCount++;
        }
      }
      
      const results = {
        successCount: newCount + updatedCount,
        failureCount,
        newCount,
        updatedCount
      };
      
      logger.info(`Supplier sync from ERP completed: ${results.newCount} new, ${results.updatedCount} updated, ${results.failureCount} failed`);
      return results;
    } catch (error) {
      logger.error(`Error syncing suppliers from ERP: ${error.message}`);
      throw error;
    }
  }
}

module.exports = EnhancedERPService; 