// Task: SEC022 - Session Management Implementation
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Redis = require('ioredis');
const connectRedis = require('connect-redis');
const crypto = require('crypto');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Initialize Redis client if available
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  redisClient.on('error', (err) => {
    logger.error('Redis session store error:', err);
  });
}

/**
 * Session configuration
 */
const sessionConfig = {
  name: process.env.SESSION_NAME || 'aerosuite.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiry on activity
  proxy: process.env.NODE_ENV === 'production', // Trust proxy
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict', // CSRF protection
    domain: process.env.COOKIE_DOMAIN || undefined
  }
};

/**
 * Get session store based on configuration
 */
function getSessionStore() {
  // Use Redis if available (preferred for production)
  if (redisClient) {
    const RedisStore = connectRedis(session);
    return new RedisStore({
      client: redisClient,
      prefix: 'sess:',
      ttl: sessionConfig.cookie.maxAge / 1000, // TTL in seconds
      disableTouch: false
    });
  }

  // Fall back to MongoDB
  if (process.env.MONGODB_URI) {
    return MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions',
      ttl: sessionConfig.cookie.maxAge / 1000,
      autoRemove: 'native',
      touchAfter: 24 * 3600, // Lazy session update
      crypto: {
        secret: sessionConfig.secret
      }
    });
  }

  // Use memory store for development only
  if (process.env.NODE_ENV === 'development') {
    logger.warn('Using in-memory session store. Not suitable for production!');
    return new session.MemoryStore();
  }

  throw new Error('No session store configured');
}

/**
 * Session middleware factory
 */
const createSessionMiddleware = (options = {}) => {
  const config = {
    ...sessionConfig,
    ...options,
    store: getSessionStore()
  };

  return session(config);
};

/**
 * Session security middleware
 */
const sessionSecurity = () => {
  return (req, res, next) => {
    if (!req.session) {
      return next();
    }

    // Regenerate session ID on privilege escalation
    req.session.regenerateSecure = function(callback) {
      const data = req.session;
      req.session.regenerate((err) => {
        if (err) return callback(err);
        
        // Restore session data
        Object.assign(req.session, data);
        req.session.save(callback);
      });
    };

    // Add security metadata
    if (!req.session.security) {
      req.session.security = {
        createdAt: new Date(),
        lastActivity: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        fingerprint: generateFingerprint(req)
      };
    }

    // Update last activity
    req.session.security.lastActivity = new Date();

    // Validate session security
    if (req.session.userId) {
      // Check session fingerprint
      const currentFingerprint = generateFingerprint(req);
      if (req.session.security.fingerprint !== currentFingerprint) {
        logger.warn('Session fingerprint mismatch', {
          sessionId: req.sessionID,
          userId: req.session.userId,
          expectedFingerprint: req.session.security.fingerprint,
          actualFingerprint: currentFingerprint
        });
        
        // Optionally destroy session on fingerprint mismatch
        if (process.env.STRICT_SESSION_VALIDATION === 'true') {
          req.session.destroy(() => {});
          return next(new AppError('Session validation failed', 401));
        }
      }

      // Check session age
      const sessionAge = Date.now() - new Date(req.session.security.createdAt).getTime();
      const maxSessionAge = parseInt(process.env.MAX_SESSION_AGE) || 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (sessionAge > maxSessionAge) {
        req.session.destroy(() => {});
        return next(new AppError('Session expired', 401));
      }

      // Check idle timeout
      const idleTime = Date.now() - new Date(req.session.security.lastActivity).getTime();
      const maxIdleTime = parseInt(process.env.SESSION_IDLE_TIMEOUT) || 2 * 60 * 60 * 1000; // 2 hours
      
      if (idleTime > maxIdleTime) {
        req.session.destroy(() => {});
        return next(new AppError('Session idle timeout', 401));
      }
    }

    next();
  };
};

/**
 * Session management utilities
 */
