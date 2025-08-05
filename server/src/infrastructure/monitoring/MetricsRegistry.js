/**
 * MetricsRegistry.js
 * 
 * Centralized metrics registry for the application
 * Implements RF047 - Set up metrics collection
 */

const client = require('prom-client');
const config = require('../../config/metrics.config');
const logger = require('../logger');

/**
 * Metrics Registry
 * 
 * Centralized registry for all application metrics
 */
class MetricsRegistry {
  /**
   * Create a new metrics registry
   * @param {Object} options - Registry options
   */
  constructor(options = {}) {
    this.options = { ...config, ...options };
    this.registry = new client.Registry();
    this.metrics = new Map();
    this.collectors = new Map();
    this.initialized = false;
    
    // Set default labels
    if (this.options.defaultLabels) {
      this.registry.setDefaultLabels(this.options.defaultLabels);
    }
    
    // Initialize if enabled
    if (this.options.enabled) {
      this._initialize();
    } else {
      logger.info('Metrics collection is disabled');
    }
  }
  
  /**
   * Initialize the metrics registry
   * @private
   */
  _initialize() {
    if (this.initialized) {
      return;
    }
    
    try {
      // Collect default metrics if enabled
      if (this.options.collectDefaultMetrics) {
        client.collectDefaultMetrics({
          register: this.registry,
          prefix: this.options.prefix,
          timeout: this.options.defaultMetricsTimeout
        });
        logger.info('Default metrics collection enabled');
      }
      
      // Initialize system metrics collection if enabled
      if (this.options.categories.system.enabled) {
        this._initializeSystemMetrics();
      }
      
      this.initialized = true;
      logger.info('Metrics registry initialized');
    } catch (error) {
      logger.error('Failed to initialize metrics registry', error);
    }
  }
  
  /**
   * Initialize system metrics collection
   * @private
   */
  _initializeSystemMetrics() {
    const prefix = this.options.prefix;
    
    // CPU metrics
    this.createGauge({
      name: `${prefix}cpu_usage_percent`,
      help: 'CPU usage percentage',
      collect: () => {
        // This is a simple approximation, for more accurate values
        // we would need to track usage over time
        const cpus = require('os').cpus();
        let idle = 0;
        let total = 0;
        
        for (const cpu of cpus) {
          for (const type in cpu.times) {
            total += cpu.times[type];
          }
          idle += cpu.times.idle;
        }
        
        const usage = 100 - (idle / total * 100);
        return usage;
      }
    });
    
    // Memory metrics
    const memoryGauge = this.createGauge({
      name: `${prefix}memory_usage_bytes`,
      help: 'Memory usage in bytes',
      labelNames: ['type']
    });
    
    this.addCollector('memory', () => {
      const os = require('os');
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      memoryGauge.set({ type: 'total' }, totalMem);
      memoryGauge.set({ type: 'free' }, freeMem);
      memoryGauge.set({ type: 'used' }, usedMem);
      
      // Process memory
      const processMemory = process.memoryUsage();
      memoryGauge.set({ type: 'process_rss' }, processMemory.rss);
      memoryGauge.set({ type: 'process_heap_total' }, processMemory.heapTotal);
      memoryGauge.set({ type: 'process_heap_used' }, processMemory.heapUsed);
      memoryGauge.set({ type: 'process_external' }, processMemory.external);
      
      if (processMemory.arrayBuffers) {
        memoryGauge.set({ type: 'process_array_buffers' }, processMemory.arrayBuffers);
      }
    });
    
    // Disk metrics
    if (process.platform !== 'win32') {
      const diskGauge = this.createGauge({
        name: `${prefix}disk_usage_bytes`,
        help: 'Disk usage in bytes',
        labelNames: ['mount', 'type']
      });
      
      this.addCollector('disk', async () => {
        try {
          const diskusage = require('diskusage');
          const path = '/';
          const info = await diskusage.check(path);
          
          diskGauge.set({ mount: path, type: 'total' }, info.total);
          diskGauge.set({ mount: path, type: 'free' }, info.free);
          diskGauge.set({ mount: path, type: 'used' }, info.total - info.free);
        } catch (error) {
          logger.error('Failed to collect disk metrics', error);
        }
      });
    }
    
    // Start system metrics collection
    this._startSystemMetricsCollection();
  }
  
  /**
   * Start system metrics collection
   * @private
   */
  _startSystemMetricsCollection() {
    const interval = this.options.categories.system.collectInterval;
    
    if (interval > 0) {
      // Collect immediately
      this._collectSystemMetrics();
      
      // Then collect at regular intervals
      setInterval(() => {
        this._collectSystemMetrics();
      }, interval);
      
      logger.info(`System metrics collection started with interval: ${interval}ms`);
    }
  }
  
  /**
   * Collect system metrics
   * @private
   */
  _collectSystemMetrics() {
    for (const [name, collector] of this.collectors) {
      try {
        collector();
      } catch (error) {
        logger.error(`Failed to collect ${name} metrics`, error);
      }
    }
  }
  
