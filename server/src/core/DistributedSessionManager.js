/**
 * DistributedSessionManager.js
 * 
 * Comprehensive distributed session management for AeroSuite
 * Implements RF038 - Implement distributed session management
 */

const session = require('express-session');
const RedisStore = require('connect-redis').default;
const Redis = require('redis');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { DomainError } = require('./errors');

/**
 * Distributed Session Manager
 * Provides session management that works across multiple server instances
 */
class DistributedSessionManager {
  /**
   * Create a new distributed session manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      // Session configuration
      sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
      cookieName: process.env.SESSION_COOKIE_NAME || 'aerosuite.sid',
      cookiePath: process.env.COOKIE_PATH || '/',
      cookieDomain: process.env.COOKIE_DOMAIN,
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || 86400), // 24 hours in seconds
      sessionIdleTimeout: parseInt(process.env.SESSION_IDLE_TIMEOUT || 7200), // 2 hours in seconds
      maxSessionAge: parseInt(process.env.MAX_SESSION_AGE || 604800), // 7 days in seconds
      rememberMeDuration: parseInt(process.env.REMEMBER_ME_DURATION || 2592000), // 30 days in seconds
      
      // Security settings
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      strictValidation: process.env.STRICT_SESSION_VALIDATION === 'true',
      
      // Redis configuration
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      redisPrefix: process.env.REDIS_PREFIX || 'aerosuite-sess:',
      redisKeyPrefix: process.env.REDIS_KEY_PREFIX || 'aerosuite:',
      redisChannelPrefix: process.env.REDIS_CHANNEL_PREFIX || 'aerosuite-channel:',
      
      // Fallback options
      fallbackToMemory: process.env.FALLBACK_TO_MEMORY === 'true',
      
      // Override with provided options
      ...options
    };
    
    // Initialize clients
    this.redisClient = null;
    this.redisSubscriber = null;
    this.sessionStore = null;
    this.initialized = false;
    this.eventHandlers = new Map();
    
    // Session event channels
    this.channels = {
      sessionCreated: `${this.options.redisChannelPrefix}session-created`,
      sessionDestroyed: `${this.options.redisChannelPrefix}session-destroyed`,
      sessionInvalidated: `${this.options.redisChannelPrefix}session-invalidated`,
      userSessionsInvalidated: `${this.options.redisChannelPrefix}user-sessions-invalidated`,
      broadcastMessage: `${this.options.redisChannelPrefix}broadcast-message`
    };
    
    // Instance ID for this server instance
    this.instanceId = uuidv4();
    
    // Session cleanup interval
    this.cleanupInterval = null;
  }
  
  /**
   * Initialize the session manager
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }
    
    try {
      // Initialize Redis clients
      await this._initializeRedisClients();
      
      // Create session store
      this._createSessionStore();
      
      // Subscribe to session events
      if (this.redisSubscriber) {
        await this._subscribeToEvents();
      }
      
      // Start session cleanup
      this._startSessionCleanup();
      
      this.initialized = true;
      logger.info('Distributed session manager initialized', { instanceId: this.instanceId });
    } catch (error) {
      logger.error('Failed to initialize distributed session manager:', error);
      
      // Fall back to memory store if configured
      if (this.options.fallbackToMemory) {
        this._fallbackToMemoryStore();
      } else {
        throw new Error('Failed to initialize distributed session manager');
      }
    }
  }
  
  /**
   * Initialize Redis clients
   * @returns {Promise<void>}
   * @private
   */
  async _initializeRedisClients() {
    if (!this.options.redisUrl) {
      throw new Error('Redis URL not provided for distributed session management');
    }
    
    // Create main Redis client
    this.redisClient = Redis.createClient({
      url: this.options.redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis connection failed after multiple attempts');
            return false;
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    // Set up event handlers
    this.redisClient.on('error', (err) => {
      logger.error('Redis client error in session manager:', err);
    });
    
    this.redisClient.on('connect', () => {
      logger.info('Redis connected for session management');
    });
    
    this.redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting for session management');
    });
    
    // Connect to Redis
    await this.redisClient.connect();
    
    // Create subscriber client for pub/sub
    this.redisSubscriber = this.redisClient.duplicate();
    await this.redisSubscriber.connect();
  }
  
