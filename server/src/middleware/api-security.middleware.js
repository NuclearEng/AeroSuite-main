/**
 * API Security Middleware
 * 
 * Provides security features for API endpoints
 */

const jwt = require('jsonwebtoken');
const rateLimitLib = require('express-rate-limit');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

/**
 * Basic endpoint hardening: enforce JSON for write methods and add security headers
 */
function apiEndpointSecurity(req, res, next) {
  // Only enforce content-type for state-changing requests
  const method = req.method.toUpperCase();
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Unsupported Media Type. Use application/json',
        code: 'UNSUPPORTED_MEDIA_TYPE'
      });
    }
  }

  // Minimal clickjacking and referrer policy if not set upstream
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}

/**
 * Very lightweight SQL injection pattern guard.
 * Blocks requests containing obvious SQL meta in string values.
 */
function sqlInjectionProtection(req, res, next) {
  const suspect = /(?:')|(;\s*--)|(--\s)|\/\*|\*\/|\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|MERGE)\b/i;
  const scan = (obj) => {
    if (!obj) return false;
    if (typeof obj === 'string') return suspect.test(obj);
    if (Array.isArray(obj)) return obj.some(scan);
    if (typeof obj === 'object') return Object.values(obj).some(scan);
    return false;
  };

  if (scan(req.query) || scan(req.params) || scan(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Potentially malicious input detected',
      code: 'INVALID_INPUT'
    });
  }
  next();
}

/**
 * Sanitize trivial input: trim strings and limit length
 */
function protectSensitiveData(req, _res, next) {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        // Limit to 10k chars to avoid abuse
        obj[key] = trimmed.length > 10000 ? trimmed.slice(0, 10000) : trimmed;
      } else if (typeof value === 'object') {
        sanitize(value);
      }
    }
  };
  sanitize(req.body);
  next();
}

/**
 * Create rate limiter middleware using express-rate-limit
 */
function createRateLimiter(options = {}) {
  const windowMs = Number(options.windowMs || 15 * 60 * 1000);
  const max = Number(options.max || 100);
  const message = options.message || { success: false, message: 'Too many requests, please try again later' };
  return rateLimitLib.rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message
  });
}

/**
 * API key authentication middleware
 * Accepts keys in header X-API-Key; multiple keys can be configured comma-separated in API_KEYS
 */
function apiKeyAuth(req, res, next) {
  const presented = req.headers['x-api-key'];
  if (!presented) {
    return res.status(401).json({ success: false, message: 'API key required', code: 'API_KEY_REQUIRED' });
  }
  const configured = (process.env.API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean);
  if (configured.length === 0) {
    // If no keys configured, deny in production, allow in non-production for local/dev
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ success: false, message: 'API key not configured', code: 'API_KEY_NOT_CONFIGURED' });
    }
    return next();
  }

  const safeCompare = (a, b) => {
    const aBuf = Buffer.from(String(a));
    const bBuf = Buffer.from(String(b));
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
  };

  const match = configured.some((k) => safeCompare(presented, k));
  if (!match) {
    return res.status(403).json({ success: false, message: 'Invalid API key', code: 'INVALID_API_KEY' });
  }
  next();
}

/**
 * Simple schema validator for body/params/query
 * Supports: type (string|number|boolean|object|array), required, pattern (RegExp), enum (array)
 */
function buildValidator(source, schema) {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
    const errors = {};
    for (const [field, rules] of Object.entries(schema || {})) {
      const value = data[field];
      const isRequired = !!rules.required;
      if (value === undefined || value === null || value === '') {
        if (isRequired) errors[field] = `${field} is required`;
        continue;
      }
      // Type check
      if (rules.type) {
        const expected = String(rules.type);
        const actual = Array.isArray(value) ? 'array' : typeof value;
        if (expected !== actual) {
          errors[field] = `${field} must be of type ${expected}`;
          continue;
        }
      }
      // Pattern check
      if (rules.pattern && typeof value === 'string') {
        const re = rules.pattern instanceof RegExp ? rules.pattern : new RegExp(rules.pattern);
        if (!re.test(value)) {
          errors[field] = `${field} has invalid format`;
          continue;
        }
      }
      // Enum check
      if (Array.isArray(rules.enum) && !rules.enum.includes(value)) {
        errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
      }
    }
    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Validation error', code: 'VALIDATION_ERROR', errors });
    }
    next();
  };
}

const validateRequest = {
  body: (schema) => buildValidator('body', schema),
  params: (schema) => buildValidator('params', schema),
  query: (schema) => buildValidator('query', schema)
};

/**
 * JWT security middleware: verifies Bearer token and attaches decoded payload to req.user
 */
function secureJwt(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    let token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    // Fallback to cookie if Authorization header not present
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token missing', code: 'UNAUTHORIZED' });
    }
    const secret = process.env.JWT_SECRET || process.env.JWT_PRIVATE_KEY;
    if (!secret) {
      // Fail closed in production
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ success: false, message: 'Server misconfiguration', code: 'JWT_NOT_CONFIGURED' });
      }
    }
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    logger && logger.warn && logger.warn('JWT verification failed', { error: String(err && err.message) });
    return res.status(401).json({ success: false, message: 'Invalid or expired token', code: 'UNAUTHORIZED' });
  }
}

module.exports = {
  apiEndpointSecurity,
  sqlInjectionProtection,
  protectSensitiveData,
  createRateLimiter,
  apiKeyAuth,
  validateRequest,
  secureJwt
};