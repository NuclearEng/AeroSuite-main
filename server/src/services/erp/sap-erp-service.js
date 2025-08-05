/**
 * SAP ERP Service
 * 
 * This service implements the BaseERPService for SAP Business One/SAP ERP.
 * It handles authentication, data mapping, and CRUD operations for the SAP ERP system.
 */

const BaseERPService = require('./base-erp-service');
const logger = require('../../utils/logger');
const { mapSapVendorToSupplier, mapSupplierToSapVendor } = require('../../utils/erp-mappers/sap-mappers');

class SapERPService extends BaseERPService {
  constructor() {
    super('sap');
    this.token = null;
    this.tokenExpiry = null;
  }
  
  /**
   * Authenticate with the SAP API
   * 
   * @returns {Promise<void>}
   */
  async authenticate() {
    // Check if token is still valid
    if (this.token && this.tokenExpiry && this.tokenExpiry > Date.now()) {
      // Token still valid, no need to re-authenticate
      return;
    }
    
    try {
      const { clientId, clientSecret, username, password, companyDb } = this.config;
      
      const response = await this.httpClient.post('/b1s/v1/Login', {
        CompanyDB: companyDb,
        UserName: username,
        Password: password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      this.token = response.data.SessionId;
      // Set token expiry to 30 minutes from now (SAP B1 default)
      this.tokenExpiry = Date.now() + 30 * 60 * 1000;
      
      // Update HTTP client config to include token in future requests
      this.httpClient.defaults.headers.common['Cookie'] = `B1SESSION=${this.token}`;
      
      logger.info('Successfully authenticated with SAP ERP');
    } catch (error) {
      logger.error('SAP ERP authentication failed:', error.message);
      throw new Error(`SAP ERP authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Make an authenticated request to the SAP API
   * 
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request payload
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - API response
   */
  async makeAuthenticatedRequest(endpoint, method = 'GET', data = null, params = {}, options = {}) {
    // Ensure we're authenticated before making request
    await this.authenticate();
    
    try {
      return await this.makeRequest(endpoint, method, data, params, options);
    } catch (error) {
      // If we get a 401/403, token might be expired, try to re-authenticate
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        this.token = null;
        this.tokenExpiry = null;
        await this.authenticate();
        return await this.makeRequest(endpoint, method, data, params, options);
      }
      throw error;
    }
  }
  
  /**
   * Get inventory data from SAP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Inventory items
   */
  async getInventory(params = {}) {
    const endpoint = this.config.modules.inventory.endpoint;
    
    // Build filter query if needed
    let queryParams = { ...params };
    if (params.filter) {
      queryParams.$filter = params.filter;
      delete queryParams.filter;
    }
    
    // Add common query parameters
    if (!queryParams.$select) {
      queryParams.$select = 'ItemCode,ItemName,QuantityOnStock,QuantityOrderedFromVendors,QuantityOrderedByCustomers';
    }
    
    const data = await this.makeAuthenticatedRequest(endpoint, 'GET', null, queryParams);
    return data.value || [];
  }
  
  /**
   * Get purchase orders from SAP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Purchase orders
   */
  async getPurchaseOrders(params = {}) {
    const endpoint = this.config.modules.purchasing.endpoint;
    
    // Build filter query if needed
    let queryParams = { ...params };
    if (params.filter) {
      queryParams.$filter = params.filter;
      delete queryParams.filter;
    }
    
    // Add common query parameters
    if (!queryParams.$select) {
      queryParams.$select = 'DocEntry,DocNum,CardCode,CardName,DocDate,DocDueDate,DocTotal,DocumentStatus';
    }
    
    const data = await this.makeAuthenticatedRequest(endpoint, 'GET', null, queryParams);
    return data.value || [];
  }
  
  /**
   * Get vendor/supplier data from SAP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Vendors
   */
  async getVendors(params = {}) {
    const endpoint = this.config.modules.vendors.endpoint;
    
    // Build filter query if needed
    let queryParams = { ...params };
    if (params.filter) {
      queryParams.$filter = params.filter;
      delete queryParams.filter;
    }
    
    if (params.vendorType) {
      if (queryParams.$filter) {
        queryParams.$filter += ` and CardType eq '${params.vendorType}'`;
      } else {
        queryParams.$filter = `CardType eq '${params.vendorType}'`;
      }
      delete queryParams.vendorType;
    } else {
      // Default to suppliers
      if (queryParams.$filter) {
        queryParams.$filter += " and CardType eq 'S'";
      } else {
        queryParams.$filter = "CardType eq 'S'";
      }
    }
    
    // Add common query parameters
    if (!queryParams.$select) {
      queryParams.$select = 'CardCode,CardName,CardType,Phone1,Phone2,Cellular,EmailAddress,Website,Address,ZipCode,City,Country';
    }
    
    const data = await this.makeAuthenticatedRequest(endpoint, 'GET', null, queryParams);
    
    // Map SAP vendors to AeroSuite supplier format
    return (data.value || []).map(vendor => mapSapVendorToSupplier(vendor));
  }
  
  /**
   * Get production orders from SAP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Production orders
   */
  async getProductionOrders(params = {}) {
    const endpoint = this.config.modules.production.endpoint;
    
    // Build filter query if needed
    let queryParams = { ...params };
    if (params.filter) {
      queryParams.$filter = params.filter;
      delete queryParams.filter;
    }
    
    // Add common query parameters
    if (!queryParams.$select) {
      queryParams.$select = 'DocEntry,DocNum,ItemCode,ItemDescription,PlannedQuantity,Status,PostingDate,DueDate';
    }
    
    const data = await this.makeAuthenticatedRequest(endpoint, 'GET', null, queryParams);
    return data.value || [];
  }
  
  /**
   * Get quality inspection data from SAP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Quality inspections
   */
  async getQualityInspections(params = {}) {
    const endpoint = this.config.modules.qualityManagement.endpoint;
    
    // Build filter query if needed
    let queryParams = { ...params };
    if (params.filter) {
      queryParams.$filter = params.filter;
      delete queryParams.filter;
    }
    
    const data = await this.makeAuthenticatedRequest(endpoint, 'GET', null, queryParams);
    return data.value || [];
  }
  
  /**
   * Create a purchase order in the SAP system
   * 
   * @param {Object} purchaseOrder - Purchase order data
   * @returns {Promise<Object>} - Created purchase order
   */
  async createPurchaseOrder(purchaseOrder) {
    const endpoint = this.config.modules.purchasing.endpoint;
    
    // Transform the purchase order to SAP format if needed
    const sapPurchaseOrder = {
      CardCode: purchaseOrder.vendorCode,
      DocDate: purchaseOrder.date,
      DocDueDate: purchaseOrder.dueDate,
      Comments: purchaseOrder.notes,
      DocumentLines: (purchaseOrder.items || []).map(item => ({
        ItemCode: item.itemCode,
        Quantity: item.quantity,
        Price: item.unitPrice
      }))
    };
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'POST', sapPurchaseOrder);
    return response;
  }
  
  /**
   * Update a purchase order in the SAP system
   * 
   * @param {string} id - Purchase order ID
   * @param {Object} purchaseOrder - Updated purchase order data
   * @returns {Promise<Object>} - Updated purchase order
   */
  async updatePurchaseOrder(id, purchaseOrder) {
    const endpoint = `${this.config.modules.purchasing.endpoint}(${id})`;
    
    // Transform the purchase order to SAP format if needed
    const sapPurchaseOrder = {
      Comments: purchaseOrder.notes,
      DocumentLines: (purchaseOrder.items || []).map(item => ({
        ItemCode: item.itemCode,
        Quantity: item.quantity,
        Price: item.unitPrice
      }))
    };
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'PATCH', sapPurchaseOrder);
    return response;
  }
  
  /**
   * Create a vendor/supplier in the SAP system
   * 
   * @param {Object} supplier - Vendor data
   * @returns {Promise<Object>} - Created vendor
   */
  async createVendor(supplier) {
    const endpoint = this.config.modules.vendors.endpoint;
    
    // Transform the supplier to SAP vendor format
    const sapVendor = mapSupplierToSapVendor(supplier);
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'POST', sapVendor);
    return response;
  }
  
  /**
   * Update a vendor/supplier in the SAP system
   * 
   * @param {string} id - Vendor ID
   * @param {Object} supplier - Updated vendor data
   * @returns {Promise<Object>} - Updated vendor
   */
  async updateVendor(id, supplier) {
    const endpoint = `${this.config.modules.vendors.endpoint}('${id}')`;
    
    // Transform the supplier to SAP vendor format
    const sapVendor = mapSupplierToSapVendor(supplier);
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'PATCH', sapVendor);
    return response;
  }
  
  /**
   * Create a quality inspection in the SAP system
   * 
   * @param {Object} inspection - Inspection data
   * @returns {Promise<Object>} - Created inspection
   */
  async createQualityInspection(inspection) {
    const endpoint = this.config.modules.qualityManagement.endpoint;
    
    // Transform the inspection to SAP format
    const sapInspection = {
      U_InspectionType: inspection.type,
      U_ItemCode: inspection.itemCode,
      U_VendorCode: inspection.supplierCode,
      U_Inspector: inspection.inspector,
      U_Date: inspection.date,
      U_Status: inspection.status,
      U_Result: inspection.result,
      U_Comments: inspection.notes
    };
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'POST', sapInspection);
    return response;
  }
  
  /**
   * Update a quality inspection in the SAP system
   * 
   * @param {string} id - Inspection ID
   * @param {Object} inspection - Updated inspection data
   * @returns {Promise<Object>} - Updated inspection
   */
  async updateQualityInspection(id, inspection) {
    const endpoint = `${this.config.modules.qualityManagement.endpoint}(${id})`;
    
    // Transform the inspection to SAP format
    const sapInspection = {
      U_Status: inspection.status,
      U_Result: inspection.result,
      U_Comments: inspection.notes
    };
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'PATCH', sapInspection);
    return response;
  }
  
  /**
   * Sync data from AeroSuite to the SAP system
   * 
   * @param {string} entity - Entity type to sync (suppliers, inspections, etc.)
   * @param {Array} data - Data to sync
   * @returns {Promise<Object>} - Sync results
   */
  async syncToERP(entity, data) {
    logger.info(`Starting sync to SAP ERP for entity: ${entity}, records: ${data.length}`);
    
    const results = {
      entity,
      totalCount: data.length,
      successCount: 0,
      errorCount: 0,
      errors: []
    };
    
    try {
      switch (entity) {
        case 'suppliers':
          for (const supplier of data) {
            try {
              // Check if supplier exists in SAP
              const existingSuppliers = await this.getVendors({ filter: `CardCode eq '${supplier.code}'` });
              
              if (existingSuppliers && existingSuppliers.length > 0) {
                // Update existing supplier
                await this.updateVendor(supplier.code, supplier);
              } else {
                // Create new supplier
                await this.createVendor(supplier);
              }
              
              results.successCount++;
            } catch (error) {
              results.errorCount++;
              results.errors.push({
                item: supplier.code,
                error: error.message
              });
              logger.error(`Error syncing supplier ${supplier.code} to SAP: ${error.message}`);
            }
          }
          break;
          
        case 'inspections':
          for (const inspection of data) {
            try {
              // Always create new inspections
              await this.createQualityInspection(inspection);
              results.successCount++;
            } catch (error) {
              results.errorCount++;
              results.errors.push({
                item: inspection.id,
                error: error.message
              });
              logger.error(`Error syncing inspection ${inspection.id} to SAP: ${error.message}`);
            }
          }
          break;
          
        default:
          throw new Error(`Unsupported entity type for SAP sync: ${entity}`);
      }
      
      logger.info(`Completed sync to SAP ERP for entity: ${entity}, success: ${results.successCount}, errors: ${results.errorCount}`);
      return results;
    } catch (error) {
      logger.error(`SAP sync failed for entity ${entity}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync data from the SAP system to AeroSuite
   * 
   * @param {string} entity - Entity type to sync (inventory, purchaseOrders, etc.)
   * @param {Object} params - Sync parameters
   * @returns {Promise<Object>} - Sync results
   */
  async syncFromERP(entity, params = {}) {
    logger.info(`Starting sync from SAP ERP for entity: ${entity}`);
    
    const results = {
      entity,
      totalCount: 0,
      newCount: 0,
      updatedCount: 0,
      errorCount: 0,
      errors: []
    };
    
    try {
      let data = [];
      
      switch (entity) {
        case 'inventory':
          data = await this.getInventory(params);
          break;
          
        case 'purchaseOrders':
          data = await this.getPurchaseOrders(params);
          break;
          
        case 'vendors':
          data = await this.getVendors(params);
          break;
          
        case 'productionOrders':
          data = await this.getProductionOrders(params);
          break;
          
        case 'qualityInspections':
          data = await this.getQualityInspections(params);
          break;
          
        default:
          throw new Error(`Unsupported entity type for SAP sync: ${entity}`);
      }
      
      results.totalCount = data.length;
      logger.info(`Fetched ${data.length} ${entity} records from SAP ERP`);
      
      // Return the data for further processing in the ERP service
      results.data = data;
      
      return results;
    } catch (error) {
      logger.error(`SAP sync failed for entity ${entity}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SapERPService; 