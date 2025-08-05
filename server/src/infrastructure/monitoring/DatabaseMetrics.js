/**
 * DatabaseMetrics.js
 * 
 * Database metrics collection
 * Implements RF047 - Set up metrics collection
 */

const { getMetricsRegistry } = require('./MetricsRegistry');
const config = require('../../config/metrics.config');
const logger = require('../logger');

/**
 * Database Metrics
 * 
 * Collects metrics for database operations
 */
class DatabaseMetrics {
  /**
   * Create a new database metrics instance
   * @param {Object} options - Database metrics options
   */
  constructor(options = {}) {
    this.options = {
      ...config.categories.database,
      ...options
    };
    
    this.registry = getMetricsRegistry();
    this.slowQueries = new Map();
    
    if (this.options.enabled) {
      this._initialize();
    }
  }
  
  /**
   * Initialize database metrics
   * @private
   */
  _initialize() {
    const prefix = config.prefix;
    
    // Query counter
    this.queryCounter = this.registry.createCounter({
      name: `${prefix}db_queries_total`,
      help: 'Total number of database queries',
      labelNames: ['operation', 'collection', 'status']
    });
    
    // Query duration
    this.queryDuration = this.registry.createHistogram({
      name: `${prefix}db_query_duration_seconds`,
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'collection'],
      buckets: this.options.buckets
    });
    
    // Active connections
    this.activeConnections = this.registry.createGauge({
      name: `${prefix}db_connections_active`,
      help: 'Number of active database connections',
      labelNames: ['state']
    });
    
    // Connection pool metrics
    this.connectionPoolSize = this.registry.createGauge({
      name: `${prefix}db_connection_pool_size`,
      help: 'Database connection pool size',
      labelNames: ['type']
    });
    
    // Slow queries counter
    this.slowQueriesCounter = this.registry.createCounter({
      name: `${prefix}db_slow_queries_total`,
      help: 'Total number of slow database queries',
      labelNames: ['operation', 'collection']
    });
    
    // Query size
    if (this.options.recordQuerySize) {
      this.querySize = this.registry.createHistogram({
        name: `${prefix}db_query_size_bytes`,
        help: 'Database query size in bytes',
        labelNames: ['operation', 'collection'],
        buckets: [10, 100, 1000, 10000, 100000, 1000000]
      });
    }
    
    // Result size
    if (this.options.recordResultSize) {
      this.resultSize = this.registry.createHistogram({
        name: `${prefix}db_result_size_bytes`,
        help: 'Database result size in bytes',
        labelNames: ['operation', 'collection'],
        buckets: [10, 100, 1000, 10000, 100000, 1000000, 10000000]
      });
    }
    
    // Document count
    this.documentCount = this.registry.createGauge({
      name: `${prefix}db_document_count`,
      help: 'Number of documents in collection',
      labelNames: ['collection']
    });
    
    // Index size
    this.indexSize = this.registry.createGauge({
      name: `${prefix}db_index_size_bytes`,
      help: 'Size of database indexes in bytes',
      labelNames: ['collection', 'index']
    });
    
    // Storage size
    this.storageSize = this.registry.createGauge({
      name: `${prefix}db_storage_size_bytes`,
      help: 'Storage size in bytes',
      labelNames: ['collection', 'type']
    });
    
    // Error counter
    this.errorCounter = this.registry.createCounter({
      name: `${prefix}db_errors_total`,
      help: 'Total number of database errors',
      labelNames: ['operation', 'collection', 'error_type']
    });
    