  /**
   * Create session store
   * @private
   */
  _createSessionStore() {
    if (this.redisClient) {
      this.sessionStore = new RedisStore({
        client: this.redisClient,
        prefix: this.options.redisPrefix,
        ttl: this.options.sessionTimeout
      });
      
      logger.info('Redis session store initialized for distributed session management');
    } else if (this.options.fallbackToMemory) {
      this._fallbackToMemoryStore();
    } else {
      throw new Error('No Redis client available for session store');
    }
  }
  
  /**
   * Fall back to memory store (for development only)
   * @private
   */
  _fallbackToMemoryStore() {
    logger.warn('Falling back to in-memory session store - NOT SUITABLE FOR PRODUCTION');
    this.sessionStore = new session.MemoryStore();
  }
  
  /**
   * Subscribe to session events
   * @returns {Promise<void>}
   * @private
   */
  async _subscribeToEvents() {
    if (!this.redisSubscriber) {
      return;
    }
    
    try {
      // Subscribe to all channels
      await this.redisSubscriber.subscribe(
        Object.values(this.channels),
        (message, channel) => {
          try {
            const data = JSON.parse(message);
            
            // Skip messages from this instance
            if (data.instanceId === this.instanceId) {
              return;
            }
            
            // Handle event based on channel
            switch (channel) {
              case this.channels.sessionCreated:
                this._handleSessionCreated(data);
                break;
              case this.channels.sessionDestroyed:
                this._handleSessionDestroyed(data);
                break;
              case this.channels.sessionInvalidated:
                this._handleSessionInvalidated(data);
                break;
              case this.channels.userSessionsInvalidated:
                this._handleUserSessionsInvalidated(data);
                break;
              case this.channels.broadcastMessage:
                this._handleBroadcastMessage(data);
                break;
            }
            
            // Emit event to registered handlers
            const eventName = channel.replace(this.options.redisChannelPrefix, '');
            if (this.eventHandlers.has(eventName)) {
              this.eventHandlers.get(eventName).forEach(handler => {
                try {
                  handler(data);
                } catch (error) {
                  logger.error(`Error in event handler for ${eventName}:`, error);
                }
              });
            }
          } catch (error) {
            logger.error('Error handling Redis message:', error);
          }
        }
      );
      
      logger.info('Subscribed to session events');
    } catch (error) {
      logger.error('Failed to subscribe to session events:', error);
      throw error;
    }
  }
  
  /**
   * Start session cleanup interval
   * @private
   */
  _startSessionCleanup() {
    // Run cleanup every hour
    const cleanupInterval = 60 * 60 * 1000; // 1 hour
    
    this.cleanupInterval = setInterval(() => {
      this._cleanupExpiredSessions()
        .catch(error => {
          logger.error('Error during session cleanup:', error);
        });
    }, cleanupInterval);
    
    // Make sure the interval doesn't keep the process alive
    this.cleanupInterval.unref();
  }
  
  /**
   * Clean up expired sessions
   * @returns {Promise<void>}
   * @private
   */
  async _cleanupExpiredSessions() {
    if (!this.redisClient || !this.sessionStore) {
      return;
    }
    
    try {
      // The RedisStore will automatically remove expired sessions
      // but we can also manually clean up other session-related data
      
      // Get all session keys
      const sessionKeys = await this.redisClient.keys(`${this.options.redisPrefix}*`);
      logger.info(`Session cleanup: found ${sessionKeys.length} sessions`);
      
      // Check for any additional cleanup needed
      // This is a placeholder for custom cleanup logic
      
      logger.info('Session cleanup completed');
    } catch (error) {
      logger.error('Error cleaning up sessions:', error);
      throw error;
    }
  }
  
  /**
   * Handle session created event
   * @param {Object} data - Event data
   * @private
   */
  _handleSessionCreated(data) {
    logger.debug('Session created on another instance:', data);
    // Implement any necessary logic when a session is created on another instance
  }
  
  /**
   * Handle session destroyed event
   * @param {Object} data - Event data
   * @private
   */
  _handleSessionDestroyed(data) {
    logger.debug('Session destroyed on another instance:', data);
    // Implement any necessary logic when a session is destroyed on another instance
  }
  
