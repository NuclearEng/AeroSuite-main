/**
 * MetricsService.js
 * 
 * Centralized service for metrics collection
 * Implements RF047 - Set up metrics collection
 */

const { getMetricsRegistry } = require('./MetricsRegistry');
const { getHttpMetrics } = require('./HttpMetrics');
const { getDatabaseMetrics } = require('./DatabaseMetrics');
const { getBusinessMetrics } = require('./BusinessMetrics');
const config = require('../../config/metrics.config');
const logger = require('../logger');

/**
 * Metrics Service
 * 
 * Centralized service for initializing and managing metrics collection
 */
class MetricsService {
  /**
   * Create a new metrics service
   * @param {Object} options - Service options
   */
  constructor(options = {}) {
    this.options = { ...config, ...options };
    this.initialized = false;
    
    // Initialize registry and metrics collectors
    this.registry = getMetricsRegistry(this.options);
    this.httpMetrics = getHttpMetrics(this.options.categories.http);
    this.dbMetrics = getDatabaseMetrics(this.options.categories.database);
    this.businessMetrics = getBusinessMetrics(this.options.categories.business);
    
    // Initialize metrics service if enabled
    if (this.options.enabled) {
      this.initialize();
    }
  }
  
  /**
   * Initialize metrics service
   */
  initialize() {
    if (this.initialized) {
      return;
    }
    
    try {
      // Set up periodic logging if enabled
      if (this.options.exporters.log.enabled) {
        this._setupPeriodicLogging();
      }
      
      this.initialized = true;
      logger.info('Metrics service initialized');
    } catch (error) {
      logger.error('Failed to initialize metrics service', error);
    }
  }
  
  /**
   * Set up periodic logging of metrics
   * @private
   */
  _setupPeriodicLogging() {
    const interval = this.options.exporters.log.interval;
    const level = this.options.exporters.log.level || 'info';
    
    setInterval(() => {
      try {
        const metrics = this.registry.getMetricsAsJson();
        logger[level]('Periodic metrics snapshot', { metrics });
      } catch (error) {
        logger.error('Failed to log metrics', error);
      }
    }, interval);
    
    logger.info(`Periodic metrics logging enabled with interval: ${interval}ms`);
  }
  
  /**
   * Get Express middleware for HTTP metrics
   * @returns {Function} Express middleware
   */
  getHttpMiddleware() {
    return this.httpMetrics.middleware();
  }
  
  /**
   * Get metrics in Prometheus format
   * @returns {string} Metrics in Prometheus format
   */
  getPrometheusMetrics() {
    return this.registry.getPrometheusMetrics();
  }
  
  /**
   * Get metrics content type for Prometheus
   * @returns {string} Content type
   */
  getContentType() {
    return this.registry.getContentType();
  }
  
  /**
   * Get metrics in JSON format
   * @returns {Object} Metrics in JSON format
   */
  getMetricsAsJson() {
    return this.registry.getMetricsAsJson();
  }
  
  /**
   * Record database query
   * @param {Object} options - Query options
   */
  recordDatabaseQuery(options) {
    this.dbMetrics.recordQuery(options);
  }
  
  /**
   * Update database connection metrics
   * @param {Object} stats - Connection statistics
   */
  updateDatabaseConnectionMetrics(stats) {
    this.dbMetrics.updateConnectionMetrics(stats);
  }
  
  /**
   * Update database collection statistics
   * @param {Object} stats - Collection statistics
   */
  updateDatabaseCollectionStats(stats) {
    this.dbMetrics.updateCollectionStats(stats);
  }
  
  /**
   * Update supplier metrics
   * @param {Object} stats - Supplier statistics
   */
  updateSupplierMetrics(stats) {
    this.businessMetrics.updateSupplierMetrics(stats);
  }
  
  /**
   * Update customer metrics
   * @param {Object} stats - Customer statistics
   */
  updateCustomerMetrics(stats) {
    this.businessMetrics.updateCustomerMetrics(stats);
  }
  
  /**
   * Update inspection metrics
   * @param {Object} stats - Inspection statistics
   */
  updateInspectionMetrics(stats) {
    this.businessMetrics.updateInspectionMetrics(stats);
  }
  
  /**
   * Update component metrics
   * @param {Object} stats - Component statistics
   */
  updateComponentMetrics(stats) {
    this.businessMetrics.updateComponentMetrics(stats);
  }
  
  /**
   * Create a MongoDB query wrapper with metrics
   * @param {Function} originalMethod - Original MongoDB method
   * @param {string} operation - Operation name
   * @param {string} collection - Collection name
   * @returns {Function} Wrapped method with metrics
   */
  wrapMongoMethod(originalMethod, operation, collection) {
    return this.dbMetrics.wrapMongoMethod(originalMethod, operation, collection);
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.registry.resetMetrics();
  }
}

// Singleton instance
let instance = null;

/**
 * Get the metrics service instance
 * @param {Object} options - Service options
 * @returns {MetricsService} Metrics service instance
 */
function getMetricsService(options = {}) {
  if (!instance) {
    instance = new MetricsService(options);
  }
  return instance;
}

module.exports = {
  MetricsService,
  getMetricsService
}; 