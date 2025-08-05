/**
 * CacheManager.js
 * 
 * Multi-level caching strategy implementation
 * Implements RF025 - Implement multi-level caching strategy
 * Enhanced for RF027 - Implement cache invalidation patterns
 */

const logger = require('../logger');
const EventEmitter = require('events');
const CacheInvalidator = require('./CacheInvalidator');

/**
 * Cache Manager
 * Implements a multi-level caching strategy with different cache providers
 */
class CacheManager {
  /**
   * Create a new cache manager
   * @param {Object} options - Cache manager options
   * @param {Array} options.providers - Array of cache providers in order of priority
   * @param {Object} options.defaultPolicy - Default cache policy
   */
  constructor(options = {}) {
    this.providers = options.providers || [];
    this.defaultPolicy = options.defaultPolicy || {
      ttl: 3600, // 1 hour
      staleWhileRevalidate: false,
      staleIfError: false,
      backgroundRefresh: false
    };
    this.events = new EventEmitter();
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      sets: 0,
      deletes: 0
    };
    
    // Initialize providers if they have an initialize method
    this.providers.forEach(provider => {
      if (typeof provider.initialize === 'function') {
        provider.initialize();
      }
    });
    
    // Create cache invalidator
    this.invalidator = new CacheInvalidator({ cacheManager: this });
    
