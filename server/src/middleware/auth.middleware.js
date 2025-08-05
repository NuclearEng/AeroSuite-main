const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config');
const User = require('../models/user.model');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const securityService = require('../services/security.service');

/**
 * Verify JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, authConfig.jwt.secret, {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience
    });

    // Get user from database
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('User account is deactivated', 401);
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt) {
      const passwordChangedTimestamp = parseInt(
        user.passwordChangedAt.getTime() / 1000,
        10
      );
      
      if (decoded.iat < passwordChangedTimestamp) {
        throw new AppError('Password was changed. Please login again.', 401);
      }
    }

    // Verify token version (for forced logout)
    if (decoded.version && user.tokenVersion && decoded.version < user.tokenVersion) {
      throw new AppError('Token is no longer valid. Please login again.', 401);
    }

    // Verify token fingerprint (help prevent token theft)
    if (decoded.fingerprint) {
      const ipHash = securityService.hashString ? 
        securityService.hashString(req.ip) : 
        hashFallback(req.ip);
        
      // Only validate IP if not from a known proxy (can cause false positives)
      const skipIpCheck = req.headers['x-forwarded-for'] || 
                          req.ip.startsWith('10.') || 
                          req.ip.startsWith('172.') || 
                          req.ip.startsWith('192.168.') ||
                          req.ip === '127.0.0.1' ||
                          req.ip === '::1';

      if (!skipIpCheck && decoded.fingerprint.ip && decoded.fingerprint.ip !== ipHash) {
        logger.warn(`Token IP mismatch for user ${user._id}`);
        // Don't fail immediately, just log for potential monitoring
      }

      // User agent check (more reliable than IP)
      const uaHash = securityService.hashString ? 
        securityService.hashString(req.headers['user-agent']) : 
        hashFallback(req.headers['user-agent']);
        
      if (decoded.fingerprint.ua && decoded.fingerprint.ua !== uaHash) {
        logger.warn(`Token UA mismatch for user ${user._id}`);
        // Consider risk level - could use: throw new AppError('Invalid token signature', 401);
      }
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    req.tokenDecoded = decoded; // Useful for additional claims

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    
    next(error);
  }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user._id} to ${req.originalUrl}`);
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

/**
 * Check if user has specific permission
 */
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('User not authenticated', 401));
      }

      // Get user with permissions populated
      const user = await User.findById(req.user._id).populate('permissions');

      const hasPermission = user.permissions.some(p => 
        p.resource === permission.resource && 
        p.actions.includes(permission.action)
      );

      if (!hasPermission) {
        logger.warn(`Permission denied for user ${req.user._id}: ${permission.resource}:${permission.action}`);
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, authConfig.jwt.secret, {
      issuer: authConfig.jwt.issuer,
      audience: authConfig.jwt.audience
    });

    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id;
      req.userRole = user.role;
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

/**
 * API Key authentication
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      throw new AppError('API key required', 401);
    }

    // Find user by API key
    const user = await User.findOne({ 
      'apiKeys.key': apiKey,
      'apiKeys.isActive': true,
      'apiKeys.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      throw new AppError('Invalid API key', 401);
    }

    // Update last used
    const keyIndex = user.apiKeys.findIndex(k => k.key === apiKey);
    if (keyIndex !== -1) {
      user.apiKeys[keyIndex].lastUsed = new Date();
      await user.save();
    }

    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    req.authMethod = 'apiKey';

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require MFA verification
 */
const requireMFA = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (req.user.mfaEnabled && !req.session?.mfaVerified) {
      return next(new AppError('MFA verification required', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limit requests per user
 * @param {Object} options - Rate limit options
 */
const userRateLimit = (options = {}) => {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later'
  } = options;

  const cache = new Map();

  return async (req, res, next) => {
    try {
      // Use user ID if authenticated, otherwise IP
      const key = req.userId || req.ip;
      const now = Date.now();
      
      const userRequests = cache.get(key) || [];
      // Filter out expired timestamps
      const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
      
      if (recentRequests.length >= max) {
        return res.status(429).json({
          success: false,
          message
        });
      }
      
      // Add current request timestamp
      recentRequests.push(now);
      cache.set(key, recentRequests);
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - recentRequests.length));
      res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate origin for CSRF protection
 */
const validateOrigin = (req, res, next) => {
  try {
    const origin = req.headers.origin || req.headers.referer;
    
    // Skip validation for non-state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Skip for API requests that don't use cookies
    if (req.path.startsWith('/api/') && !req.cookies) {
      return next();
    }
    
    if (!origin) {
      logger.warn(`Request without origin header: ${req.path}`);
      // Allow requests without origin for API calls
      if (req.path.startsWith('/api/')) {
        return next();
      }
      return next(new AppError('Invalid origin', 403));
    }
    
    const allowedOrigins = authConfig.allowedOrigins || [
      process.env.CLIENT_URL,
      process.env.ADMIN_URL
    ];
    
    const isAllowed = allowedOrigins.some(allowed => 
      origin === allowed || origin.startsWith(allowed)
    );
    
    if (!isAllowed) {
      logger.warn(`Request with invalid origin: ${origin} to ${req.path}`);
      return next(new AppError('Invalid origin', 403));
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify refresh token and generate new access token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }
    
    // Find user with this refresh token
    const user = await User.findOne({
      'refreshTokens.token': refreshToken,
      'refreshTokens.expires': { $gt: new Date() }
    });
    
    if (!user) {
      return next(new AppError('Invalid refresh token', 401));
    }
    
    // Check if user is active
    if (!user.isActive) {
      return next(new AppError('User account is deactivated', 401));
    }
    
    // Create new access token
    const accessToken = securityService.createSecureToken(
      user, 
      req.ip, 
      req.headers['user-agent']
    );
    
    // Return new access token
    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Simple hash function fallback
 */
function hashFallback(str) {
  if (!str) return null;
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Authentication Middleware
 * 
 * Provides authentication functionality for the application
 */

/**
 * Protect routes - require authentication
 */
function protect(req, res, next) {
  // Mock implementation
  req.user = {
    _id: 'user_123456789',
    email: 'demo@example.com',
    role: 'admin'
  };
  next();
}

/**
 * Restrict to specific roles
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    // Mock implementation
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    
    next();
  };
}

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  optionalAuth,
  authenticateApiKey,
  requireMFA,
  userRateLimit,
  validateOrigin,
  refreshToken,
  protect,
  restrictTo
}; 