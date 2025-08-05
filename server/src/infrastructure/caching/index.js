/**
 * index.js
 * 
 * Exports for caching infrastructure
 * Implements RF025 - Implement multi-level caching strategy
 * Enhanced for RF027 - Implement cache invalidation patterns
 * Enhanced for RF028 - Add cache monitoring and metrics
 */

const CacheManager = require('./CacheManager');
const CacheProvider = require('./CacheProvider');
const MemoryCacheProvider = require('./MemoryCacheProvider');
const RedisCacheProvider = require('./RedisCacheProvider');
const DatabaseCacheProvider = require('./DatabaseCacheProvider');
const CachePolicies = require('./CachePolicies');
const CachedService = require('./CachedService');
const CacheInvalidator = require('./CacheInvalidator');
const CacheMonitor = require('./CacheMonitor');
const CachePrometheusExporter = require('./CachePrometheusExporter');

// Singleton instances
let defaultCacheManager = null;
let defaultCacheMonitor = null;
let defaultPrometheusExporter = null;

/**
 * Create a default cache manager with memory and Redis providers
 * @param {Object} options - Cache manager options
 * @returns {CacheManager} - Default cache manager instance
 */
function createDefaultCacheManager(options = {}) {
  const providers = [
    new MemoryCacheProvider(options.memory),
    new RedisCacheProvider(options.redis)
  ];
  
  return new CacheManager({
    providers,
    defaultPolicy: CachePolicies.DEFAULT,
    ...options
  });
}

/**
 * Get or create the default cache manager
 * @param {Object} options - Cache manager options
 * @returns {CacheManager} - Default cache manager instance
 */
function getDefaultCacheManager(options = {}) {
  if (!defaultCacheManager) {
    defaultCacheManager = createDefaultCacheManager(options);
  }
  
  return defaultCacheManager;
}

/**
 * Create a cache monitor for a cache manager
 * @param {Object} options - Monitor options
 * @returns {CacheMonitor} - Cache monitor instance
 */
function createCacheMonitor(options = {}) {
  const cacheManager = options.cacheManager || getDefaultCacheManager();
  
  return new CacheMonitor({
    cacheManager,
    ...options
  });
}

/**
 * Get or create the default cache monitor
 * @param {Object} options - Monitor options
 * @returns {CacheMonitor} - Default cache monitor instance
 */
function getCacheMonitor(options = {}) {
  if (!defaultCacheMonitor) {
    defaultCacheMonitor = createCacheMonitor(options);
  }
  
  return defaultCacheMonitor;
}

/**
 * Create a Prometheus exporter for a cache monitor
 * @param {Object} options - Exporter options
 * @returns {CachePrometheusExporter} - Cache Prometheus exporter instance
 */
function createCachePrometheusExporter(options = {}) {
  const cacheMonitor = options.cacheMonitor || getCacheMonitor();
  
  return new CachePrometheusExporter({
    cacheMonitor,
    ...options
  });
}

/**
 * Get or create the default Prometheus exporter
 * @param {Object} options - Exporter options
 * @returns {CachePrometheusExporter} - Default Prometheus exporter instance
 */
function getCachePrometheusExporter(options = {}) {
  if (!defaultPrometheusExporter) {
    defaultPrometheusExporter = createCachePrometheusExporter(options);
  }
  
  return defaultPrometheusExporter;
}

module.exports = {
  CacheManager,
  CacheProvider,
  MemoryCacheProvider,
  RedisCacheProvider,
  DatabaseCacheProvider,
  CachePolicies,
  CachedService,
  CacheInvalidator,
  CacheMonitor,
  CachePrometheusExporter,
  createDefaultCacheManager,
  getDefaultCacheManager,
  createCacheMonitor,
  getCacheMonitor,
  createCachePrometheusExporter,
  getCachePrometheusExporter
}; 