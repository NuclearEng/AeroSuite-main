/**
 * ERP Service
 * 
 * This service acts as a facade for various ERP system integrations.
 * It selects the appropriate ERP provider based on configuration and
 * handles data transformation between AeroSuite and ERP systems.
 * 
 * @task TS358 - ERP system integration
 */

const { getActiveConfig } = require('../../config/erp-config');
const logger = require('../../utils/logger');
const SapERPService = require('./sap-erp-service');
const OracleERPService = require('./oracle-erp-service');
const SupplierModel = require('../../models/supplier');
const InspectionModel = require('../../models/inspection');

class ERPService {
  constructor() {
    this.initializeProvider();
  }
  
  /**
   * Initialize the configured ERP provider
   */
  initializeProvider() {
    const config = getActiveConfig();
    logger.info(`Initializing ERP service with provider: ${config.provider}`);
    
    switch (config.provider) {
      case 'sap':
        this.provider = new SapERPService();
        break;
      case 'oracle':
        this.provider = new OracleERPService();
        break;
      // Add other providers as they are implemented
      // case 'dynamics365':
      //   this.provider = new Dynamics365ERPService();
      //   break;
      // case 'netsuite':
      //   this.provider = new NetSuiteERPService();
      //   break;
      case 'mock':
        // For development and testing
        this.provider = require('./mock-erp-service');
        break;
      default:
        throw new Error(`Unsupported ERP provider: ${config.provider}`);
    }
  }
  
  /**
   * Get inventory data from the ERP system
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Inventory items
   */
  async getInventory(params = {}) {
    return this.provider.getInventory(params);
  }
  
  /**
   * Get purchase orders from the ERP system
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Purchase orders
   */
  async getPurchaseOrders(params = {}) {
    return this.provider.getPurchaseOrders(params);
  }
  
  /**
   * Get vendor/supplier data from the ERP system
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Vendors
   */
  async getVendors(params = {}) {
    return this.provider.getVendors(params);
  }
  
  /**
   * Get production orders from the ERP system
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Production orders
   */
  async getProductionOrders(params = {}) {
    return this.provider.getProductionOrders(params);
  }
  
  /**
   * Get quality inspection data from the ERP system
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Quality inspections
   */
  async getQualityInspections(params = {}) {
    return this.provider.getQualityInspections(params);
  }
  
  /**
   * Create a purchase order in the ERP system
   * 
   * @param {Object} purchaseOrder - Purchase order data
   * @returns {Promise<Object>} - Created purchase order
   */
  async createPurchaseOrder(purchaseOrder) {
    return this.provider.createPurchaseOrder(purchaseOrder);
  }
  
  /**
   * Update a purchase order in the ERP system
   * 
   * @param {string} id - Purchase order ID
   * @param {Object} purchaseOrder - Updated purchase order data
   * @returns {Promise<Object>} - Updated purchase order
   */
  async updatePurchaseOrder(id, purchaseOrder) {
    return this.provider.updatePurchaseOrder(id, purchaseOrder);
  }
  
  /**
   * Create a vendor/supplier in the ERP system
   * 
   * @param {Object} supplier - Vendor data
   * @returns {Promise<Object>} - Created vendor
   */
  async createVendor(supplier) {
    return this.provider.createVendor(supplier);
  }
  
  /**
   * Update a vendor/supplier in the ERP system
   * 
   * @param {string} id - Vendor ID
   * @param {Object} supplier - Updated vendor data
   * @returns {Promise<Object>} - Updated vendor
   */
  async updateVendor(id, supplier) {
    return this.provider.updateVendor(id, supplier);
  }
  
  /**
   * Create a quality inspection in the ERP system
   * 
   * @param {Object} inspection - Inspection data
   * @returns {Promise<Object>} - Created inspection
   */
  async createQualityInspection(inspection) {
    return this.provider.createQualityInspection(inspection);
  }
  
  /**
   * Update a quality inspection in the ERP system
   * 
   * @param {string} id - Inspection ID
   * @param {Object} inspection - Updated inspection data
   * @returns {Promise<Object>} - Updated inspection
   */
  async updateQualityInspection(id, inspection) {
    return this.provider.updateQualityInspection(id, inspection);
  }
  
