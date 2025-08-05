/**
 * Database Core Framework
 * Task: TS108 - Database Core Framework
 * 
 * This module provides centralized database connection management,
 * query optimization, and database utilities for the AeroSuite platform.
 */

const mongoose = require('mongoose');
const util = require('util');
const fs = require('fs');
const path = require('path');
const { logDataEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

// Cache for storing query results
const queryCache = new Map();

/**
 * Database configuration
 */
const dbConfig = {
  // Default connection options
  connectionOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 100,
    minPoolSize: 5,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 30000,
    serverSelectionTimeoutMS: 30000,
    keepAlive: true,
    keepAliveInitialDelay: 300000,
    bufferCommands: false,
    maxConnecting: 10,
  },
  
  // Query timeout (ms)
  queryTimeoutMS: parseInt(process.env.DB_QUERY_TIMEOUT_MS || '30000', 10),
  
  // Query cache configuration
  queryCache: {
    enabled: process.env.QUERY_CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.QUERY_CACHE_TTL || '60000', 10), // 1 minute
    maxSize: parseInt(process.env.QUERY_CACHE_MAX_SIZE || '1000', 10) // Max entries
  },
  
  // Slow query threshold (ms)
  slowQueryThresholdMS: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '1000', 10),
  
  // Enable query logging
  logQueries: process.env.LOG_DB_QUERIES === 'true',
  
  // Auto index creation
  autoIndex: process.env.NODE_ENV !== 'production'
};

// Active connections pool
const connections = new Map();

// Monitoring data
const stats = {
  queryCount: 0,
  slowQueryCount: 0,
  errorCount: 0,
  cacheHits: 0,
  cacheMisses: 0,
  currentConnections: 0,
};

/**
 * Connect to MongoDB
 * @param {string} [uri] - MongoDB connection URI (defaults to MONGODB_URI env var)
 * @param {Object} [options] - Connection options to override defaults
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
async function connect(uri, options = {}) {
  const connectionUri = uri || process.env.MONGODB_URI;
  
  if (!connectionUri) {
    throw new Error('MongoDB connection URI not provided');
  }
  
  // Check if connection already exists
  if (connections.has(connectionUri)) {
    return connections.get(connectionUri);
  }
  
  // Merge default options with provided options
  const connectionOptions = {
    ...dbConfig.connectionOptions,
    ...options
  };
  
  // Add plugin for query timeouts
  mongoose.plugin(schema => {
    schema.pre(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'], function() {
      if (!this.options.timeout) {
        this.options.timeout = dbConfig.queryTimeoutMS;
      }
    });
  });
  
  try {
    // Create connection
    const connection = await mongoose.createConnection(connectionUri, connectionOptions).asPromise();
    
    // Setup connection event listeners
    setupConnectionEventListeners(connection, connectionUri);
    
    // Store connection in pool
    connections.set(connectionUri, connection);
    stats.currentConnections++;
    
    // Log successful connection
    logDataEvent(
      SEC_EVENT_SEVERITY.INFO,
      'Database connection established',
      {
        component: 'DatabaseCore',
        action: 'CONNECT',
        connectionId: connection.id
      }
    );
    
    return connection;
  } catch (error) {
    // Log connection error
    logDataEvent(
      SEC_EVENT_SEVERITY.HIGH,
      'Database connection failed',
      {
        component: 'DatabaseCore',
        action: 'CONNECT_ERROR',
        error: error.message
      }
    );
    
    throw error;
  }
}

/**
 * Get the default connection (same as mongoose.connection)
 * @returns {mongoose.Connection} Default mongoose connection
 */
function getDefaultConnection() {
  return mongoose.connection;
}

/**
 * Get a named connection from the connection pool
 * @param {string} uri - Connection URI
 * @returns {mongoose.Connection|null} Mongoose connection or null if not found
 */
function getConnection(uri) {
  return connections.get(uri) || null;
}

/**
 * Close a specific database connection
 * @param {string} uri - Connection URI to close
 * @returns {Promise<boolean>} True if closed, false if not found
 */
async function closeConnection(uri) {
  const connection = connections.get(uri);
  
  if (!connection) {
    return false;
  }
  
  await connection.close();
  connections.delete(uri);
  stats.currentConnections--;
  
  // Log connection closed
  logDataEvent(
    SEC_EVENT_SEVERITY.INFO,
    'Database connection closed',
    {
      component: 'DatabaseCore',
      action: 'DISCONNECT',
      connectionId: connection.id
    }
  );
  
  return true;
}

/**
 * Close all database connections
 * @returns {Promise<void>}
 */
