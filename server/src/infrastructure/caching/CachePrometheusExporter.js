/**
 * CachePrometheusExporter.js
 * 
 * Exports cache metrics to Prometheus
 * Implements RF028 - Add cache monitoring and metrics
 */

const client = require('prom-client');
const logger = require('../logger');

/**
 * Cache Prometheus Exporter
 * Exports cache metrics to Prometheus
 */
class CachePrometheusExporter {
  /**
   * Create a new cache Prometheus exporter
   * @param {Object} options - Exporter options
   * @param {Object} options.cacheMonitor - Cache monitor instance
   * @param {string} options.prefix - Metrics prefix
   * @param {number} options.interval - Collection interval in ms
   */
  constructor(options = {}) {
    if (!options.cacheMonitor) {
      throw new Error('Cache monitor is required');
    }
    
    this.cacheMonitor = options.cacheMonitor;
    this.prefix = options.prefix || 'cache_';
    this.interval = options.interval || 10000; // Default 10 seconds
    
    // Initialize Prometheus metrics
    this._initMetrics();
    
    // Start metrics collection
    this._startCollection();
    
    logger.info('Cache Prometheus exporter initialized');
  }
  
  /**
   * Initialize Prometheus metrics
   * @private
   */
  _initMetrics() {
    // Basic metrics
    this.metrics = {
      hits: new client.Counter({
        name: `${this.prefix}hits_total`,
        help: 'Total number of cache hits'
      }),
      
      misses: new client.Counter({
        name: `${this.prefix}misses_total`,
        help: 'Total number of cache misses'
      }),
      
      errors: new client.Counter({
        name: `${this.prefix}errors_total`,
        help: 'Total number of cache errors'
      }),
      
      sets: new client.Counter({
        name: `${this.prefix}sets_total`,
        help: 'Total number of cache sets'
      }),
      
      deletes: new client.Counter({
        name: `${this.prefix}deletes_total`,
        help: 'Total number of cache deletes'
      }),
      
      expirations: new client.Counter({
        name: `${this.prefix}expirations_total`,
        help: 'Total number of cache expirations'
      }),
      
      invalidations: new client.Counter({
        name: `${this.prefix}invalidations_total`,
        help: 'Total number of cache invalidations'
      }),
      
      hitRatio: new client.Gauge({
        name: `${this.prefix}hit_ratio`,
        help: 'Cache hit ratio'
      }),
      
      missRatio: new client.Gauge({
        name: `${this.prefix}miss_ratio`,
        help: 'Cache miss ratio'
      }),
      
      errorRate: new client.Gauge({
        name: `${this.prefix}error_rate`,
        help: 'Cache error rate'
      }),
      
      avgLatency: new client.Gauge({
        name: `${this.prefix}avg_latency_ms`,
        help: 'Average cache operation latency in milliseconds'
      })
    };
    
    // Provider metrics
    this.providerHitRatio = new client.Gauge({
      name: `${this.prefix}provider_hit_ratio`,
      help: 'Cache hit ratio by provider',
      labelNames: ['provider']
    });
    
    // Operation latency histogram
    this.operationLatency = new client.Histogram({
      name: `${this.prefix}operation_latency_ms`,
      help: 'Cache operation latency in milliseconds',
      labelNames: ['operation'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000]
    });
    
    // Key size histogram
    this.keySize = new client.Histogram({
      name: `${this.prefix}key_size_bytes`,
      help: 'Cache key size in bytes',
      buckets: [10, 100, 1000, 10000, 100000, 1000000]
    });
    
    // Set up event listeners
    this._setupEventListeners();
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for cache monitor events
    this.cacheMonitor.on('hit', this._onCacheHit.bind(this));
    this.cacheMonitor.on('miss', this._onCacheMiss.bind(this));
    this.cacheMonitor.on('set', this._onCacheSet.bind(this));
    this.cacheMonitor.on('delete', this._onCacheDelete.bind(this));
    this.cacheMonitor.on('invalidation', this._onInvalidation.bind(this));
    this.cacheMonitor.on('metrics:reset', this._onMetricsReset.bind(this));
  }
  
  /**
   * Handle cache hit event
   * @param {Object} event - Event data
   * @private
   */
  _onCacheHit(event) {
    this.metrics.hits.inc();
    
    if (event.latency) {
      this.operationLatency.observe({ operation: 'get' }, event.latency);
    }
    
    if (event.provider) {
      this.providerHitRatio.set({ provider: event.provider }, 1);
    }
  }
  
  /**
   * Handle cache miss event
   * @param {Object} event - Event data
   * @private
   */
  _onCacheMiss(event) {
    this.metrics.misses.inc();
    
    if (event.provider) {
      this.providerHitRatio.set({ provider: event.provider }, 0);
    }
  }
  
  /**
   * Handle cache set event
   * @param {Object} event - Event data
   * @private
   */
  _onCacheSet(event) {
    this.metrics.sets.inc();
    
    if (event.latency) {
      this.operationLatency.observe({ operation: 'set' }, event.latency);
    }
    
    if (event.size) {
      this.keySize.observe(event.size);
    }
  }
  
  /**
   * Handle cache delete event
   * @param {Object} event - Event data
   * @private
   */
  _onCacheDelete(event) {
    this.metrics.deletes.inc();
    
    if (event.latency) {
      this.operationLatency.observe({ operation: 'delete' }, event.latency);
    }
  }
  
  /**
   * Handle invalidation event
   * @param {Object} event - Event data
   * @private
   */
  _onInvalidation(event) {
    this.metrics.invalidations.inc();
  }
  
  /**
   * Handle metrics reset event
   * @private
   */
  _onMetricsReset() {
    // We don't reset Prometheus counters as they are cumulative
    // but we can reset gauges
    this.metrics.hitRatio.set(0);
    this.metrics.missRatio.set(0);
    this.metrics.errorRate.set(0);
    this.metrics.avgLatency.set(0);
  }
  
  /**
   * Start metrics collection
   * @private
   */
  _startCollection() {
    this.collectionInterval = setInterval(() => {
      this._collectMetrics();
    }, this.interval);
  }
  
  /**
   * Collect metrics from cache monitor
   * @private
   */
  _collectMetrics() {
    try {
      const metrics = this.cacheMonitor.getMetrics();
      
      // Update gauges
      this.metrics.hitRatio.set(metrics.hitRatio);
      this.metrics.missRatio.set(metrics.missRatio);
      this.metrics.errorRate.set(metrics.errorRate);
      this.metrics.avgLatency.set(metrics.avgLatency);
      
      // Get detailed metrics if available
      const detailedMetrics = this.cacheMonitor.getDetailedMetrics();
      if (detailedMetrics) {
        // Update provider hit ratios
        for (const [provider, providerMetrics] of Object.entries(detailedMetrics.providerMetrics)) {
          const total = providerMetrics.hits + providerMetrics.misses;
          if (total > 0) {
            this.providerHitRatio.set({ provider }, providerMetrics.hits / total);
          }
        }
        
        // Update key sizes
        for (const [key, size] of Object.entries(detailedMetrics.keySize)) {
          if (size > 0) {
            this.keySize.observe(size);
          }
        }
      }
    } catch (error) {
      logger.error('Error collecting cache metrics:', error);
    }
  }
  
  /**
   * Get all registered metrics
   * @returns {string} - Prometheus metrics in text format
   */
  async getMetrics() {
    return client.register.metrics();
  }
  
  /**
   * Clean up resources
   */
  close() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
  }
}

module.exports = CachePrometheusExporter; 