  /**
   * Sync all suppliers from AeroSuite to the ERP system
   * 
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncSuppliersToERP(options = {}) {
    logger.info('Starting supplier sync to ERP');
    
    try {
      // Get suppliers from AeroSuite database
      const query = options.filter ? options.filter : {};
      const suppliers = await SupplierModel.find(query).lean();
      
      logger.info(`Found ${suppliers.length} suppliers to sync to ERP`);
      
      // Call provider's sync method
      return await this.provider.syncToERP('suppliers', suppliers);
    } catch (error) {
      logger.error(`Error syncing suppliers to ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync all inspections from AeroSuite to the ERP system
   * 
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncInspectionsToERP(options = {}) {
    logger.info('Starting inspection sync to ERP');
    
    try {
      // Get inspections from AeroSuite database
      const query = options.filter ? options.filter : {};
      const inspections = await InspectionModel.find(query)
        .populate('supplier')
        .populate('customer')
        .lean();
      
      logger.info(`Found ${inspections.length} inspections to sync to ERP`);
      
      // Call provider's sync method
      return await this.provider.syncToERP('inspections', inspections);
    } catch (error) {
      logger.error(`Error syncing inspections to ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync vendor/supplier data from the ERP to AeroSuite
   * 
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncVendorsFromERP(options = {}) {
    logger.info('Starting vendor sync from ERP');
    
    try {
      // Get vendors from ERP
      const results = await this.provider.syncFromERP('vendors', options.params || {});
      const vendors = results.data || [];
      
      if (!vendors.length) {
        logger.info('No vendors found in ERP system');
        return {
          ...results,
          newCount: 0,
          updatedCount: 0
        };
      }
      
      // Process each vendor and update or create in AeroSuite
      let newCount = 0;
      let updatedCount = 0;
      
      for (const vendor of vendors) {
        try {
          // Check if supplier already exists
          const existingSupplier = await SupplierModel.findOne({ 
            $or: [
              { code: vendor.code },
              { name: vendor.name, email: vendor.email }
            ]
          });
          
          if (existingSupplier) {
            // Update existing supplier
            await SupplierModel.findByIdAndUpdate(existingSupplier._id, {
              ...vendor,
              updatedAt: new Date(),
              erpSynced: true,
              lastSyncedAt: new Date()
            });
            updatedCount++;
          } else {
            // Create new supplier
            await SupplierModel.create({
              ...vendor,
              erpSynced: true,
              lastSyncedAt: new Date()
            });
            newCount++;
          }
        } catch (error) {
          logger.error(`Error processing vendor ${vendor.code || vendor.name}: ${error.message}`);
        }
      }
      
      logger.info(`Vendor sync completed: ${newCount} new, ${updatedCount} updated`);
      
      return {
        ...results,
        newCount,
        updatedCount
      };
    } catch (error) {
      logger.error(`Error syncing vendors from ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync inventory data from the ERP to AeroSuite
   * 
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncInventoryFromERP(options = {}) {
    logger.info('Starting inventory sync from ERP');
    
    try {
      // Get inventory from ERP
      const results = await this.provider.syncFromERP('inventory', options.params || {});
      
      // In a real implementation, we would process the inventory items here
      // and update or create them in the AeroSuite database
      
      return results;
    } catch (error) {
      logger.error(`Error syncing inventory from ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync purchase order data from the ERP to AeroSuite
   * 
   * @param {Object} options - Sync options
   * @returns {Promise<Object>} - Sync results
   */
  async syncPurchaseOrdersFromERP(options = {}) {
    logger.info('Starting purchase order sync from ERP');
    
    try {
      // Get purchase orders from ERP
      const results = await this.provider.syncFromERP('purchaseOrders', options.params || {});
      
      // In a real implementation, we would process the purchase orders here
      // and update or create them in the AeroSuite database
      
      return results;
    } catch (error) {
      logger.error(`Error syncing purchase orders from ERP: ${error.message}`);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new ERPService(); 