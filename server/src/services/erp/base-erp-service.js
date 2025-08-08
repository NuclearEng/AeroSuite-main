/**
 * Base ERP Service
 * 
 * This is the base class for all ERP service implementations.
 * It provides common functionality and defines the interface that
 * all ERP integrations should implement.
 */

const axios = require('axios');
const { config } = require('../../config/erp-config');
const logger = require('../../utils/logger');
const cache = require('../../utils/cache');

class BaseERPService {
  constructor(provider) {
    this.provider = provider;
    this.config = config[provider];
    
    if (!this.config) {
      throw new Error(`ERP provider '${provider}' is not configured`);
    }
    
    this.globalConfig = config.global;
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.globalConfig.timeout,
    });
    
    // Add request interceptor for logging
    this.httpClient.interceptors.request.use((request) => {
      logger.debug(`ERP ${provider} API Request: ${request.method.toUpperCase()} ${request.url}`);
      return request;
    });
    
    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        logger.debug(`ERP ${provider} API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        if (error.response) {
          logger.error(`ERP ${provider} API Error: ${error.response.status} ${error.response.statusText}`);
          logger.debug(`Error details: ${JSON.stringify(error.response.data)}`);
        } else {
          logger.error(`ERP ${provider} API Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Make an API request to the ERP system with caching and retry logic
   * 
   * @param {string} endpoint - The API endpoint
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {Object} data - Request payload (for POST/PUT requests)
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - API response
   */
  async makeRequest(endpoint, method = 'GET', data = null, params = {}, options = {}) {
    const cacheKey = options.cacheKey || `erp:${this.provider}:${method}:${endpoint}:${JSON.stringify(params)}`;
    const useCaching = options.cache !== false && this.globalConfig.cacheEnabled && method === 'GET';
    
    // Try to get from cache first
    if (useCaching) {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        logger.debug(`ERP cache hit for ${cacheKey}`);
        return cachedData;
      }
    }
    
    let retries = 0;
    const maxRetries = options.retryAttempts || this.globalConfig.retryAttempts;
    const retryDelay = options.retryDelay || this.globalConfig.retryDelay;
    
    // Retry loop with explicit condition to avoid constant conditions
    while (retries <= maxRetries) {
      try {
        const response = await this.httpClient.request({
          method,
          url: endpoint,
          data,
          params,
          ...options.requestConfig
        });
        
        const responseData = response.data;
        
        // Cache the result if needed
        if (useCaching) {
          const ttl = options.cacheTTL || this.globalConfig.cacheTTL;
          await cache.set(cacheKey, responseData, ttl);
          logger.debug(`ERP cache set for ${cacheKey} with TTL ${ttl}ms`);
        }
        
        return responseData;
      } catch (error) {
        if (retries >= maxRetries || !this.isRetryable(error)) {
          throw error;
        }
        
        retries++;
        logger.warn(`ERP request failed, retrying (${retries}/${maxRetries}): ${error.message}`);
        await this.sleep(retryDelay);
      }
      // If loop exits naturally, throw last error
      throw new Error('ERP request failed after maximum retries');
    }
  }
  
  /**
   * Check if an error is retryable
   * 
   * @param {Error} error - The error object
   * @returns {boolean} - Whether the error is retryable
   */
  isRetryable(error) {
    // Network errors are retryable
    if (!error.response) {
      return true;
    }
    
    // 5xx errors are retryable
    if (error.response.status >= 500) {
      return true;
    }
    
    // 429 Too Many Requests is retryable
    if (error.response.status === 429) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Sleep for a specified duration
   * 
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Authentication method to be implemented by subclasses
   * 
   * @returns {Promise<void>}
   */
  async authenticate() {
    throw new Error('Method authenticate() must be implemented by subclass');
  }
  
  /**
   * Get inventory data from ERP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Inventory items
   */
  async getInventory(params = {}) {
    throw new Error('Method getInventory() must be implemented by subclass');
  }
  
  /**
   * Get purchase orders from ERP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Purchase orders
   */
  async getPurchaseOrders(params = {}) {
    throw new Error('Method getPurchaseOrders() must be implemented by subclass');
  }
  
  /**
   * Get vendor/supplier data from ERP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Vendors
   */
  async getVendors(params = {}) {
    throw new Error('Method getVendors() must be implemented by subclass');
  }
  
  /**
   * Get production orders from ERP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Production orders
   */
  async getProductionOrders(params = {}) {
    throw new Error('Method getProductionOrders() must be implemented by subclass');
  }
  
  /**
   * Get quality inspection data from ERP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Quality inspections
   */
  async getQualityInspections(params = {}) {
    throw new Error('Method getQualityInspections() must be implemented by subclass');
  }
  
  /**
   * Create a purchase order in the ERP system
   * 
   * @param {Object} purchaseOrder - Purchase order data
   * @returns {Promise<Object>} - Created purchase order
   */
  async createPurchaseOrder(purchaseOrder) {
    throw new Error('Method createPurchaseOrder() must be implemented by subclass');
  }
  
  /**
   * Update a purchase order in the ERP system
   * 
   * @param {string} id - Purchase order ID
   * @param {Object} purchaseOrder - Updated purchase order data
   * @returns {Promise<Object>} - Updated purchase order
   */
  async updatePurchaseOrder(id, purchaseOrder) {
    throw new Error('Method updatePurchaseOrder() must be implemented by subclass');
  }
  
  /**
   * Create a vendor/supplier in the ERP system
   * 
   * @param {Object} vendor - Vendor data
   * @returns {Promise<Object>} - Created vendor
   */
  async createVendor(vendor) {
    throw new Error('Method createVendor() must be implemented by subclass');
  }
  
  /**
   * Update a vendor/supplier in the ERP system
   * 
   * @param {string} id - Vendor ID
   * @param {Object} vendor - Updated vendor data
   * @returns {Promise<Object>} - Updated vendor
   */
  async updateVendor(id, vendor) {
    throw new Error('Method updateVendor() must be implemented by subclass');
  }
  
  /**
   * Create a quality inspection in the ERP system
   * 
   * @param {Object} inspection - Inspection data
   * @returns {Promise<Object>} - Created inspection
   */
  async createQualityInspection(inspection) {
    throw new Error('Method createQualityInspection() must be implemented by subclass');
  }
  
  /**
   * Update a quality inspection in the ERP system
   * 
   * @param {string} id - Inspection ID
   * @param {Object} inspection - Updated inspection data
   * @returns {Promise<Object>} - Updated inspection
   */
  async updateQualityInspection(id, inspection) {
    throw new Error('Method updateQualityInspection() must be implemented by subclass');
  }
  
  /**
   * Sync data from AeroSuite to the ERP system
   * 
   * @param {string} entity - Entity type to sync (vendors, inspections, etc.)
   * @param {Array} data - Data to sync
   * @returns {Promise<Object>} - Sync results
   */
  async syncToERP(entity, data) {
    throw new Error('Method syncToERP() must be implemented by subclass');
  }
  
  /**
   * Sync data from the ERP system to AeroSuite
   * 
   * @param {string} entity - Entity type to sync (inventory, purchaseOrders, etc.)
   * @param {Object} params - Sync parameters
   * @returns {Promise<Object>} - Sync results
   */
  async syncFromERP(entity, params = {}) {
    throw new Error('Method syncFromERP() must be implemented by subclass');
  }
}

module.exports = BaseERPService; 