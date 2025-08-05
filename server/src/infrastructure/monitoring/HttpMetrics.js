/**
 * HttpMetrics.js
 * 
 * HTTP request metrics collection
 * Implements RF047 - Set up metrics collection
 */

const { getMetricsRegistry } = require('./MetricsRegistry');
const config = require('../../config/metrics.config');
const logger = require('../logger');
const url = require('url');
const pathToRegexp = require('path-to-regexp');

/**
 * HTTP Metrics
 * 
 * Collects metrics for HTTP requests
 */
class HttpMetrics {
  /**
   * Create a new HTTP metrics instance
   * @param {Object} options - HTTP metrics options
   */
  constructor(options = {}) {
    this.options = {
      ...config.categories.http,
      ...options
    };
    
    this.registry = getMetricsRegistry();
    this.routePatterns = new Map();
    
    if (this.options.enabled) {
      this._initialize();
    }
  }
  
  /**
   * Initialize HTTP metrics
   * @private
   */
  _initialize() {
    const prefix = config.prefix;
    
    // Request count
    this.requestCounter = this.registry.createCounter({
      name: `${prefix}http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });
    
    // Request duration
    this.requestDuration = this.registry.createHistogram({
      name: `${prefix}http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: this.options.buckets
    });
    
    // Active requests
    this.activeRequests = this.registry.createGauge({
      name: `${prefix}http_requests_active`,
      help: 'Number of active HTTP requests',
      labelNames: ['method']
    });
    
    // Request size
    if (this.options.recordRequestSizeHistogram) {
      this.requestSize = this.registry.createHistogram({
        name: `${prefix}http_request_size_bytes`,
        help: 'HTTP request size in bytes',
        labelNames: ['method', 'route'],
        buckets: [100, 500, 1000, 5000, 10000, 50000, 100000]
      });
    }
    
    // Response size
    if (this.options.recordResponseSizeHistogram) {
      this.responseSize = this.registry.createHistogram({
        name: `${prefix}http_response_size_bytes`,
        help: 'HTTP response size in bytes',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 1000000]
      });
    }
    
    logger.info('HTTP metrics initialized');
  }
  
  /**
   * Normalize route path
   * @param {string} path - Route path
   * @returns {string} Normalized path
   * @private
   */
  _normalizePath(path) {
    // Replace route params with placeholders
    if (path) {
      // Check if we've already parsed this path
      if (this.routePatterns.has(path)) {
        return this.routePatterns.get(path);
      }
      
      try {
        // Use path-to-regexp to parse route parameters
        const keys = [];
        pathToRegexp(path, keys);
        
        if (keys.length > 0) {
          let normalizedPath = path;
          for (const key of keys) {
            normalizedPath = normalizedPath.replace(`:${key.name}`, `:param`);
          }
          
          this.routePatterns.set(path, normalizedPath);
          return normalizedPath;
        }
      } catch (error) {
        logger.debug(`Failed to normalize path: ${path}`, error);
      }
    }
    
    return path || 'unknown';
  }
  
  /**
   * Check if a path should be excluded from metrics
   * @param {string} path - Path to check
   * @returns {boolean} True if path should be excluded
   * @private
   */
  _shouldExcludePath(path) {
    if (!path) return false;
    
    // Check exclude paths
    for (const excludePath of this.options.excludePaths) {
      if (path.startsWith(excludePath)) {
        return true;
      }
    }
    
    // If include paths are specified, only include those
    if (this.options.includePaths && this.options.includePaths.length > 0) {
      let included = false;
      for (const includePath of this.options.includePaths) {
        if (path.startsWith(includePath)) {
          included = true;
          break;
        }
      }
      return !included;
    }
    
    return false;
  }
  
  /**
   * Create middleware for HTTP metrics collection
   * @returns {Function} Express middleware
   */
  middleware() {
    return (req, res, next) => {
      // Skip excluded paths
      if (this._shouldExcludePath(req.path)) {
        return next();
      }
      
      // Get normalized route path
      const route = req.route ? this._normalizePath(req.route.path) : 'unknown';
      const method = req.method;
      const startTime = process.hrtime();
      
      // Increment active requests
      this.activeRequests.inc({ method });
      
      // Record request size if enabled
      if (this.requestSize && req.headers['content-length']) {
        const size = parseInt(req.headers['content-length'], 10);
        if (!isNaN(size)) {
          this.requestSize.observe({ method, route }, size);
        }
      }
      
      // Add response hook
      const originalEnd = res.end;
      res.end = (...args) => {
        // Calculate request duration
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds + nanoseconds / 1e9;
        
        // Get status code
        const statusCode = res.statusCode.toString();
        
        // Record metrics
        this.requestCounter.inc({ method, route, status_code: statusCode });
        this.requestDuration.observe({ method, route, status_code: statusCode }, duration);
        
        // Decrement active requests
        this.activeRequests.dec({ method });
        
        // Record response size if enabled and available
        if (this.responseSize) {
          let size;
          
          // Try to get response size from Content-Length header
          if (res.getHeader('content-length')) {
            size = parseInt(res.getHeader('content-length'), 10);
          } 
          // For chunked responses, calculate size from response body
          else if (args[0]) {
            size = Buffer.byteLength(args[0]);
          }
          
          if (!isNaN(size)) {
            this.responseSize.observe({ method, route, status_code: statusCode }, size);
          }
        }
        
        // Call original end
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get the HTTP metrics instance
 * @param {Object} options - HTTP metrics options
 * @returns {HttpMetrics} HTTP metrics instance
 */
function getHttpMetrics(options = {}) {
  if (!instance) {
    instance = new HttpMetrics(options);
  }
  return instance;
}

module.exports = {
  HttpMetrics,
  getHttpMetrics
}; 