    logger.info(`Cache manager initialized with ${this.providers.length} providers`);
  }
  
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @param {Object} options - Get options
   * @param {Function} options.fetchFn - Function to fetch data if not in cache
   * @param {Object} options.policy - Cache policy for this request
   * @param {Array<string>} options.tags - Tags to associate with this key
   * @param {Array<string>} options.dependencies - Dependencies for this key
   * @returns {Promise<*>} - Cached value or null
   */
  async get(key, options = {}) {
    const policy = { ...this.defaultPolicy, ...(options.policy || {}) };
    const fetchFn = options.fetchFn;
    let value = null;
    let foundInProvider = -1;
    let stale = false;
    
    // Try to get from cache providers in order
    for (let i = 0; i < this.providers.length; i++) {
      try {
        const provider = this.providers[i];
        const result = await provider.get(key);
        
        if (result !== null) {
          // Check if the value is stale
          if (result.metadata && result.metadata.expiresAt && result.metadata.expiresAt < Date.now()) {
            stale = true;
            
            // If staleWhileRevalidate is not enabled, continue to next provider
            if (!policy.staleWhileRevalidate) {
              continue;
            }
          }
          
          value = result.value;
          foundInProvider = i;
          this.stats.hits++;
          
          // Emit cache hit event
          this.events.emit('hit', { key, provider: provider.name, level: i });
          
          // Break the loop since we found a value
          break;
        }
      } catch (error) {
        logger.error(`Error getting key ${key} from provider ${this.providers[i].name}:`, error);
        this.stats.errors++;
      }
    }
    
    // If value is not found in any provider and a fetch function is provided
    if (value === null && typeof fetchFn === 'function') {
      try {
        this.stats.misses++;
        this.events.emit('miss', { key });
        
        // Fetch fresh data
        value = await fetchFn();
        
        // Cache the fresh value in all providers
        if (value !== null && value !== undefined) {
          await this.set(key, value, policy, {
            tags: options.tags,
            dependencies: options.dependencies
          });
        }
      } catch (error) {
        logger.error(`Error fetching data for key ${key}:`, error);
        this.stats.errors++;
      }
    } else if (stale && typeof fetchFn === 'function') {
      // Handle stale data revalidation
      if (policy.backgroundRefresh) {
        // Refresh in background
        this._refreshInBackground(key, fetchFn, policy, {
          tags: options.tags,
          dependencies: options.dependencies
        });
      } else {
        // Refresh immediately
        try {
          const freshValue = await fetchFn();
          
          if (freshValue !== null && freshValue !== undefined) {
            await this.set(key, freshValue, policy, {
              tags: options.tags,
              dependencies: options.dependencies
            });
            value = freshValue;
          }
        } catch (error) {
          logger.error(`Error refreshing stale data for key ${key}:`, error);
          this.stats.errors++;
          
          // If staleIfError is not enabled, return null instead of stale data
          if (!policy.staleIfError) {
            value = null;
          }
        }
      }
    }
    
    // If value was found in a non-first provider, propagate it to higher-level providers
    if (foundInProvider > 0 && value !== null) {
      this._propagateToHigherLevels(key, value, policy, foundInProvider);
    }
    
    // Add tags and dependencies if provided
    if (value !== null) {
      if (options.tags && options.tags.length > 0) {
        this.invalidator.addTags(key, options.tags);
      }
      
      if (options.dependencies && options.dependencies.length > 0) {
        this.invalidator.addDependencies(key, options.dependencies);
      }
    }
    
    return value;
  }
  
  /**
   * Set a value in all cache providers
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {Object} policy - Cache policy
   * @param {Object} options - Additional options
   * @param {Array<string>} options.tags - Tags to associate with this key
   * @param {Array<string>} options.dependencies - Dependencies for this key
   * @returns {Promise<boolean>} - True if set in at least one provider
   */
  async set(key, value, policy = {}, options = {}) {
    const cachePolicy = { ...this.defaultPolicy, ...policy };
    const metadata = {
      createdAt: Date.now(),
      expiresAt: Date.now() + (cachePolicy.ttl * 1000)
    };
    let setInAnyProvider = false;
    
    // Set in all providers
    for (const provider of this.providers) {
      try {
        await provider.set(key, { value, metadata }, cachePolicy.ttl);
        setInAnyProvider = true;
      } catch (error) {
        logger.error(`Error setting key ${key} in provider ${provider.name}:`, error);
        this.stats.errors++;
      }
    }
    
    if (setInAnyProvider) {
      this.stats.sets++;
      this.events.emit('set', { key });
      
      // Add tags if provided
      if (options.tags && options.tags.length > 0) {
        this.invalidator.addTags(key, options.tags);
      }
      
      // Add dependencies if provided
      if (options.dependencies && options.dependencies.length > 0) {
        this.invalidator.addDependencies(key, options.dependencies);
      }
      
      // Schedule invalidation based on TTL if enabled
      if (cachePolicy.ttl > 0 && cachePolicy.hardTTL) {
        this.invalidator.scheduleInvalidation(key, cachePolicy.ttl);
      }
    }
    
    return setInAnyProvider;
  }
  
  /**
   * Delete a value from all cache providers
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if deleted from at least one provider
   */
  async del(key) {
    let deletedFromAnyProvider = false;
    
    // Delete from all providers
    for (const provider of this.providers) {
      try {
        const deleted = await provider.del(key);
        
        if (deleted) {
          deletedFromAnyProvider = true;
        }
      } catch (error) {
        logger.error(`Error deleting key ${key} from provider ${provider.name}:`, error);
        this.stats.errors++;
      }
    }
    
    if (deletedFromAnyProvider) {
      this.stats.deletes++;
      this.events.emit('delete', { key });
    }
    
    return deletedFromAnyProvider;
  }
  
  /**
   * Clear all cache providers by pattern
   * @param {string} pattern - Key pattern to match
   * @returns {Promise<number>} - Number of keys deleted
   */
  async clear(pattern = '*') {
    let totalDeleted = 0;
    
    // Clear from all providers
    for (const provider of this.providers) {
      try {
        if (typeof provider.clear === 'function') {
          const deleted = await provider.clear(pattern);
          totalDeleted += deleted;
        }
      } catch (error) {
        logger.error(`Error clearing pattern ${pattern} from provider ${provider.name}:`, error);
        this.stats.errors++;
      }
    }
    
    if (totalDeleted > 0) {
      this.events.emit('clear', { pattern, count: totalDeleted });
    }
    
    return totalDeleted;
  }
  
  /**
   * Cache a function result
   * @param {Function} fn - Function to cache
   * @param {string} key - Cache key
   * @param {Object} options - Cache options
   * @returns {Promise<*>} - Function result
   */
  async cacheResult(fn, key, options = {}) {
    return this.get(key, { 
      fetchFn: fn, 
      policy: options.policy,
      tags: options.tags,
      dependencies: options.dependencies
    });
  }
  
  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return { ...this.stats };
  }
  
  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      sets: 0,
      deletes: 0
    };
    
    this.events.emit('stats:reset');
  }
  
  /**
   * Subscribe to cache events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  on(event, listener) {
    this.events.on(event, listener);
  }
  
  /**
   * Unsubscribe from cache events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  off(event, listener) {
    this.events.off(event, listener);
  }
  
  /**
   * Close all cache providers
   * @returns {Promise<void>}
   */
  async close() {
    // Close the invalidator
    this.invalidator.close();
    
    // Close all providers
    for (const provider of this.providers) {
      try {
        if (typeof provider.close === 'function') {
          await provider.close();
        }
      } catch (error) {
        logger.error(`Error closing provider ${provider.name}:`, error);
      }
    }
    
    this.events.emit('close');
    this.events.removeAllListeners();
  }
  
  /**
   * Propagate a value to higher-level providers
   * @param {string} key - Cache key
   * @param {*} value - Value to propagate
   * @param {Object} policy - Cache policy
   * @param {number} foundInProvider - Index of provider where value was found
   * @private
   */
  async _propagateToHigherLevels(key, value, policy, foundInProvider) {
    const metadata = {
      createdAt: Date.now(),
      expiresAt: Date.now() + (policy.ttl * 1000)
    };
    
    // Propagate to higher-level providers (lower indices)
    for (let i = 0; i < foundInProvider; i++) {
      try {
        await this.providers[i].set(key, { value, metadata }, policy.ttl);
      } catch (error) {
        logger.error(`Error propagating key ${key} to provider ${this.providers[i].name}:`, error);
      }
    }
  }
  
  /**
   * Refresh stale data in background
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch fresh data
   * @param {Object} policy - Cache policy
   * @param {Object} options - Additional options
   * @private
   */
  _refreshInBackground(key, fetchFn, policy, options = {}) {
    // Execute in next tick to not block the current request
    process.nextTick(async () => {
      try {
        const freshValue = await fetchFn();
        
        if (freshValue !== null && freshValue !== undefined) {
          await this.set(key, freshValue, policy, options);
          this.events.emit('refresh', { key });
        }
      } catch (error) {
        logger.error(`Error refreshing data in background for key ${key}:`, error);
        this.stats.errors++;
      }
    });
  }
  
  // Advanced cache invalidation methods
  
  /**
   * Invalidate cache by tag
   * @param {string} tag - Tag to invalidate
   * @returns {Promise<number>} - Number of keys invalidated
   */
  async invalidateByTag(tag) {
    return this.invalidator.invalidateTag(tag);
  }
  
  /**
   * Invalidate cache by multiple tags
   * @param {Array<string>} tags - Tags to invalidate
   * @returns {Promise<number>} - Number of keys invalidated
   */
  async invalidateByTags(tags) {
    return this.invalidator.invalidateTags(tags);
  }
  
  /**
   * Invalidate all keys that depend on the specified key
   * @param {string} dependency - Dependency key
   * @returns {Promise<number>} - Number of keys invalidated
   */
  async invalidateDependents(dependency) {
    return this.invalidator.invalidateDependents(dependency);
  }
  
  /**
   * Batch invalidate multiple keys
   * @param {Array<string>} keys - Keys to invalidate
   * @returns {Promise<number>} - Number of keys invalidated
   */
  async batchInvalidate(keys) {
    return this.invalidator.batchInvalidate(keys);
  }
}

module.exports = CacheManager; 