/**
 * Feature Flags Service
 * 
 * This service provides methods for managing and evaluating feature flags.
 * It supports different storage backends and provides caching for performance.
 */

const crypto = require('crypto');
const Redis = require('redis');
const { promisify } = require('util');
const mongoose = require('mongoose');
const config = require('../config/feature-flags.config');
const logger = require('../infrastructure/logger');

// In-memory storage for feature flags
let memoryFlags = { ...config.defaultFlags };

// In-memory cache for flag evaluation results
const evalCache = new Map();

// Redis client
let redisClient;
let redisGetAsync;
let redisSetAsync;
let redisKeysAsync;

// Initialize the storage backend
function initStorage() {
  if (!config.enabled) {
    logger.info('Feature flags system is disabled');
    return;
  }

  const storageType = config.storage.type;
  logger.info(`Initializing feature flags with ${storageType} storage`);

  switch (storageType) {
    case 'redis':
      initRedisStorage();
      break;
    case 'mongodb':
      // MongoDB storage is handled through the model
      syncFlagsToDatabase();
      break;
    case 'memory':
    default:
      // Nothing to initialize for memory storage
      break;
  }

  // Start sync interval if enabled
  if (config.sync.enabled && config.sync.interval > 0) {
    setInterval(syncFlags, config.sync.interval);
    logger.info(`Feature flags sync scheduled every ${config.sync.interval}ms`);
  }
}