async function closeAllConnections() {
  const closePromises = [];
  
  // Close each connection
  for (const [uri, connection] of connections.entries()) {
    closePromises.push(
      connection.close().then(() => {
        // Log connection closed
        logDataEvent(
          SEC_EVENT_SEVERITY.INFO,
          'Database connection closed',
          {
            component: 'DatabaseCore',
            action: 'DISCONNECT',
            connectionId: connection.id
          }
        );
        
        return uri;
      })
    );
  }
  
  // Wait for all connections to close
  const closedUris = await Promise.all(closePromises);
  
  // Remove closed connections from the pool
  for (const uri of closedUris) {
    connections.delete(uri);
  }
  
  stats.currentConnections = 0;
}

/**
 * Execute a cached database query
 * @param {Object} model - Mongoose model
 * @param {string} operation - Query operation (find, findOne, etc.)
 * @param {Object} query - Query conditions
 * @param {Object} [options={}] - Query options
 * @returns {Promise<any>} Query results
 */
async function executeQuery(model, operation, query, options = {}) {
  const startTime = Date.now();
  const { queryCache } = dbConfig;
  const shouldCache = queryCache.enabled && options.cache !== false && ['find', 'findOne', 'findById'].includes(operation);
  
  // Generate cache key if caching is enabled
  let cacheKey = null;
  if (shouldCache) {
    cacheKey = generateCacheKey(model.modelName, operation, query, options);
    
    // Check cache
    const cachedResult = queryCache.get(cacheKey);
    if (cachedResult && cachedResult.expiresAt > Date.now()) {
      stats.cacheHits++;
      return cachedResult.data;
    }
    
    stats.cacheMisses++;
  }
  
  try {
    // Execute query
    stats.queryCount++;
    
    // Set query timeout
    const queryOptions = {
      ...options,
      maxTimeMS: options.maxTimeMS || dbConfig.queryTimeoutMS
    };
    
    // Execute the query
    const result = await model[operation](query, queryOptions);
    
    const duration = Date.now() - startTime;
    
    // Check if this is a slow query
    if (duration > dbConfig.slowQueryThresholdMS) {
      stats.slowQueryCount++;
      logSlowQuery(model.modelName, operation, query, options, duration);
    }
    
    // Cache result if caching is enabled
    if (shouldCache && cacheKey) {
      const ttl = options.cacheTTL || queryCache.ttl;
      
      // Ensure cache doesn't exceed max size
      if (queryCache.size >= queryCache.maxSize) {
        // Remove oldest entry
        const oldestKey = queryCache.keys().next().value;
        queryCache.delete(oldestKey);
      }
      
      queryCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + ttl
      });
    }
    
    return result;
  } catch (error) {
    stats.errorCount++;
    
    // Log query error
    logDataEvent(
      SEC_EVENT_SEVERITY.MEDIUM,
      'Database query error',
      {
        component: 'DatabaseCore',
        action: 'QUERY_ERROR',
        model: model.modelName,
        operation,
        error: error.message,
        duration: Date.now() - startTime
      }
    );
    
    throw error;
  }
}

/**
 * Clear the query cache
 * @param {string} [modelName] - Clear cache only for specific model
 * @returns {number} Number of cache entries cleared
 */
function clearQueryCache(modelName) {
  if (modelName) {
    // Clear cache only for specific model
    let count = 0;
    for (const key of queryCache.keys()) {
      if (key.startsWith(`${modelName}:`)) {
        queryCache.delete(key);
        count++;
      }
    }
    return count;
  } else {
    // Clear entire cache
    const count = queryCache.size;
    queryCache.clear();
    return count;
  }
}

/**
 * Validate database connection
 * @param {mongoose.Connection} [connection] - Mongoose connection to validate (defaults to default connection)
 * @returns {Promise<boolean>} True if connection is valid
 */