    logger.info('Database metrics initialized');
  }
  
  /**
   * Record database query metrics
   * @param {Object} options - Query options
   * @param {string} options.operation - Operation type (find, insert, update, etc.)
   * @param {string} options.collection - Collection name
   * @param {Object} options.query - Query object
   * @param {Object} options.result - Query result
   * @param {number} options.duration - Query duration in milliseconds
   * @param {Error} options.error - Error object if query failed
   */
  recordQuery(options) {
    const { 
      operation, 
      collection, 
      query, 
      result, 
      duration, 
      error 
    } = options;
    
    // Skip if metrics are disabled
    if (!this.options.enabled) {
      return;
    }
    
    try {
      // Convert duration to seconds for Prometheus
      const durationInSeconds = duration / 1000;
      
      // Record query count
      const status = error ? 'error' : 'success';
      this.queryCounter.inc({ operation, collection, status });
      
      // Record query duration
      this.queryDuration.observe({ operation, collection }, durationInSeconds);
      
      // Check for slow queries
      if (duration > this.options.slowQueryThreshold) {
        this.slowQueriesCounter.inc({ operation, collection });
        
        // Store slow query details for analysis
        const slowQueryKey = `${collection}:${operation}`;
        const slowQueryInfo = {
          operation,
          collection,
          duration,
          timestamp: Date.now(),
          query: JSON.stringify(query).slice(0, 1000) // Limit size
        };
        
        // Store up to 100 slow queries per operation/collection
        if (!this.slowQueries.has(slowQueryKey)) {
          this.slowQueries.set(slowQueryKey, []);
        }
        
        const queries = this.slowQueries.get(slowQueryKey);
        queries.push(slowQueryInfo);
        
        if (queries.length > 100) {
          queries.shift(); // Remove oldest
        }
        
        // Log slow query
        logger.warn(`Slow database query: ${operation} on ${collection} took ${duration}ms`);
      }
      
      // Record query size if enabled
      if (this.querySize && query) {
        try {
          const size = Buffer.byteLength(JSON.stringify(query));
          this.querySize.observe({ operation, collection }, size);
        } catch (err) {
          // Ignore serialization errors
        }
      }
      
      // Record result size if enabled
      if (this.resultSize && result && !error) {
        try {
          // Handle different result types
          let size = 0;
          
          if (Array.isArray(result)) {
            // For arrays, sum the size of each item
            size = result.reduce((total, item) => {
              return total + Buffer.byteLength(JSON.stringify(item));
            }, 0);
          } else if (typeof result === 'object') {
            size = Buffer.byteLength(JSON.stringify(result));
          }
          
          if (size > 0) {
            this.resultSize.observe({ operation, collection }, size);
          }
        } catch (err) {
          // Ignore serialization errors
        }
      }
      
      // Record errors
      if (error) {
        const errorType = error.name || 'UnknownError';
        this.errorCounter.inc({ operation, collection, error_type: errorType });
        
        logger.error(`Database error: ${operation} on ${collection}`, {
          error: error.message,
          stack: error.stack,
          operation,
          collection
        });
      }
    } catch (err) {
      logger.error('Error recording database metrics', err);
    }
  }
  
  /**
   * Update connection metrics
   * @param {Object} stats - Connection statistics
   * @param {number} stats.active - Active connections
   * @param {number} stats.available - Available connections
   * @param {number} stats.pending - Pending connections
   */
  updateConnectionMetrics(stats) {
    if (!this.options.enabled) {
      return;
    }
    
    try {
      if (stats.active !== undefined) {
        this.activeConnections.set({ state: 'active' }, stats.active);
      }
      
      if (stats.available !== undefined) {
        this.activeConnections.set({ state: 'available' }, stats.available);
      }
      
      if (stats.pending !== undefined) {
        this.activeConnections.set({ state: 'pending' }, stats.pending);
      }
      
      // Update pool size metrics
      if (stats.min !== undefined) {
        this.connectionPoolSize.set({ type: 'min' }, stats.min);
      }
      
      if (stats.max !== undefined) {
        this.connectionPoolSize.set({ type: 'max' }, stats.max);
      }
      
      if (stats.size !== undefined) {
        this.connectionPoolSize.set({ type: 'current' }, stats.size);
      }
    } catch (err) {
      logger.error('Error updating connection metrics', err);
    }
  }
  
  /**
   * Update collection statistics
   * @param {Object} stats - Collection statistics
   * @param {string} stats.collection - Collection name
   * @param {number} stats.count - Document count
   * @param {number} stats.size - Collection size in bytes
   * @param {number} stats.storageSize - Storage size in bytes
   * @param {Object} stats.indexSizes - Index sizes in bytes
   */
  updateCollectionStats(stats) {
    if (!this.options.enabled) {
      return;
    }
    
    try {
      const { collection, count, size, storageSize, indexSizes } = stats;
      
      if (count !== undefined) {
        this.documentCount.set({ collection }, count);
      }
      
      if (size !== undefined) {
        this.storageSize.set({ collection, type: 'size' }, size);
      }
      
      if (storageSize !== undefined) {
        this.storageSize.set({ collection, type: 'storage' }, storageSize);
      }
      
      // Update index sizes
      if (indexSizes && typeof indexSizes === 'object') {
        for (const [index, indexSize] of Object.entries(indexSizes)) {
          this.indexSize.set({ collection, index }, indexSize);
        }
      }
    } catch (err) {
      logger.error('Error updating collection stats', err);
    }
  }
  
  /**
   * Get slow queries
   * @returns {Object} Slow queries by collection and operation
   */
  getSlowQueries() {
    const result = {};
    
    for (const [key, queries] of this.slowQueries.entries()) {
      result[key] = queries;
    }
    
    return result;
  }
  
  /**
   * Create a MongoDB query wrapper with metrics
   * @param {Function} originalMethod - Original MongoDB method
   * @param {string} operation - Operation name
   * @param {string} collection - Collection name
   * @returns {Function} Wrapped method with metrics
   */
  wrapMongoMethod(originalMethod, operation, collection) {
    const self = this;
    
    return async function(...args) {
      const startTime = Date.now();
      let error = null;
      let result = null;
      
      try {
        result = await originalMethod.apply(this, args);
        return result;
      } catch (err) {
        error = err;
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        
        self.recordQuery({
          operation,
          collection,
          query: args[0] || {},
          result,
          duration,
          error
        });
      }
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get the database metrics instance
 * @param {Object} options - Database metrics options
 * @returns {DatabaseMetrics} Database metrics instance
 */
function getDatabaseMetrics(options = {}) {
  if (!instance) {
    instance = new DatabaseMetrics(options);
  }
  return instance;
}

module.exports = {
  DatabaseMetrics,
  getDatabaseMetrics
}; 