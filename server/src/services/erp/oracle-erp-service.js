/**
 * Oracle ERP Service
 * 
 * @task TS358 - ERP system integration
 * 
 * This service implements the BaseERPService for Oracle ERP Cloud.
 * It handles authentication, data mapping, and CRUD operations for the Oracle ERP system.
 */

const BaseERPService = require('./base-erp-service');
const logger = require('../../utils/logger');
const { mapOracleVendorToSupplier, mapSupplierToOracleVendor } = require('../../utils/erp-mappers/oracle-mappers');

class OracleERPService extends BaseERPService {
  constructor() {
    super('oracle');
    this.token = null;
    this.tokenExpiry = null;
  }
  
  /**
   * Authenticate with the Oracle API
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
      const { clientId, clientSecret, username, password, instanceId } = this.config;
      
      const response = await this.httpClient.post('/auth/oauth2/v1/token', {
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username,
        password,
        scope: `https://${instanceId}.erp.cloud`
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      this.token = response.data.access_token;
      // Set token expiry based on expires_in (in seconds)
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      // Update HTTP client config to include token in future requests
      this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      
      logger.info('Successfully authenticated with Oracle ERP');
    } catch (error) {
      logger.error('Oracle ERP authentication failed:', error.message);
      throw new Error(`Oracle ERP authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Make an authenticated request to the Oracle API
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
   * Get inventory data from Oracle
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Inventory items
   */
  async getInventory(params = {}) {
    const endpoint = this.config.modules.inventory.endpoint;
    
    // Build query parameters
    const queryParams = {
      limit: params.limit || 100,
      offset: params.offset || 0,
      ...params
    };
    
    // Add filter if provided
    if (params.filter) {
      queryParams.q = params.filter;
    }
    
    const data = await this.makeAuthenticatedRequest(endpoint, 'GET', null, queryParams);
    return data.items || [];
  }
  
  /**
   * Get purchase orders from Oracle
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Purchase orders
   */
  async getPurchaseOrders(params = {}) {
    const endpoint = this.config.modules.purchasing.endpoint;
    
    // Build query parameters
    const queryParams = {
      limit: params.limit || 100,
      offset: params.offset || 0,
      ...params
    };
    
    // Add filter if provided
    if (params.filter) {
      queryParams.q = params.filter;
    }
    
    const data = await this.makeAuthenticatedRequest(endpoint, 'GET', null, queryParams);
    return data.items || [];
  }
  
  /**
   * Get vendor/supplier data from Oracle
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Vendors
   */
  async getVendors(params = {}) {
    const endpoint = this.config.modules.vendors.endpoint;
    
    // Build query parameters
    const queryParams = {
      limit: params.limit || 100,
      offset: params.offset || 0,
      ...params
    };
    
    // Add filter if provided
    if (params.filter) {
      queryParams.q = params.filter;
    }
    
    // Add vendor type filter if provided
    if (params.vendorType) {
      queryParams.type = params.vendorType;
    }
    
    const data = await this.makeAuthenticatedRequest(endpoint, 'GET', null, queryParams);
    
    // Map Oracle vendors to AeroSuite supplier format
    return (data.items || []).map(vendor => mapOracleVendorToSupplier(vendor));
  }
  
  /**
   * Get production orders from Oracle
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Production orders
   */
  async getProductionOrders(params = {}) {
    const endpoint = this.config.modules.production.endpoint;
    
    // Build query parameters
    const queryParams = {
      limit: params.limit || 100,
      offset: params.offset || 0,
      ...params
    };
    
    // Add filter if provided
    if (params.filter) {
      queryParams.q = params.filter;
    }
    
    const data = await this.makeAuthenticatedRequest(endpoint, 'GET', null, queryParams);
    return data.items || [];
  }
  
  /**
   * Get quality inspection data from Oracle
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Quality inspections
   */
  async getQualityInspections(params = {}) {
    const endpoint = this.config.modules.qualityManagement.endpoint;
    
    // Build query parameters
    const queryParams = {
      limit: params.limit || 100,
      offset: params.offset || 0,
      ...params
    };
    
    // Add filter if provided
    if (params.filter) {
      queryParams.q = params.filter;
    }
    
    const data = await this.makeAuthenticatedRequest(endpoint, 'GET', null, queryParams);
    return data.items || [];
  }
  
