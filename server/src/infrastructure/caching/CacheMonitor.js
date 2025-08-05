/**
 * CacheMonitor.js
 * 
 * Monitoring and metrics collection for cache operations
 * Implements RF028 - Add cache monitoring and metrics
 */

const EventEmitter = require('events');
const logger = require('../logger');

/**
 * Cache Monitor
 * Collects and exposes detailed cache metrics
 */
class CacheMonitor {
  /**
   * Create a new cache monitor
   * @param {Object} options - Monitor options
   * @param {Object} options.cacheManager - Cache manager instance
   * @param {boolean} options.detailedMetrics - Whether to collect detailed metrics
   * @param {number} options.samplingRate - Sampling rate for detailed metrics (0-1)
   * @param {number} options.metricsInterval - Interval in ms to aggregate metrics
   */
  constructor(options = {}) {
    if (!options.cacheManager) {
      throw new Error('Cache manager is required');
    }
    
    this.cacheManager = options.cacheManager;
    this.detailedMetrics = options.detailedMetrics !== false;
    this.samplingRate = options.samplingRate || 0.1; // Default 10% sampling
    this.metricsInterval = options.metricsInterval || 60000; // Default 1 minute
    this.events = new EventEmitter();
    
    // Basic metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      sets: 0,
      deletes: 0,
      expirations: 0,
      invalidations: 0,
      hitRatio: 0,
      missRatio: 0,
      errorRate: 0,
      avgLatency: 0
    };
    
    // Detailed metrics
    this.detailedMetrics = {
      keyMetrics: new Map(), // Metrics per key
      providerMetrics: new Map(), // Metrics per provider
      tagMetrics: new Map(), // Metrics per tag
      operationLatencies: [], // Array of operation latencies
      keySize: new Map(), // Size of cached values
      keyAccess: new Map(), // Access frequency per key
      hotKeys: [], // Most frequently accessed keys
      coldKeys: [] // Least frequently accessed keys
    };
    
    // Operation timestamps for latency calculation
    this.operationTimestamps = new Map();
    
    // Set up event listeners
    this._setupEventListeners();
    
    // Start periodic metrics aggregation
    this._startMetricsAggregation();
    
    logger.info('Cache monitor initialized');
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for cache events
    this.cacheManager.on('hit', this._onCacheHit.bind(this));
    this.cacheManager.on('miss', this._onCacheMiss.bind(this));
    this.cacheManager.on('set', this._onCacheSet.bind(this));
    this.cacheManager.on('delete', this._onCacheDelete.bind(this));
    this.cacheManager.on('clear', this._onCacheClear.bind(this));
    this.cacheManager.on('refresh', this._onCacheRefresh.bind(this));
    this.cacheManager.on('stats:reset', this._onStatsReset.bind(this));
    
