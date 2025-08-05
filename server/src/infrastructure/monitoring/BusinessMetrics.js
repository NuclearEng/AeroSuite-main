/**
 * BusinessMetrics.js
 * 
 * Business metrics collection
 * Implements RF047 - Set up metrics collection
 */

const { getMetricsRegistry } = require('./MetricsRegistry');
const config = require('../../config/metrics.config');
const logger = require('../logger');

/**
 * Business Metrics
 * 
 * Collects business-level metrics for the application
 */
class BusinessMetrics {
  /**
   * Create a new business metrics instance
   * @param {Object} options - Business metrics options
   */
  constructor(options = {}) {
    this.options = {
      ...config.categories.business,
      ...options
    };
    
    this.registry = getMetricsRegistry();
    
    if (this.options.enabled) {
      this._initialize();
    }
  }
  
  /**
   * Initialize business metrics
   * @private
   */
  _initialize() {
    const prefix = config.prefix;
    
    // Supplier metrics
    if (this.options.customMetrics.suppliers) {
      this.supplierCount = this.registry.createGauge({
        name: `${prefix}business_suppliers_total`,
        help: 'Total number of suppliers',
        labelNames: ['status']
      });
      
      this.supplierComponentCount = this.registry.createGauge({
        name: `${prefix}business_supplier_components_total`,
        help: 'Total number of components per supplier',
        labelNames: ['supplier_id']
      });
      
      this.supplierInspectionCount = this.registry.createGauge({
        name: `${prefix}business_supplier_inspections_total`,
        help: 'Total number of inspections per supplier',
        labelNames: ['supplier_id', 'status']
      });
      
      this.supplierQualityScore = this.registry.createGauge({
        name: `${prefix}business_supplier_quality_score`,
        help: 'Quality score per supplier (0-100)',
        labelNames: ['supplier_id']
      });
    }
    
    // Customer metrics
    if (this.options.customMetrics.customers) {
      this.customerCount = this.registry.createGauge({
        name: `${prefix}business_customers_total`,
        help: 'Total number of customers',
        labelNames: ['status']
      });
      
      this.customerInspectionCount = this.registry.createGauge({
        name: `${prefix}business_customer_inspections_total`,
        help: 'Total number of inspections per customer',
        labelNames: ['customer_id', 'status']
      });
      
      this.customerComponentCount = this.registry.createGauge({
        name: `${prefix}business_customer_components_total`,
        help: 'Total number of components per customer',
        labelNames: ['customer_id']
      });
    }
    
    // Inspection metrics
    if (this.options.customMetrics.inspections) {
      this.inspectionCount = this.registry.createGauge({
        name: `${prefix}business_inspections_total`,
        help: 'Total number of inspections',
        labelNames: ['status', 'type']
      });
      
      this.inspectionDuration = this.registry.createHistogram({
        name: `${prefix}business_inspection_duration_seconds`,
        help: 'Inspection duration in seconds',
        labelNames: ['type'],
        buckets: [60, 300, 600, 1800, 3600, 7200, 14400, 28800]
      });
      
      this.inspectionDefectCount = this.registry.createGauge({
        name: `${prefix}business_inspection_defects_total`,
        help: 'Number of defects found in inspections',
        labelNames: ['severity', 'component_type']
      });
      
      this.inspectionPassRate = this.registry.createGauge({
        name: `${prefix}business_inspection_pass_rate`,
        help: 'Inspection pass rate (0-1)',
        labelNames: ['type', 'supplier_id']
      });
    }
    
    // Component metrics
    if (this.options.customMetrics.components) {
      this.componentCount = this.registry.createGauge({
        name: `${prefix}business_components_total`,
        help: 'Total number of components',
        labelNames: ['type', 'status']
      });
      
      this.componentDefectRate = this.registry.createGauge({
        name: `${prefix}business_component_defect_rate`,
        help: 'Component defect rate (0-1)',
        labelNames: ['type', 'supplier_id']
      });
    }
    
    logger.info('Business metrics initialized');
  }
  
  /**
   * Update supplier metrics
   * @param {Object} stats - Supplier statistics
   */
  updateSupplierMetrics(stats) {
    if (!this.options.enabled || !this.options.customMetrics.suppliers) {
      return;
    }
    
    try {
      const { 
        totalCount, 
        activeCount, 
        inactiveCount,
        pendingCount,
        supplierComponents,
        supplierInspections,
        supplierQualityScores
      } = stats;
      
      // Update supplier counts
      if (totalCount !== undefined) {
        this.supplierCount.set({ status: 'total' }, totalCount);
      }
      
      if (activeCount !== undefined) {
        this.supplierCount.set({ status: 'active' }, activeCount);
      }
      
      if (inactiveCount !== undefined) {
        this.supplierCount.set({ status: 'inactive' }, inactiveCount);
      }
      
      if (pendingCount !== undefined) {
        this.supplierCount.set({ status: 'pending' }, pendingCount);
      }
      
      // Update supplier component counts
      if (supplierComponents && typeof supplierComponents === 'object') {
        for (const [supplierId, count] of Object.entries(supplierComponents)) {
          this.supplierComponentCount.set({ supplier_id: supplierId }, count);
        }
      }
      
      // Update supplier inspection counts
      if (supplierInspections && typeof supplierInspections === 'object') {
        for (const [supplierId, inspections] of Object.entries(supplierInspections)) {
          if (typeof inspections === 'object') {
            for (const [status, count] of Object.entries(inspections)) {
              this.supplierInspectionCount.set(
                { supplier_id: supplierId, status },
                count
              );
            }
          }
        }
      }
      
      // Update supplier quality scores
      if (supplierQualityScores && typeof supplierQualityScores === 'object') {
        for (const [supplierId, score] of Object.entries(supplierQualityScores)) {
          this.supplierQualityScore.set({ supplier_id: supplierId }, score);
        }
      }
    } catch (err) {
      logger.error('Error updating supplier metrics', err);
    }
  }
  