  /**
   * Handle session invalidated event
   * @param {Object} data - Event data
   * @private
   */
  _handleSessionInvalidated(data) {
    logger.debug('Session invalidated on another instance:', data);
    // Implement any necessary logic when a session is invalidated on another instance
  }
  
  /**
   * Handle user sessions invalidated event
   * @param {Object} data - Event data
   * @private
   */
  _handleUserSessionsInvalidated(data) {
    logger.debug('User sessions invalidated on another instance:', data);
    // Implement any necessary logic when user sessions are invalidated on another instance
  }
  
  /**
   * Handle broadcast message event
   * @param {Object} data - Event data
   * @private
   */
  _handleBroadcastMessage(data) {
    logger.debug('Broadcast message received:', data);
    // Implement any necessary logic when a broadcast message is received
  }
  
  /**
   * Create session middleware
   * @param {Object} options - Additional options to override defaults
   * @returns {Function} Express session middleware
   */
  createSessionMiddleware(options = {}) {
    if (!this.initialized) {
      throw new Error('Session manager not initialized');
    }
    
    // Session options
    const sessionOptions = {
      name: this.options.cookieName,
      secret: this.options.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: this.sessionStore,
      cookie: {
        path: this.options.cookiePath,
        domain: this.options.cookieDomain,
        secure: this.options.secure,
        httpOnly: true,
        maxAge: this.options.sessionTimeout * 1000, // Convert to milliseconds
        sameSite: this.options.sameSite
      },
      genid: () => uuidv4(),
      ...options
    };
    
    return session(sessionOptions);
  }
  
  /**
   * Create session security middleware
   * @returns {Function} Express middleware
   */
  createSecurityMiddleware() {
    return (req, res, next) => {
      if (!req.session) {
        return next();
      }
      
      // Add security metadata if not present
      if (!req.session.security) {
        req.session.security = {
          createdAt: new Date(),
          lastActivity: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          fingerprint: this.generateFingerprint(req)
        };
      }
      
      // Update last activity
      req.session.security.lastActivity = new Date();
      
      // Validate session security
      if (req.session.userId) {
        // Check session fingerprint
        const currentFingerprint = this.generateFingerprint(req);
        if (req.session.security.fingerprint !== currentFingerprint) {
          logger.warn('Session fingerprint mismatch', {
            sessionId: req.sessionID,
            userId: req.session.userId,
            expectedFingerprint: req.session.security.fingerprint,
            actualFingerprint: currentFingerprint
          });
          
          // Destroy session on fingerprint mismatch if strict validation is enabled
          if (this.options.strictValidation) {
            req.session.destroy(() => {});
            return next(new DomainError('Session validation failed', 401));
          }
        }
        
        // Check session age
        const sessionAge = Date.now() - new Date(req.session.security.createdAt).getTime();
        if (sessionAge > this.options.maxSessionAge * 1000) {
          req.session.destroy(() => {});
          return next(new DomainError('Session expired', 401));
        }
        
        // Check idle timeout
        const idleTime = Date.now() - new Date(req.session.security.lastActivity).getTime();
        if (idleTime > this.options.sessionIdleTimeout * 1000) {
          req.session.destroy(() => {});
          return next(new DomainError('Session idle timeout', 401));
        }
      }
      
      next();
    };
  }
  