const sessionManager = {
  /**
   * Create a new session for user
   */
  async createUserSession(req, user, options = {}) {
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
    req.session.userId = user._id;
    req.session.userEmail = user.email;
    req.session.userRole = user.role;
    req.session.mfaVerified = mfaVerified;
    req.session.loginTime = new Date();
    req.session.metadata = metadata;

    // Set remember me cookie if requested
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    // Add session to user's active sessions
    await this.addActiveSession(user._id, {
      sessionId: req.sessionID,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      loginTime: req.session.loginTime,
      expiresAt: new Date(Date.now() + req.session.cookie.maxAge)
    });

    // Save session
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info('User session created', {
      userId: user._id,
      sessionId: req.sessionID,
      rememberMe
    });

    return req.session;
  },

  /**
   * Destroy user session
   */
  async destroyUserSession(req) {
    if (!req.session || !req.session.userId) {
      return;
    }

    const userId = req.session.userId;
    const sessionId = req.sessionID;

    // Remove from active sessions
    await this.removeActiveSession(userId, sessionId);

    // Destroy session
    await new Promise((resolve) => {
      req.session.destroy(() => {
        resolve();
      });
    });

    // Clear cookie
    res.clearCookie(sessionConfig.name);

    logger.info('User session destroyed', {
      userId,
      sessionId
    });
  },

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId) {
    const User = require('../models/User');
    const user = await User.findById(userId).select('sessions');
    
    if (!user) {
      return [];
    }

    // Filter out expired sessions
    const now = new Date();
    const activeSessions = user.sessions.filter(s => s.expiresAt > now);

    // Update if changed
    if (activeSessions.length !== user.sessions.length) {
      user.sessions = activeSessions;
      await user.save();
    }

    return activeSessions;
  },

  /**
   * Invalidate all sessions for a user
   */
  async invalidateAllUserSessions(userId, exceptSessionId = null) {
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return;
    }

    // Get all session IDs to invalidate
    const sessionsToInvalidate = user.sessions
      .filter(s => s.sessionId !== exceptSessionId)
      .map(s => s.sessionId);

    // Remove sessions from store
    for (const sessionId of sessionsToInvalidate) {
      await this.invalidateSession(sessionId);
    }

    // Update user sessions
    if (exceptSessionId) {
      user.sessions = user.sessions.filter(s => s.sessionId === exceptSessionId);
    } else {
      user.sessions = [];
    }

    await user.save();

    logger.info('Invalidated user sessions', {
      userId,
      invalidatedCount: sessionsToInvalidate.length
    });
  },

  /**
   * Add active session to user
   */
  async addActiveSession(userId, sessionData) {
    const User = require('../models/User');
    await User.findByIdAndUpdate(userId, {
      $push: {
        sessions: {
          ...sessionData,
          createdAt: new Date()
        }
      }
    });
  },

  /**
   * Remove active session from user
   */
  async removeActiveSession(userId, sessionId) {
    const User = require('../models/User');
    await User.findByIdAndUpdate(userId, {
      $pull: {
        sessions: { sessionId }
      }
    });
  },

  /**
   * Invalidate a specific session
   */
  async invalidateSession(sessionId) {
    if (redisClient) {
      await redisClient.del(`sess:${sessionId}`);
    } else if (sessionConfig.store) {
      await new Promise((resolve) => {
        sessionConfig.store.destroy(sessionId, () => {
          resolve();
        });
      });
    }
  },

  /**
   * Extend session expiry
   */
  async extendSession(req, duration) {
    if (!req.session) {
      return;
    }

    req.session.cookie.maxAge = duration;
    
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  /**
   * Get session statistics
   */
  async getSessionStats() {
    const stats = {
      totalSessions: 0,
      activeSessions: 0,
      expiredSessions: 0
    };

    if (redisClient) {
      const keys = await redisClient.keys('sess:*');
      stats.totalSessions = keys.length;
      
      // Check each session for expiry
      for (const key of keys) {
        const ttl = await redisClient.ttl(key);
        if (ttl > 0) {
          stats.activeSessions++;
        } else {
          stats.expiredSessions++;
        }
      }
    }

    return stats;
  }
};

/**
 * Session cleanup job
 */
const sessionCleanup = {
  async run() {
    try {
      const User = require('../models/User');
      const now = new Date();

      // Find users with expired sessions
      const users = await User.find({
        'sessions.expiresAt': { $lt: now }
      });

      let cleanedSessions = 0;

      for (const user of users) {
        const before = user.sessions.length;
        user.sessions = user.sessions.filter(s => s.expiresAt > now);
        
        if (before !== user.sessions.length) {
          await user.save();
          cleanedSessions += before - user.sessions.length;
        }
      }

      logger.info('Session cleanup completed', {
        usersProcessed: users.length,
        sessionsRemoved: cleanedSessions
      });

      return { cleanedSessions };
    } catch (error) {
      logger.error('Session cleanup error:', error);
      throw error;
    }
  }
};

/**
 * Session rate limiting
 */
const sessionRateLimit = (options = {}) => {
  const {
    maxSessions = 5,
    windowMs = 15 * 60 * 1000, // 15 minutes
    message = 'Too many login attempts'
  } = options;

  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    // Clean old entries
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }

    // Check rate limit
    const userAttempts = attempts.get(key) || { count: 0, firstAttempt: now };
    
    if (userAttempts.count >= maxSessions) {
      return next(new AppError(message, 429));
    }

    // Increment counter
    userAttempts.count++;
    attempts.set(key, userAttempts);

    next();
  };
};

// Helper functions
function generateFingerprint(req) {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.ip
  ];

  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');
}

module.exports = {
  createSessionMiddleware,
  sessionSecurity,
  sessionManager,
  sessionCleanup,
  sessionRateLimit
}; 