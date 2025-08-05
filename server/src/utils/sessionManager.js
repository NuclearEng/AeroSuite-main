/**
 * Session Manager
 * 
 * This utility provides session management with Redis for distributed deployments.
 * It ensures that user sessions work reliably across multiple server instances.
 * 
 * Task: TS350 - Status: In Progress - Horizontal scaling implementation
 */

const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const logger = require('../infrastructure/logger');

// Configuration
const DEFAULT_CONFIG = {
  sessionSecret: process.env.SESSION_SECRET || 'aerosuite-secret-' + uuidv4(),
  cookieName: process.env.SESSION_COOKIE_NAME || 'aerosuite.sid',
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || 86400), // 24 hours in seconds
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
};

// Initialize Redis client
let redisClient;

/**
 * Initialize Redis client for session management
 * @returns {Object|null} Redis client or null if unavailable
 */
function initRedisClient() {
  if (!DEFAULT_CONFIG.redisUrl) {
    logger.warn('Redis URL not provided for session management, falling back to in-memory store');
    return null;
  }
  
  try {
    redisClient = Redis.createClient({
      url: DEFAULT_CONFIG.redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after multiple attempts, using fallback session storage');
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis client error in session manager:', err);
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis connected for session management');
    });
    
    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting for session management');
    });
    
    // Connect to Redis
    redisClient.connect().catch(err => {
      logger.error('Failed to connect to Redis for session management:', err);
    });
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis client for session management:', error);
    return null;
  }
}

/**
 * Create session middleware
 * @returns {Function} Express session middleware
 */
function createSessionMiddleware() {
  // Initialize Redis client if not already initialized
  if (!redisClient) {
    initRedisClient();
  }
  
  // Session options
  const sessionOptions = {
    name: DEFAULT_CONFIG.cookieName,
    secret: DEFAULT_CONFIG.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: DEFAULT_CONFIG.secure, // Use secure cookies in production
      httpOnly: true, // Prevent client-side JS from accessing cookies
      maxAge: DEFAULT_CONFIG.sessionTimeout * 1000, // Convert to milliseconds
      sameSite: DEFAULT_CONFIG.sameSite
    },
    genid: () => uuidv4()
  };
  
  // Use Redis store if available
  if (redisClient) {
    sessionOptions.store = new RedisStore({
      client: redisClient,
      prefix: 'aerosuite-sess:',
      ttl: DEFAULT_CONFIG.sessionTimeout
    });
    
    logger.info('Redis session store initialized for distributed session management');
  } else {
    logger.warn('Using in-memory session store - sessions will not be shared between instances');
  }
  
  return session(sessionOptions);
}

/**
 * Get session store for use in other parts of the application
 * @returns {Object} Session store
 */
function getSessionStore() {
  if (!redisClient) {
    initRedisClient();
  }
  
  if (redisClient) {
    return new RedisStore({
      client: redisClient,
      prefix: 'aerosuite-sess:',
      ttl: DEFAULT_CONFIG.sessionTimeout
    });
  }
  
  return null;
}

/**
 * Gracefully shutdown the session manager
 * @returns {Promise<void>}
 */
async function shutdown() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Session manager Redis client shut down gracefully');
    } catch (error) {
      logger.error('Error shutting down Redis client for session management:', error);
    }
  }
}

module.exports = {
  createSessionMiddleware,
  getSessionStore,
  initRedisClient,
  shutdown
}; 