  /**
   * Generate a fingerprint for the request
   * Used to detect session hijacking
   * @param {Object} req - Express request object
   * @returns {string} Fingerprint
   */
  generateFingerprint(req) {
    const components = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.ip
    ];
    
    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }
  
  /**
   * Create a new user session
   * @param {Object} req - Express request object
   * @param {Object} user - User object
   * @param {Object} options - Session options
   * @returns {Promise<Object>} Session object
   */
  async createUserSession(req, user, options = {}) {
    if (!req.session) {
      throw new Error('Session middleware not initialized');
    }
    
    const {
      rememberMe = false,
      mfaVerified = false,
      metadata = {}
    } = options;
    
    // Regenerate session ID for security
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Set session data
    req.session.userId = user._id || user.id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;
    req.session.mfaVerified = mfaVerified;
    req.session.loginTime = new Date();
    req.session.metadata = metadata;
    
    // Set security data
    req.session.security = {
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      fingerprint: this.generateFingerprint(req)
    };
    
    // Set remember me cookie if requested
    if (rememberMe) {
      req.session.cookie.maxAge = this.options.rememberMeDuration * 1000;
    }
    
    // Save session
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Publish session created event
    await this.publishEvent(this.channels.sessionCreated, {
      sessionId: req.sessionID,
      userId: req.session.userId,
      instanceId: this.instanceId,
      timestamp: new Date().toISOString()
    });
    
    logger.info('User session created', {
      userId: req.session.userId,
      sessionId: req.sessionID,
      rememberMe
    });
    
    return req.session;
  }
  
  /**
   * Destroy a user session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async destroyUserSession(req, res) {
    if (!req.session || !req.session.userId) {
      return;
    }
    
    const userId = req.session.userId;
    const sessionId = req.sessionID;
    
    // Publish session destroyed event
    await this.publishEvent(this.channels.sessionDestroyed, {
      sessionId,
      userId,
      instanceId: this.instanceId,
      timestamp: new Date().toISOString()
    });
    
    // Destroy session
    await new Promise((resolve) => {
      req.session.destroy(() => {
        resolve();
      });
    });
    
    // Clear cookie
    if (res) {
      res.clearCookie(this.options.cookieName, {
        path: this.options.cookiePath,
        domain: this.options.cookieDomain
      });
    }
    
    logger.info('User session destroyed', {
      userId,
      sessionId
    });
  }
  
  /**
   * Invalidate a specific session
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateSession(sessionId) {
    if (!this.sessionStore) {
      throw new Error('Session store not initialized');
    }
    
    try {
      // Get session data first to extract user ID
      const sessionData = await this.getSessionData(sessionId);
      const userId = sessionData?.userId;
      
      // Destroy session
      await new Promise((resolve, reject) => {
        this.sessionStore.destroy(sessionId, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Publish session invalidated event
      await this.publishEvent(this.channels.sessionInvalidated, {
        sessionId,
        userId,
        instanceId: this.instanceId,
        timestamp: new Date().toISOString()
      });
      
      logger.info('Session invalidated', { sessionId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to invalidate session:', error);
      return false;
    }
  }
  
  /**
   * Invalidate all sessions for a user
   * @param {string} userId - User ID
   * @param {string} exceptSessionId - Session ID to exclude (current session)
   * @returns {Promise<number>} Number of invalidated sessions
   */
  async invalidateUserSessions(userId, exceptSessionId = null) {
    if (!this.redisClient || !this.sessionStore) {
      throw new Error('Redis client or session store not initialized');
    }
    
    try {
      // Find all sessions for the user
      const userSessions = await this.getUserSessions(userId);
      let invalidatedCount = 0;
      
      // Invalidate each session except the excluded one
      for (const session of userSessions) {
        if (session.id !== exceptSessionId) {
          await this.invalidateSession(session.id);
          invalidatedCount++;
        }
      }
      
      // Publish user sessions invalidated event
      await this.publishEvent(this.channels.userSessionsInvalidated, {
        userId,
        exceptSessionId,
        count: invalidatedCount,
        instanceId: this.instanceId,
        timestamp: new Date().toISOString()
      });
      
      logger.info('User sessions invalidated', {
        userId,
        count: invalidatedCount,
        exceptSessionId
      });
      
      return invalidatedCount;
    } catch (error) {
      logger.error('Failed to invalidate user sessions:', error);
      throw error;
    }
  }
  
  /**
   * Get all sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of session objects
   */
  async getUserSessions(userId) {
    if (!this.redisClient || !this.sessionStore) {
      throw new Error('Redis client or session store not initialized');
    }
    
    try {
      // Get all session keys
      const sessionKeys = await this.redisClient.keys(`${this.options.redisPrefix}*`);
      const sessions = [];
      
      // Check each session
      for (const key of sessionKeys) {
        const sessionId = key.replace(this.options.redisPrefix, '');
        const sessionData = await this.getSessionData(sessionId);
        
        if (sessionData && sessionData.userId === userId) {
          sessions.push({
            id: sessionId,
            ...sessionData
          });
        }
      }
      
      return sessions;
    } catch (error) {
      logger.error('Failed to get user sessions:', error);
      throw error;
    }
  }
  
  /**
   * Get session data
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} Session data or null if not found
   */
  async getSessionData(sessionId) {
    if (!this.sessionStore) {
      throw new Error('Session store not initialized');
    }
    
    try {
      return new Promise((resolve, reject) => {
        this.sessionStore.get(sessionId, (err, session) => {
          if (err) {
            reject(err);
          } else {
            resolve(session);
          }
        });
      });
    } catch (error) {
      logger.error('Failed to get session data:', error);
      return null;
    }
  }
  
  /**
   * Extend session duration
   * @param {Object} req - Express request object
   * @param {number} duration - Duration in seconds
   * @returns {Promise<boolean>} Success status
   */
  async extendSession(req, duration) {
    if (!req.session) {
      return false;
    }
    
    try {
      // Set new max age
      req.session.cookie.maxAge = duration * 1000;
      
      // Save session
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      logger.info('Session extended', {
        sessionId: req.sessionID,
        userId: req.session.userId,
        duration
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to extend session:', error);
      return false;
    }
  }
  
  /**
   * Publish an event to Redis
   * @param {string} channel - Event channel
   * @param {Object} data - Event data
   * @returns {Promise<void>}
   */
  async publishEvent(channel, data) {
    if (!this.redisClient) {
      logger.warn('Cannot publish event: Redis client not initialized');
      return;
    }
    
    try {
      await this.redisClient.publish(channel, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to publish event:', error);
    }
  }
  
  /**
   * Register event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Function} Function to unregister handler
   */
  onEvent(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event).add(handler);
    
    // Return unregister function
    return () => {
      if (this.eventHandlers.has(event)) {
        this.eventHandlers.get(event).delete(handler);
      }
    };
  }
  
  /**
   * Broadcast a message to all instances
   * @param {string} type - Message type
   * @param {Object} payload - Message payload
   * @returns {Promise<void>}
   */
  async broadcast(type, payload) {
    await this.publishEvent(this.channels.broadcastMessage, {
      type,
      payload,
      instanceId: this.instanceId,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Get session statistics
   * @returns {Promise<Object>} Session statistics
   */
  async getSessionStats() {
    if (!this.redisClient) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0
      };
    }
    
    try {
      // Get all session keys
      const sessionKeys = await this.redisClient.keys(`${this.options.redisPrefix}*`);
      const totalSessions = sessionKeys.length;
      let activeSessions = 0;
      let expiredSessions = 0;
      
      // Check each session
      for (const key of sessionKeys) {
        const ttl = await this.redisClient.ttl(key);
        if (ttl > 0) {
          activeSessions++;
        } else {
          expiredSessions++;
        }
      }
      
      return {
        totalSessions,
        activeSessions,
        expiredSessions
      };
    } catch (error) {
      logger.error('Failed to get session statistics:', error);
      throw error;
    }
  }
  
  /**
   * Gracefully shutdown the session manager
   * @returns {Promise<void>}
   */
  async shutdown() {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Close Redis clients
    if (this.redisSubscriber) {
      try {
        await this.redisSubscriber.quit();
        logger.info('Redis subscriber closed');
      } catch (error) {
        logger.error('Error closing Redis subscriber:', error);
      }
      this.redisSubscriber = null;
    }
    
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        logger.info('Redis client closed');
      } catch (error) {
        logger.error('Error closing Redis client:', error);
      }
      this.redisClient = null;
    }
    
    this.initialized = false;
    logger.info('Distributed session manager shut down');
  }
}

// Export singleton instance
let instance = null;

/**
 * Get the singleton instance of the distributed session manager
 * @param {Object} options - Configuration options
 * @returns {DistributedSessionManager} Singleton instance
 */
function getInstance(options = {}) {
  if (!instance) {
    instance = new DistributedSessionManager(options);
  }
  return instance;
}

module.exports = {
  DistributedSessionManager,
  getInstance
}; 