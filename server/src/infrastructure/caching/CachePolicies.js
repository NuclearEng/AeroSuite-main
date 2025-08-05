/**
 * CachePolicies.js
 * 
 * Cache policy configurations for different data types
 * Implements RF025 - Implement multi-level caching strategy
 * Enhanced for RF027 - Implement cache invalidation patterns
 */

/**
 * Cache policies for different data types
 * Each policy defines caching behavior for a specific type of data
 */
const CachePolicies = {
  /**
   * Default cache policy
   * Used when no specific policy is provided
   */
  DEFAULT: {
    ttl: 3600, // 1 hour
    staleWhileRevalidate: false,
    staleIfError: false,
    backgroundRefresh: false,
    hardTTL: false // Whether to force invalidation after TTL
  },
  
  /**
   * Static data cache policy
   * For data that rarely changes (e.g., configuration, reference data)
   */
  STATIC: {
    ttl: 86400, // 24 hours
    staleWhileRevalidate: true,
    staleIfError: true,
    backgroundRefresh: true,
    hardTTL: false
  },
  
  /**
   * Dynamic data cache policy
   * For data that changes frequently but can be cached for short periods
   */
  DYNAMIC: {
    ttl: 300, // 5 minutes
    staleWhileRevalidate: true,
    staleIfError: false,
    backgroundRefresh: true,
    hardTTL: false
  },
  
  /**
   * User data cache policy
   * For user-specific data that should be cached for the duration of a session
   */
  USER: {
    ttl: 1800, // 30 minutes
    staleWhileRevalidate: false,
    staleIfError: false,
    backgroundRefresh: false,
    hardTTL: true
  },
  
  /**
   * API response cache policy
   * For external API responses that should be cached to reduce API calls
   */
  API: {
    ttl: 600, // 10 minutes
    staleWhileRevalidate: true,
    staleIfError: true,
    backgroundRefresh: false,
    hardTTL: false
  },
  
  /**
   * Micro cache policy
   * For very short-lived cache to prevent thundering herd problem
   */
  MICRO: {
    ttl: 10, // 10 seconds
    staleWhileRevalidate: false,
    staleIfError: false,
    backgroundRefresh: false,
    hardTTL: true
  },
  
  /**
   * Report data cache policy
   * For expensive report data that can be cached for longer periods
   */
  REPORT: {
    ttl: 3600, // 1 hour
    staleWhileRevalidate: true,
    staleIfError: true,
    backgroundRefresh: true,
    hardTTL: false
  },
  
  /**
   * Versioned data cache policy
   * For data that should be invalidated based on version changes
   */
  VERSIONED: {
    ttl: 86400, // 24 hours
    staleWhileRevalidate: false,
    staleIfError: false,
    backgroundRefresh: false,
    hardTTL: false
  },
  
  /**
   * Entity data cache policy
   * For entity data that should be invalidated when the entity changes
   */
  ENTITY: {
    ttl: 1800, // 30 minutes
    staleWhileRevalidate: true,
    staleIfError: false,
    backgroundRefresh: true,
    hardTTL: false
  },
  
  /**
   * Create a custom cache policy
   * @param {Object} options - Policy options
   * @returns {Object} - Custom cache policy
   */
  custom: (options = {}) => {
    return {
      ttl: options.ttl !== undefined ? options.ttl : 3600,
      staleWhileRevalidate: !!options.staleWhileRevalidate,
      staleIfError: !!options.staleIfError,
      backgroundRefresh: !!options.backgroundRefresh,
      hardTTL: !!options.hardTTL
    };
  }
};

module.exports = CachePolicies; 