async function validateConnection(connection = mongoose.connection) {
  try {
    // Check if connection is open
    if (connection.readyState !== 1) {
      return false;
    }
    
    // Try a simple operation to validate connection
    await connection.db.admin().ping();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create a database backup
 * @param {string} [outputPath] - Path to save backup
 * @returns {Promise<string>} Path to backup file
 */
async function createBackup(outputPath) {
  // Ensure output path exists
  const backupDir = outputPath || path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Generate backup filename
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupFile = path.join(backupDir, `mongodb-backup-${timestamp}.gz`);
  
  // Get database name from connection string
  const dbName = process.env.MONGODB_URI.split('/').pop().split('?')[0];
  
  // Use mongodump to create backup
  const { spawn } = require('child_process');
  const mongodump = spawn('mongodump', [
    `--uri=${process.env.MONGODB_URI}`,
    `--archive=${backupFile}`,
    '--gzip'
  ]);
  
  return new Promise((resolve, reject) => {
    mongodump.on('close', (code) => {
      if (code === 0) {
        resolve(backupFile);
      } else {
        reject(new Error(`mongodump exited with code ${code}`));
      }
    });
    
    mongodump.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Restore a database backup
 * @param {string} backupFile - Path to backup file
 * @returns {Promise<void>}
 */
async function restoreBackup(backupFile) {
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }
  
  // Use mongorestore to restore backup
  const { spawn } = require('child_process');
  const mongorestore = spawn('mongorestore', [
    `--uri=${process.env.MONGODB_URI}`,
    `--archive=${backupFile}`,
    '--gzip',
    '--drop'
  ]);
  
  return new Promise((resolve, reject) => {
    mongorestore.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`mongorestore exited with code ${code}`));
      }
    });
    
    mongorestore.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Get database statistics
 * @param {mongoose.Connection} [connection] - Mongoose connection (defaults to default connection)
 * @returns {Promise<Object>} Database statistics
 */
async function getDatabaseStats(connection = mongoose.connection) {
  try {
    // Get database stats
    const dbStats = await connection.db.stats();
    
    // Get collection stats
    const collections = await connection.db.listCollections().toArray();
    const collectionStats = [];
    
    for (const collection of collections) {
      const stats = await connection.db.collection(collection.name).stats();
      collectionStats.push({
        name: collection.name,
        count: stats.count,
        size: stats.size,
        avgObjSize: stats.avgObjSize,
        storageSize: stats.storageSize,
        indexSize: stats.totalIndexSize,
        indexCount: stats.indexCount || stats.nindexes
      });
    }
    
    // Get index information
    const indexStats = [];
    for (const collection of collections) {
      const indexes = await connection.db.collection(collection.name).indexes();
      for (const index of indexes) {
        indexStats.push({
          collection: collection.name,
          name: index.name,
          key: index.key,
          unique: !!index.unique,
          sparse: !!index.sparse,
          background: !!index.background
        });
      }
    }
    
    return {
      database: {
        name: dbStats.db,
        collections: dbStats.collections,
        views: dbStats.views,
        objects: dbStats.objects,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize,
        avgObjSize: dbStats.avgObjSize
      },
      collections: collectionStats,
      indexes: indexStats,
      engineStats: stats
    };
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
}

/**
 * Set up event listeners for a database connection
 * @param {mongoose.Connection} connection - Mongoose connection
 * @param {string} uri - Connection URI
 * @private
 */
function setupConnectionEventListeners(connection, uri) {
  // Log connection events
  connection.on('disconnected', () => {
    logDataEvent(
      SEC_EVENT_SEVERITY.MEDIUM,
      'Database connection disconnected',
      {
        component: 'DatabaseCore',
        action: 'DISCONNECTED',
        connectionId: connection.id
      }
    );
  });
  
  connection.on('reconnected', () => {
    logDataEvent(
      SEC_EVENT_SEVERITY.INFO,
      'Database connection reconnected',
      {
        component: 'DatabaseCore',
        action: 'RECONNECTED',
        connectionId: connection.id
      }
    );
  });
  
  connection.on('error', (err) => {
    logDataEvent(
      SEC_EVENT_SEVERITY.HIGH,
      'Database connection error',
      {
        component: 'DatabaseCore',
        action: 'CONNECTION_ERROR',
        connectionId: connection.id,
        error: err.message
      }
    );
  });
}

/**
 * Log slow query information
 * @param {string} modelName - Model name
 * @param {string} operation - Query operation
 * @param {Object} query - Query conditions
 * @param {Object} options - Query options
 * @param {number} duration - Query duration in ms
 * @private
 */
function logSlowQuery(modelName, operation, query, options, duration) {
  // Log slow query
  logDataEvent(
    SEC_EVENT_SEVERITY.LOW,
    'Slow database query detected',
    {
      component: 'DatabaseCore',
      action: 'SLOW_QUERY',
      model: modelName,
      operation,
      query: util.inspect(query, { depth: 3 }),
      options: util.inspect(options, { depth: 2 }),
      duration
    }
  );
  
  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[SLOW QUERY] ${modelName}.${operation} - ${duration}ms`);
  }
}

/**
 * Generate a cache key for a query
 * @param {string} modelName - Model name
 * @param {string} operation - Query operation
 * @param {Object} query - Query conditions
 * @param {Object} options - Query options
 * @returns {string} Cache key
 * @private
 */
function generateCacheKey(modelName, operation, query, options) {
  // Extract only relevant options for cache key
  const relevantOptions = {};
  
  if (options.projection) {
    relevantOptions.projection = options.projection;
  }
  
  if (options.sort) {
    relevantOptions.sort = options.sort;
  }
  
  if (options.skip) {
    relevantOptions.skip = options.skip;
  }
  
  if (options.limit) {
    relevantOptions.limit = options.limit;
  }
  
  if (options.populate) {
    relevantOptions.populate = options.populate;
  }
  
  // Create key string
  return `${modelName}:${operation}:${JSON.stringify(query)}:${JSON.stringify(relevantOptions)}`;
}

// Export the database core API
module.exports = {
  connect,
  getDefaultConnection,
  getConnection,
  closeConnection,
  closeAllConnections,
  executeQuery,
  clearQueryCache,
  validateConnection,
  createBackup,
  restoreBackup,
  getDatabaseStats,
  stats,
  mongoose
}; 