// Initialize Redis storage
function initRedisStorage() {
  try {
    redisClient = Redis.createClient({
      url: config.storage.redis.url,
      retry_strategy: (options) => {
        if (options.error && (options.error.code === 'ECONNREFUSED' || options.error.code === 'NR_CLOSED')) {
          logger.warn('Redis connection failed for feature flags, using in-memory storage');
          return false;
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error in feature flags service:', err);
    });

    // Promisify Redis methods
    redisGetAsync = promisify(redisClient.get).bind(redisClient);
    redisSetAsync = promisify(redisClient.set).bind(redisClient);
    redisKeysAsync = promisify(redisClient.keys).bind(redisClient);

    // Initial sync from Redis to memory
    syncFlagsFromRedis();
  } catch (error) {
    logger.error('Failed to initialize Redis client for feature flags:', error);
  }
}

// Sync flags between storage backends
async function syncFlags() {
  try {
    switch (config.storage.type) {
      case 'redis':
        await syncFlagsToRedis();
        break;
      case 'mongodb':
        await syncFlagsToDatabase();
        break;
    }
  } catch (error) {
    logger.error('Error syncing feature flags:', error);
  }
}

// Sync flags from Redis to memory
async function syncFlagsFromRedis() {
  try {
    if (!redisClient || !redisKeysAsync || !redisGetAsync) {
      return;
    }

    const pattern = `${config.storage.redis.keyPrefix}*`;
    const keys = await redisKeysAsync(pattern);

    for (const key of keys) {
      const flagKey = key.replace(config.storage.redis.keyPrefix, '');
      const flagData = await redisGetAsync(key);
      
      try {
        memoryFlags[flagKey] = JSON.parse(flagData);
      } catch (e) {
        logger.error(`Error parsing flag data for ${flagKey}:`, e);
      }
    }

    logger.debug(`Synced ${keys.length} feature flags from Redis`);
  } catch (error) {
    logger.error('Error syncing feature flags from Redis:', error);
  }
}

// Sync flags from memory to Redis
async function syncFlagsToRedis() {
  try {
    if (!redisClient || !redisSetAsync) {
      return;
    }

    for (const [flagKey, flagData] of Object.entries(memoryFlags)) {
      const key = `${config.storage.redis.keyPrefix}${flagKey}`;
      await redisSetAsync(key, JSON.stringify(flagData));
    }

    logger.debug(`Synced ${Object.keys(memoryFlags).length} feature flags to Redis`);
  } catch (error) {
    logger.error('Error syncing feature flags to Redis:', error);
  }
}

// Sync flags with MongoDB
async function syncFlagsToDatabase() {
  try {
    // This would use a MongoDB model to sync flags
    // Will be implemented when we create the model
    logger.debug('MongoDB sync for feature flags called');
  } catch (error) {
    logger.error('Error syncing feature flags with database:', error);
  }
}

/**
 * Get all feature flags
 * @returns {Object} Map of all feature flags
 */
function getAllFlags() {
  return { ...memoryFlags };
}

/**
 * Get a feature flag by key
 * @param {string} flagKey - Feature flag key
 * @returns {Object|null} Feature flag object or null if not found
 */
function getFlag(flagKey) {
  return memoryFlags[flagKey] || null;
}

/**
 * Set a feature flag
 * @param {string} flagKey - Feature flag key
 * @param {Object} flagData - Feature flag data
 * @returns {Object} Updated feature flag
 */
async function setFlag(flagKey, flagData) {
  const updatedFlag = {
    ...flagData,
    modifiedAt: new Date()
  };

  // Update in memory
  memoryFlags[flagKey] = updatedFlag;

  // Clear evaluation cache for this flag
  clearFlagCache(flagKey);

  // Update in storage
  try {
    if (config.storage.type === 'redis' && redisClient && redisSetAsync) {
      const key = `${config.storage.redis.keyPrefix}${flagKey}`;
      await redisSetAsync(key, JSON.stringify(updatedFlag));
    }
    
    // MongoDB sync would be handled here as well
  } catch (error) {
    logger.error(`Error setting feature flag ${flagKey}:`, error);
  }

  return updatedFlag;
}

/**
 * Delete a feature flag
 * @param {string} flagKey - Feature flag key
 * @returns {boolean} Success indicator
 */
async function deleteFlag(flagKey) {
  if (!memoryFlags[flagKey]) {
    return false;
  }

  // Delete from memory
  delete memoryFlags[flagKey];

  // Clear evaluation cache for this flag
  clearFlagCache(flagKey);

  // Delete from storage
  try {
    if (config.storage.type === 'redis' && redisClient) {
      const key = `${config.storage.redis.keyPrefix}${flagKey}`;
      await promisify(redisClient.del).bind(redisClient)(key);
    }
    
    // MongoDB delete would be handled here
  } catch (error) {
    logger.error(`Error deleting feature flag ${flagKey}:`, error);
    return false;
  }

  return true;
}

/**
 * Clear evaluation cache for a specific flag
 * @param {string} flagKey - Feature flag key
 */
function clearFlagCache(flagKey) {
  // Delete all cache entries for this flag
  for (const key of evalCache.keys()) {
    if (key.startsWith(`${flagKey}:`)) {
      evalCache.delete(key);
    }
  }
}

/**
 * Clear the entire evaluation cache
 */
function clearAllCache() {
  evalCache.clear();
}

/**
 * Create a consistent hash for a user ID
 * @param {string} userId - User ID
 * @returns {number} Hash value between 0-100
 */
function getUserHash(userId) {
  // Create a hash combining the user ID and the hash seed
  const hash = crypto
    .createHash('md5')
    .update(`${userId}:${config.evaluation.hashSeed}`)
    .digest('hex');
  
  // Convert the first 4 bytes of the hash to an integer 0-100
  const hashInt = parseInt(hash.substring(0, 8), 16);
  return hashInt % 101; // 0-100 inclusive
}

/**
 * Check if a user matches segment rules
 * @param {Object} user - User object
 * @param {Object} segmentRules - Segment rules
 * @returns {boolean} Whether user matches rules
 */
function userMatchesSegment(user, segmentRules) {
  if (!user || !segmentRules) {
    return true;
  }

  // Check user roles
  if (segmentRules.userRoles && segmentRules.userRoles.length > 0) {
    if (!user.role || !segmentRules.userRoles.includes(user.role)) {
      return false;
    }
  }

  // Check custom user properties
  if (segmentRules.userProperties) {
    for (const [key, value] of Object.entries(segmentRules.userProperties)) {
      if (user[key] !== value) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Evaluate whether a feature flag is enabled for a user
 * @param {string} flagKey - Feature flag key
 * @param {Object} user - User object
 * @param {Object} options - Evaluation options
 * @returns {boolean} Whether the feature is enabled
 */
function isEnabled(flagKey, user, options = {}) {
  // Default options
  const opts = {
    useCache: true,
    environment: process.env.NODE_ENV || 'development',
    ...options
  };

  // First, check if feature flagging is enabled globally
  if (!config.enabled) {
    return config.evaluation.defaultState;
  }

  // Try to get from cache first
  const cacheKey = `${flagKey}:${user?.id || 'anonymous'}:${opts.environment}`;
  if (opts.useCache && evalCache.has(cacheKey)) {
    const cached = evalCache.get(cacheKey);
    if (Date.now() - cached.timestamp < config.evaluation.cacheTTL) {
      return cached.result;
    }
    // Cache expired, delete it
    evalCache.delete(cacheKey);
  }

  // Get the flag definition
  const flag = memoryFlags[flagKey];
  if (!flag) {
    return config.evaluation.defaultState;
  }

  // Check if the flag is globally enabled
  if (!flag.enabled) {
    return false;
  }

  // Check environment restrictions
  if (flag.environmentsEnabled && 
      flag.environmentsEnabled.length > 0 && 
      !flag.environmentsEnabled.includes(opts.environment)) {
    return false;
  }

  // Check segment rules
  if (flag.segmentRules && Object.keys(flag.segmentRules).length > 0) {
    if (!userMatchesSegment(user, flag.segmentRules)) {
      return false;
    }
  }

  // Check percentage rollout
  if (flag.rolloutPercentage < 100) {
    if (!user || !user.id) {
      // Anonymous users don't get percentage rollout features
      return false;
    }

    const userHashValue = getUserHash(user.id);
    if (userHashValue > flag.rolloutPercentage) {
      return false;
    }
  }

  // Cache the result
  evalCache.set(cacheKey, {
    result: true,
    timestamp: Date.now()
  });

  return true;
}

// Initialize on module load
initStorage();

module.exports = {
  getAllFlags,
  getFlag,
  setFlag,
  deleteFlag,
  isEnabled,
  clearFlagCache,
  clearAllCache,
  syncFlags
}; 