  /**
   * Create a counter metric
   * @param {Object} options - Counter options
   * @param {string} options.name - Metric name
   * @param {string} options.help - Help text
   * @param {Array<string>} options.labelNames - Label names
   * @returns {Counter} Counter metric
   */
  createCounter(options) {
    const { name, help, labelNames = [] } = options;
    
    if (this.metrics.has(name)) {
      return this.metrics.get(name);
    }
    
    const counter = new client.Counter({
      name,
      help,
      labelNames,
      registers: [this.registry]
    });
    
    this.metrics.set(name, counter);
    return counter;
  }
  
  /**
   * Create a gauge metric
   * @param {Object} options - Gauge options
   * @param {string} options.name - Metric name
   * @param {string} options.help - Help text
   * @param {Array<string>} options.labelNames - Label names
   * @param {Function} options.collect - Collection function
   * @returns {Gauge} Gauge metric
   */
  createGauge(options) {
    const { name, help, labelNames = [], collect } = options;
    
    if (this.metrics.has(name)) {
      return this.metrics.get(name);
    }
    
    const gauge = new client.Gauge({
      name,
      help,
      labelNames,
      registers: [this.registry]
    });
    
    this.metrics.set(name, gauge);
    
    // If a collect function is provided, register it
    if (typeof collect === 'function') {
      this.addCollector(name, () => {
        const value = collect();
        if (value !== undefined) {
          gauge.set(value);
        }
      });
    }
    
    return gauge;
  }
  
  /**
   * Create a histogram metric
   * @param {Object} options - Histogram options
   * @param {string} options.name - Metric name
   * @param {string} options.help - Help text
   * @param {Array<string>} options.labelNames - Label names
   * @param {Array<number>} options.buckets - Histogram buckets
   * @returns {Histogram} Histogram metric
   */
  createHistogram(options) {
    const { name, help, labelNames = [], buckets } = options;
    
    if (this.metrics.has(name)) {
      return this.metrics.get(name);
    }
    
    const histogramOptions = {
      name,
      help,
      labelNames,
      registers: [this.registry]
    };
    
    if (buckets) {
      histogramOptions.buckets = buckets;
    }
    
    const histogram = new client.Histogram(histogramOptions);
    this.metrics.set(name, histogram);
    return histogram;
  }
  
  /**
   * Create a summary metric
   * @param {Object} options - Summary options
   * @param {string} options.name - Metric name
   * @param {string} options.help - Help text
   * @param {Array<string>} options.labelNames - Label names
   * @param {Array<number>} options.percentiles - Percentiles to calculate
   * @param {number} options.maxAgeSeconds - Maximum age of observations in seconds
   * @param {number} options.ageBuckets - Number of age buckets
   * @returns {Summary} Summary metric
   */
  createSummary(options) {
    const { 
      name, 
      help, 
      labelNames = [], 
      percentiles = [0.01, 0.05, 0.5, 0.9, 0.95, 0.99],
      maxAgeSeconds = 600,
      ageBuckets = 5
    } = options;
    
    if (this.metrics.has(name)) {
      return this.metrics.get(name);
    }
    
    const summary = new client.Summary({
      name,
      help,
      labelNames,
      percentiles,
      maxAgeSeconds,
      ageBuckets,
      registers: [this.registry]
    });
    
    this.metrics.set(name, summary);
    return summary;
  }
  
  /**
   * Add a collector function
   * @param {string} name - Collector name
   * @param {Function} collector - Collector function
   */
  addCollector(name, collector) {
    if (typeof collector !== 'function') {
      throw new Error('Collector must be a function');
    }
    
    this.collectors.set(name, collector);
  }
  
  /**
   * Get a metric by name
   * @param {string} name - Metric name
   * @returns {Object} Metric
   */
  getMetric(name) {
    return this.metrics.get(name);
  }
  
  /**
   * Get all metrics
   * @returns {Array} Metrics array
   */
  getMetrics() {
    return Array.from(this.metrics.values());
  }
  
  /**
   * Get metrics in Prometheus format
   * @returns {string} Metrics in Prometheus format
   */
  getPrometheusMetrics() {
    return this.registry.metrics();
  }
  
  /**
   * Get metrics content type
   * @returns {string} Content type
   */
  getContentType() {
    return this.registry.contentType;
  }
  
  /**
   * Get metrics in JSON format
   * @returns {Object} Metrics in JSON format
   */
  getMetricsAsJson() {
    return this.registry.getMetricsAsJSON();
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.registry.resetMetrics();
    logger.info('All metrics have been reset');
  }
}

// Singleton instance
let instance = null;

/**
 * Get the metrics registry instance
 * @param {Object} options - Registry options
 * @returns {MetricsRegistry} Metrics registry instance
 */
function getMetricsRegistry(options = {}) {
  if (!instance) {
    instance = new MetricsRegistry(options);
  }
  return instance;
}

module.exports = {
  MetricsRegistry,
  getMetricsRegistry
}; 