  /**
   * Update customer metrics
   * @param {Object} stats - Customer statistics
   */
  updateCustomerMetrics(stats) {
    if (!this.options.enabled || !this.options.customMetrics.customers) {
      return;
    }
    
    try {
      const { 
        totalCount, 
        activeCount, 
        inactiveCount,
        customerInspections,
        customerComponents
      } = stats;
      
      // Update customer counts
      if (totalCount !== undefined) {
        this.customerCount.set({ status: 'total' }, totalCount);
      }
      
      if (activeCount !== undefined) {
        this.customerCount.set({ status: 'active' }, activeCount);
      }
      
      if (inactiveCount !== undefined) {
        this.customerCount.set({ status: 'inactive' }, inactiveCount);
      }
      
      // Update customer inspection counts
      if (customerInspections && typeof customerInspections === 'object') {
        for (const [customerId, inspections] of Object.entries(customerInspections)) {
          if (typeof inspections === 'object') {
            for (const [status, count] of Object.entries(inspections)) {
              this.customerInspectionCount.set(
                { customer_id: customerId, status },
                count
              );
            }
          }
        }
      }
      
      // Update customer component counts
      if (customerComponents && typeof customerComponents === 'object') {
        for (const [customerId, count] of Object.entries(customerComponents)) {
          this.customerComponentCount.set({ customer_id: customerId }, count);
        }
      }
    } catch (err) {
      logger.error('Error updating customer metrics', err);
    }
  }
  
  /**
   * Update inspection metrics
   * @param {Object} stats - Inspection statistics
   */
  updateInspectionMetrics(stats) {
    if (!this.options.enabled || !this.options.customMetrics.inspections) {
      return;
    }
    
    try {
      const { 
        counts, 
        durations,
        defects,
        passRates
      } = stats;
      
      // Update inspection counts
      if (counts && typeof counts === 'object') {
        for (const [status, statusCounts] of Object.entries(counts)) {
          if (typeof statusCounts === 'object') {
            for (const [type, count] of Object.entries(statusCounts)) {
              this.inspectionCount.set({ status, type }, count);
            }
          } else if (typeof statusCounts === 'number') {
            this.inspectionCount.set({ status, type: 'all' }, statusCounts);
          }
        }
      }
      
      // Update inspection durations
      if (durations && typeof durations === 'object') {
        for (const [type, duration] of Object.entries(durations)) {
          if (Array.isArray(duration)) {
            // If it's an array of durations, observe each one
            for (const d of duration) {
              this.inspectionDuration.observe({ type }, d / 1000); // Convert ms to seconds
            }
          } else if (typeof duration === 'number') {
            this.inspectionDuration.observe({ type }, duration / 1000);
          }
        }
      }
      
      // Update defect counts
      if (defects && typeof defects === 'object') {
        for (const [severity, defectCounts] of Object.entries(defects)) {
          if (typeof defectCounts === 'object') {
            for (const [componentType, count] of Object.entries(defectCounts)) {
              this.inspectionDefectCount.set({ severity, component_type: componentType }, count);
            }
          }
        }
      }
      
      // Update pass rates
      if (passRates && typeof passRates === 'object') {
        for (const [type, rates] of Object.entries(passRates)) {
          if (typeof rates === 'object') {
            for (const [supplierId, rate] of Object.entries(rates)) {
              this.inspectionPassRate.set({ type, supplier_id: supplierId }, rate);
            }
          } else if (typeof rates === 'number') {
            this.inspectionPassRate.set({ type, supplier_id: 'all' }, rates);
          }
        }
      }
    } catch (err) {
      logger.error('Error updating inspection metrics', err);
    }
  }
  
  /**
   * Update component metrics
   * @param {Object} stats - Component statistics
   */
  updateComponentMetrics(stats) {
    if (!this.options.enabled || !this.options.customMetrics.components) {
      return;
    }
    
    try {
      const { 
        counts, 
        defectRates
      } = stats;
      
      // Update component counts
      if (counts && typeof counts === 'object') {
        for (const [type, statusCounts] of Object.entries(counts)) {
          if (typeof statusCounts === 'object') {
            for (const [status, count] of Object.entries(statusCounts)) {
              this.componentCount.set({ type, status }, count);
            }
          } else if (typeof statusCounts === 'number') {
            this.componentCount.set({ type, status: 'all' }, statusCounts);
          }
        }
      }
      
      // Update defect rates
      if (defectRates && typeof defectRates === 'object') {
        for (const [type, rates] of Object.entries(defectRates)) {
          if (typeof rates === 'object') {
            for (const [supplierId, rate] of Object.entries(rates)) {
              this.componentDefectRate.set({ type, supplier_id: supplierId }, rate);
            }
          } else if (typeof rates === 'number') {
            this.componentDefectRate.set({ type, supplier_id: 'all' }, rates);
          }
        }
      }
    } catch (err) {
      logger.error('Error updating component metrics', err);
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Get the business metrics instance
 * @param {Object} options - Business metrics options
 * @returns {BusinessMetrics} Business metrics instance
 */
function getBusinessMetrics(options = {}) {
  if (!instance) {
    instance = new BusinessMetrics(options);
  }
  return instance;
}

module.exports = {
  BusinessMetrics,
  getBusinessMetrics
}; 