  /**
   * Create a purchase order in the Oracle system
   * 
   * @param {Object} purchaseOrder - Purchase order data
   * @returns {Promise<Object>} - Created purchase order
   */
  async createPurchaseOrder(purchaseOrder) {
    const endpoint = this.config.modules.purchasing.endpoint;
    
    // Transform the purchase order to Oracle format
    const oraclePurchaseOrder = {
      supplierId: purchaseOrder.vendorCode,
      orderDate: purchaseOrder.date,
      scheduledDate: purchaseOrder.dueDate,
      notes: purchaseOrder.notes,
      lines: (purchaseOrder.items || []).map(item => ({
        itemId: item.itemCode,
        quantity: item.quantity,
        price: item.unitPrice
      }))
    };
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'POST', oraclePurchaseOrder);
    return response;
  }
  
  /**
   * Update a purchase order in the Oracle system
   * 
   * @param {string} id - Purchase order ID
   * @param {Object} purchaseOrder - Updated purchase order data
   * @returns {Promise<Object>} - Updated purchase order
   */
  async updatePurchaseOrder(id, purchaseOrder) {
    const endpoint = `${this.config.modules.purchasing.endpoint}/${id}`;
    
    // Transform the purchase order to Oracle format
    const oraclePurchaseOrder = {
      supplierId: purchaseOrder.vendorCode,
      orderDate: purchaseOrder.date,
      scheduledDate: purchaseOrder.dueDate,
      notes: purchaseOrder.notes,
      lines: (purchaseOrder.items || []).map(item => ({
        itemId: item.itemCode,
        quantity: item.quantity,
        price: item.unitPrice
      }))
    };
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'PUT', oraclePurchaseOrder);
    return response;
  }
  
  /**
   * Create a vendor/supplier in the Oracle system
   * 
   * @param {Object} supplier - Vendor data
   * @returns {Promise<Object>} - Created vendor
   */
  async createVendor(supplier) {
    const endpoint = this.config.modules.vendors.endpoint;
    
    // Transform supplier to Oracle format
    const oracleVendor = mapSupplierToOracleVendor(supplier);
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'POST', oracleVendor);
    return mapOracleVendorToSupplier(response);
  }
  
  /**
   * Update a vendor/supplier in the Oracle system
   * 
   * @param {string} id - Vendor ID
   * @param {Object} supplier - Updated vendor data
   * @returns {Promise<Object>} - Updated vendor
   */
  async updateVendor(id, supplier) {
    const endpoint = `${this.config.modules.vendors.endpoint}/${id}`;
    
    // Transform supplier to Oracle format
    const oracleVendor = mapSupplierToOracleVendor(supplier);
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'PUT', oracleVendor);
    return mapOracleVendorToSupplier(response);
  }
  
  /**
   * Create a quality inspection in the Oracle system
   * 
   * @param {Object} inspection - Inspection data
   * @returns {Promise<Object>} - Created inspection
   */
  async createQualityInspection(inspection) {
    const endpoint = this.config.modules.qualityManagement.endpoint;
    
    // Transform inspection to Oracle format
    const oracleInspection = {
      inspectionType: inspection.type,
      itemNumber: inspection.itemCode,
      supplierNumber: inspection.supplierCode,
      inspectorName: inspection.inspector,
      inspectionDate: inspection.date,
      status: inspection.status,
      result: inspection.result,
      comments: inspection.notes,
      quantity: inspection.quantity,
      sampleSize: inspection.sampleSize
    };
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'POST', oracleInspection);
    return response;
  }
  
  /**
   * Update a quality inspection in the Oracle system
   * 
   * @param {string} id - Inspection ID
   * @param {Object} inspection - Updated inspection data
   * @returns {Promise<Object>} - Updated inspection
   */
  async updateQualityInspection(id, inspection) {
    const endpoint = `${this.config.modules.qualityManagement.endpoint}/${id}`;
    
    // Transform inspection to Oracle format
    const oracleInspection = {
      inspectionType: inspection.type,
      itemNumber: inspection.itemCode,
      supplierNumber: inspection.supplierCode,
      inspectorName: inspection.inspector,
      inspectionDate: inspection.date,
      status: inspection.status,
      result: inspection.result,
      comments: inspection.notes,
      quantity: inspection.quantity,
      sampleSize: inspection.sampleSize
    };
    
    const response = await this.makeAuthenticatedRequest(endpoint, 'PUT', oracleInspection);
    return response;
  }
  
  /**
   * Sync data from AeroSuite to Oracle ERP
   * 
   * @param {string} entity - Entity type (suppliers, inspections)
   * @param {Array} data - Data to sync
   * @returns {Promise<Object>} - Sync results
   */
  async syncToERP(entity, data) {
    logger.info(`Oracle ERP: Syncing ${data.length} ${entity} to ERP`);
    
    const results = {
      success: true,
      message: `Syncing ${entity} to Oracle ERP`,
      data: {
        entity,
        totalCount: data.length,
        successCount: 0,
        errorCount: 0,
        errors: [],
        newCount: 0,
        updatedCount: 0
      }
    };
    
    try {
      // Process each item based on entity type
      for (const item of data) {
        try {
          switch (entity) {
            case 'suppliers':
              // Check if supplier already exists in Oracle
              const supplierExists = await this.checkSupplierExists(item.code);
              
              if (supplierExists) {
                // Update existing supplier
                await this.updateVendor(item.code, item);
                results.data.updatedCount++;
              } else {
                // Create new supplier
                await this.createVendor(item);
                results.data.newCount++;
              }
              
              results.data.successCount++;
              break;
              
            case 'inspections':
              // Check if inspection already exists in Oracle
              const inspectionExists = await this.checkInspectionExists(item.id);
              
              if (inspectionExists) {
                // Update existing inspection
                await this.updateQualityInspection(item.id, item);
                results.data.updatedCount++;
              } else {
                // Create new inspection
                await this.createQualityInspection(item);
                results.data.newCount++;
              }
              
              results.data.successCount++;
              break;
              
            default:
              throw new Error(`Unsupported entity type: ${entity}`);
          }
        } catch (error) {
          results.data.errorCount++;
          results.data.errors.push({
            item: item.id || item.code || 'unknown',
            error: error.message
          });
          logger.error(`Error syncing ${entity} item to Oracle ERP: ${error.message}`);
        }
      }
      
      results.message = `Successfully synced ${results.data.successCount} of ${data.length} ${entity} to Oracle ERP`;
      return results;
    } catch (error) {
      logger.error(`Error syncing ${entity} to Oracle ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync data from Oracle ERP to AeroSuite
   * 
   * @param {string} entity - Entity type (vendors, inventory, purchaseOrders)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Sync results
   */
  async syncFromERP(entity, params = {}) {
    logger.info(`Oracle ERP: Syncing ${entity} from ERP`);
    
    try {
      let data = [];
      
      switch (entity) {
        case 'vendors':
          data = await this.getVendors(params);
          break;
        case 'inventory':
          data = await this.getInventory(params);
          break;
        case 'purchaseOrders':
          data = await this.getPurchaseOrders(params);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entity}`);
      }
      
      return {
        success: true,
        message: `Successfully retrieved ${data.length} ${entity} from Oracle ERP`,
        data
      };
    } catch (error) {
      logger.error(`Error syncing ${entity} from Oracle ERP: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check if a supplier exists in Oracle ERP
   * 
   * @param {string} code - Supplier code
   * @returns {Promise<boolean>} - Whether the supplier exists
   * @private
   */
  async checkSupplierExists(code) {
    try {
      const endpoint = `${this.config.modules.vendors.endpoint}/${code}`;
      await this.makeAuthenticatedRequest(endpoint, 'GET');
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }
  
  /**
   * Check if an inspection exists in Oracle ERP
   * 
   * @param {string} id - Inspection ID
   * @returns {Promise<boolean>} - Whether the inspection exists
   * @private
   */
  async checkInspectionExists(id) {
    try {
      const endpoint = `${this.config.modules.qualityManagement.endpoint}/${id}`;
      await this.makeAuthenticatedRequest(endpoint, 'GET');
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      throw error;
    }
  }
}

module.exports = OracleERPService; 