    // Listen for invalidator events
    if (this.cacheManager.invalidator) {
      this.cacheManager.invalidator.on('delete', this._onInvalidation.bind(this));
    }
  }
  
  /**
   * Start an operation for latency tracking
   * @param {string} operation - Operation name
   * @param {string} key - Cache key
   * @private
   */
  _startOperation(operation, key) {
    if (!this.detailedMetrics || Math.random() > this.samplingRate) {
      return;
    }
    
    const operationId = `${operation}:${key}:${Date.now()}`;
    this.operationTimestamps.set(operationId, {
      operation,
      key,
      startTime: process.hrtime()
    });
    
    return operationId;
  }
  
  /**
   * End an operation and calculate latency
   * @param {string} operationId - Operation ID
   * @private
   */
  _endOperation(operationId) {
    if (!operationId || !this.operationTimestamps.has(operationId)) {
      return;
    }
    
    const { operation, key, startTime } = this.operationTimestamps.get(operationId);
    const diff = process.hrtime(startTime);
    const latencyMs = (diff[0] * 1e3) + (diff[1] / 1e6);
    
    // Store latency
    this.detailedMetrics.operationLatencies.push({
      operation,
      key,
      latency: latencyMs,
      timestamp: Date.now()
    });
    
    // Keep only the last 1000 latencies
    if (this.detailedMetrics.operationLatencies.length > 1000) {
      this.detailedMetrics.operationLatencies.shift();
    }
    
    // Update average latency
    this._updateAverageLatency();
    
    // Clean up
    this.operationTimestamps.delete(operationId);
    
    return latencyMs;
  }
  
  /**
   * Update average latency
   * @private
   */
  _updateAverageLatency() {
    if (this.detailedMetrics.operationLatencies.length === 0) {
      this.metrics.avgLatency = 0;
      return;
    }
    
    const sum = this.detailedMetrics.operationLatencies.reduce(
      (acc, item) => acc + item.latency, 0
    );
    this.metrics.avgLatency = sum / this.detailedMetrics.operationLatencies.length;
  }
  
  /**
   * Update key access metrics
   * @param {string} key - Cache key
   * @private
   */
  _updateKeyAccess(key) {
    if (!this.detailedMetrics) {
      return;
    }
    
    // Update access count
    const accessCount = (this.detailedMetrics.keyAccess.get(key) || 0) + 1;
    this.detailedMetrics.keyAccess.set(key, accessCount);
  }
  
  /**
   * Update key size metrics
   * @param {string} key - Cache key
   * @param {*} value - Cached value
   * @private
   */
  _updateKeySize(key, value) {
    if (!this.detailedMetrics) {
      return;
    }
    
    try {
      // Estimate size in bytes
      let size = 0;
      
      if (typeof value === 'string') {
        size = value.length * 2; // Rough estimate for string
      } else if (typeof value === 'object' && value !== null) {
        const json = JSON.stringify(value);
        size = json.length * 2; // Rough estimate for JSON string
      } else if (typeof value === 'number') {
        size = 8; // Assume 64-bit number
      } else if (typeof value === 'boolean') {
        size = 4; // Assume 32-bit boolean
      }
      
      this.detailedMetrics.keySize.set(key, size);
    } catch (error) {
      logger.error(`Error estimating size for key ${key}:`, error);
    }
  }
  
  /**
   * Handle cache hit event
   * @param {Object} event - Event data
   * @private
   */
  _onCacheHit(event) {
    this.metrics.hits++;
    this._updateHitRatio();
    this._updateKeyAccess(event.key);
    
    // Update provider metrics
    if (this.detailedMetrics && event.provider) {
      const providerMetrics = this.detailedMetrics.providerMetrics.get(event.provider) || {
        hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0
      };
      providerMetrics.hits++;
      this.detailedMetrics.providerMetrics.set(event.provider, providerMetrics);
    }
    
    this.events.emit('hit', event);
  }
  
  /**
   * Handle cache miss event
   * @param {Object} event - Event data
   * @private
   */
  _onCacheMiss(event) {
    this.metrics.misses++;
    this._updateHitRatio();
    
    this.events.emit('miss', event);
  }
  
  /**
   * Handle cache set event
   * @param {Object} event - Event data
   * @private
   */
  _onCacheSet(event) {
    this.metrics.sets++;
    
    // Update key metrics
    if (this.detailedMetrics) {
      const keyMetrics = this.detailedMetrics.keyMetrics.get(event.key) || {
        hits: 0, misses: 0, sets: 0, deletes: 0
      };
      keyMetrics.sets++;
      this.detailedMetrics.keyMetrics.set(event.key, keyMetrics);
      
      // Update key size if value is available
      if (event.value) {
        this._updateKeySize(event.key, event.value);
      }
    }
    
    this.events.emit('set', event);
  }
  
  /**
   * Handle cache delete event
   * @param {Object} event - Event data
   * @private
   */
  _onCacheDelete(event) {
    this.metrics.deletes++;
    
    // Update key metrics
    if (this.detailedMetrics) {
      const keyMetrics = this.detailedMetrics.keyMetrics.get(event.key) || {
        hits: 0, misses: 0, sets: 0, deletes: 0
      };
      keyMetrics.deletes++;
      this.detailedMetrics.keyMetrics.set(event.key, keyMetrics);
    }
    
    this.events.emit('delete', event);
  }
  
  /**
   * Handle cache clear event
   * @param {Object} event - Event data
   * @private
   */
  _onCacheClear(event) {
    // Clear events don't increment any specific counter
    // but we emit the event for subscribers
    this.events.emit('clear', event);
  }
  
  /**
   * Handle cache refresh event
   * @param {Object} event - Event data
   * @private
   */
  _onCacheRefresh(event) {
    // Refresh events don't increment any specific counter
    // but we emit the event for subscribers
    this.events.emit('refresh', event);
  }
  
  /**
   * Handle invalidation event
   * @param {Object} event - Event data
   * @private
   */
  _onInvalidation(event) {
    this.metrics.invalidations++;
    this.events.emit('invalidation', event);
  }
  
  /**
   * Handle stats reset event
   * @private
   */
  _onStatsReset() {
    this.resetMetrics();
  }
  
  /**
   * Update hit ratio
   * @private
   */
  _updateHitRatio() {
    const total = this.metrics.hits + this.metrics.misses;
    if (total > 0) {
      this.metrics.hitRatio = this.metrics.hits / total;
      this.metrics.missRatio = this.metrics.misses / total;
    } else {
      this.metrics.hitRatio = 0;
      this.metrics.missRatio = 0;
    }
  }
  
  /**
   * Start metrics aggregation
   * @private
   */
  _startMetricsAggregation() {
    this.aggregationInterval = setInterval(() => {
      this._aggregateMetrics();
    }, this.metricsInterval);
  }
  
  /**
   * Aggregate metrics
   * @private
   */
  _aggregateMetrics() {
    if (!this.detailedMetrics) {
      return;
    }
    
    // Calculate error rate
    const totalOperations = this.metrics.hits + this.metrics.misses + this.metrics.sets + this.metrics.deletes;
    if (totalOperations > 0) {
      this.metrics.errorRate = this.metrics.errors / totalOperations;
    }
    
    // Identify hot keys (most accessed)
    const keyAccessEntries = Array.from(this.detailedMetrics.keyAccess.entries());
    keyAccessEntries.sort((a, b) => b[1] - a[1]); // Sort by access count, descending
    
    this.detailedMetrics.hotKeys = keyAccessEntries.slice(0, 10).map(([key, count]) => ({
      key, count
    }));
    
    // Identify cold keys (least accessed but still in cache)
    this.detailedMetrics.coldKeys = keyAccessEntries.slice(-10).map(([key, count]) => ({
      key, count
    }));
    
    // Emit aggregated metrics event
    this.events.emit('metrics:aggregated', {
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      hotKeys: this.detailedMetrics.hotKeys,
      coldKeys: this.detailedMetrics.coldKeys
    });
  }
  
  /**
   * Get current metrics
   * @returns {Object} - Current metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Get detailed metrics
   * @returns {Object} - Detailed metrics
   */
  getDetailedMetrics() {
    if (!this.detailedMetrics) {
      return null;
    }
    
    // Convert Maps to Objects for easier serialization
    const result = {
      keyMetrics: Object.fromEntries(this.detailedMetrics.keyMetrics),
      providerMetrics: Object.fromEntries(this.detailedMetrics.providerMetrics),
      tagMetrics: Object.fromEntries(this.detailedMetrics.tagMetrics),
      operationLatencies: this.detailedMetrics.operationLatencies.slice(-100), // Last 100 latencies
      keySize: Object.fromEntries(this.detailedMetrics.keySize),
      keyAccess: Object.fromEntries(this.detailedMetrics.keyAccess),
      hotKeys: this.detailedMetrics.hotKeys,
      coldKeys: this.detailedMetrics.coldKeys
    };
    
    return result;
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics() {
    // Reset basic metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      sets: 0,
      deletes: 0,
      expirations: 0,
      invalidations: 0,
      hitRatio: 0,
      missRatio: 0,
      errorRate: 0,
      avgLatency: 0
    };
    
    // Reset detailed metrics
    if (this.detailedMetrics) {
      this.detailedMetrics.keyMetrics.clear();
      this.detailedMetrics.providerMetrics.clear();
      this.detailedMetrics.tagMetrics.clear();
      this.detailedMetrics.operationLatencies = [];
      this.detailedMetrics.keySize.clear();
      this.detailedMetrics.keyAccess.clear();
      this.detailedMetrics.hotKeys = [];
      this.detailedMetrics.coldKeys = [];
    }
    
    this.events.emit('metrics:reset');
  }
  
  /**
   * Subscribe to monitor events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  on(event, listener) {
    this.events.on(event, listener);
  }
  
  /**
   * Unsubscribe from monitor events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  off(event, listener) {
    this.events.off(event, listener);
  }
  
  /**
   * Clean up resources
   */
  close() {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    
    this.events.removeAllListeners();
  }
}

module.exports = CacheMonitor; 