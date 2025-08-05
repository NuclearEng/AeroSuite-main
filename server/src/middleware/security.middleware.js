// Task: SEC019 - Security Headers Implementation
const helmet = require('helmet');
const crypto = require('crypto');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Generate nonce for CSP
 */
const generateNonce = () => crypto.randomBytes(16).toString('base64');

/**
 * Security headers middleware configuration
 */
const securityHeaders = (options = {}) => {
  const {
    enableCSP = true,
    enableHSTS = true,
    enableXFrame = true,
    enableXContent = true,
    enableReferrer = true,
    enablePermissionsPolicy = true,
    cspDirectives = {},
    reportUri = process.env.CSP_REPORT_URI,
    isDevelopment = process.env.NODE_ENV === 'development'
  } = options;

  const middlewares = [];

  // Content Security Policy
  if (enableCSP) {
    middlewares.push((req, res, next) => {
      // Generate nonce for inline scripts
      res.locals.nonce = generateNonce();
      next();
    });

    const defaultDirectives = {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.nonce}'`,
        isDevelopment ? "'unsafe-eval'" : null,
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com'
      ].filter(Boolean),
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // For styled-components
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://*.cloudinary.com',
        'https://*.amazonaws.com'
      ],
      connectSrc: [
        "'self'",
        'wss:',
        isDevelopment ? 'ws://localhost:*' : null,
        process.env.API_URL,
        'https://api.stripe.com',
        'https://*.sentry.io'
      ].filter(Boolean),
      mediaSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      childSrc: ["'self'", 'blob:'],
      workerSrc: ["'self'", 'blob:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: !isDevelopment ? [] : null,
      blockAllMixedContent: !isDevelopment ? [] : null
    };

    // Merge with custom directives
    const directives = {
      ...defaultDirectives,
      ...cspDirectives
    };

    // Add report URI if provided
    if (reportUri) {
      directives.reportUri = [reportUri];
    }

    middlewares.push(
      helmet.contentSecurityPolicy({
        directives,
        reportOnly: isDevelopment
      })
    );
  }

  // Strict Transport Security
  if (enableHSTS && !isDevelopment) {
    middlewares.push(
      helmet.hsts({
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      })
    );
  }

  // X-Frame-Options
  if (enableXFrame) {
    middlewares.push(helmet.frameguard({ action: 'deny' }));
  }

  // X-Content-Type-Options
  if (enableXContent) {
    middlewares.push(helmet.noSniff());
  }

  // Referrer Policy
  if (enableReferrer) {
    middlewares.push(
      helmet.referrerPolicy({
        policy: 'strict-origin-when-cross-origin'
      })
    );
  }

  // Permissions Policy (Feature Policy)
  if (enablePermissionsPolicy) {
    middlewares.push(
      helmet.permittedCrossDomainPolicies({ permittedPolicies: 'none' })
    );
    
    middlewares.push((req, res, next) => {
      res.setHeader(
        'Permissions-Policy',
        [
          'accelerometer=()',
          'ambient-light-sensor=()',
          'autoplay=()',
          'battery=()',
          'camera=()',
          'cross-origin-isolated=(self)',
          'display-capture=()',
          'document-domain=()',
          'encrypted-media=()',
          'execution-while-not-rendered=()',
          'execution-while-out-of-viewport=()',
          'fullscreen=(self)',
          'geolocation=()',
          'gyroscope=()',
          'keyboard-map=()',
          'magnetometer=()',
          'microphone=()',
          'midi=()',
          'navigation-override=()',
          'payment=()',
          'picture-in-picture=()',
          'publickey-credentials-get=()',
          'screen-wake-lock=()',
          'sync-xhr=()',
          'usb=()',
          'web-share=()',
          'xr-spatial-tracking=()'
        ].join(', ')
      );
      next();
    });
  }

  // Additional security headers
  middlewares.push((req, res, next) => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    
    // Add custom security headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    
    // Cache control for security
    if (req.url.includes('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    
    next();
  });

  // CORS headers (if not handled elsewhere)
  middlewares.push((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
      res.setHeader('Vary', 'Origin');
    }
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
    } else {
      next();
    }
  });

  // Combine all middlewares
  return (req, res, next) => {
    const executeMiddlewares = (index = 0) => {
      if (index === middlewares.length) {
        return next();
      }
      
      middlewares[index](req, res, (err) => {
        if (err) return next(err);
        executeMiddlewares(index + 1);
      });
    };
    
    executeMiddlewares();
  };
};

/**
 * CSRF Protection
 */
const csrfProtection = (options = {}) => {
  const {
    excludePaths = ['/api/webhooks', '/api/health'],
    tokenLength = 32,
    cookieName = 'XSRF-TOKEN',
    headerName = 'X-CSRF-Token',
    paramName = '_csrf'
  } = options;

  return (req, res, next) => {
    // Skip CSRF for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Generate token for forms
      if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(tokenLength).toString('hex');
      }
      
      // Set CSRF cookie for SPA
      res.cookie(cookieName, req.session.csrfToken, {
        httpOnly: false, // Allow JS to read for AJAX requests
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // Make token available to templates
      res.locals.csrfToken = req.session.csrfToken;
      
      return next();
    }

    // Verify CSRF token for state-changing methods
    const token = req.headers[headerName.toLowerCase()] || 
                  req.body[paramName] || 
                  req.query[paramName];

    if (!token || token !== req.session.csrfToken) {
      logger.warn('CSRF token validation failed', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      
      return next(new AppError('Invalid CSRF token', 403));
    }

    next();
  };
};

/**
 * Request sanitization
 */
const sanitizeRequest = (options = {}) => {
  const {
    maxUrlLength = 2000,
    maxBodyDepth = 5,
    allowedContentTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain'
    ]
  } = options;

  return (req, res, next) => {
    // Check URL length
    if (req.originalUrl.length > maxUrlLength) {
      return next(new AppError('URL too long', 414));
    }

    // Validate content type for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'];
      
      if (contentType && !allowedContentTypes.some(type => contentType.includes(type))) {
        return next(new AppError('Unsupported content type', 415));
      }
    }

    // Sanitize headers
    const dangerousHeaders = ['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto'];
    dangerousHeaders.forEach(header => {
      if (req.headers[header] && !req.app.get('trust proxy')) {
        delete req.headers[header];
      }
    });

    // Check JSON depth
    if (req.body && typeof req.body === 'object') {
      const checkDepth = (obj, currentDepth = 0) => {
        if (currentDepth > maxBodyDepth) {
          throw new AppError('Request body too deep', 400);
        }
        
        for (const key in obj) {
          if (obj[key] && typeof obj[key] === 'object') {
            checkDepth(obj[key], currentDepth + 1);
          }
        }
      };

      try {
        checkDepth(req.body);
      } catch (error) {
        return next(error);
      }
    }

    next();
  };
};

/**
 * Security monitoring
 */
const securityMonitoring = () => {
  return (req, res, next) => {
    // Log security-relevant events
    const securityEvent = {
      timestamp: new Date(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      headers: {
        origin: req.headers.origin,
        referer: req.headers.referer,
        contentType: req.headers['content-type']
      }
    };

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\.\//g, // Directory traversal
      /<script[^>]*>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/gi, // Event handlers
      /union.*select/gi, // SQL injection
      /exec\s*\(/gi, // Command execution
      /eval\s*\(/gi // Eval execution
    ];

    const checkSuspicious = (str) => {
      if (typeof str !== 'string') return false;
      return suspiciousPatterns.some(pattern => pattern.test(str));
    };

    // Check URL
    if (checkSuspicious(req.originalUrl)) {
      logger.warn('Suspicious URL pattern detected', securityEvent);
      return next(new AppError('Invalid request', 400));
    }

    // Check headers
    for (const [key, value] of Object.entries(req.headers)) {
      if (checkSuspicious(value)) {
        logger.warn('Suspicious header detected', { ...securityEvent, header: key });
        return next(new AppError('Invalid request headers', 400));
      }
    }

    // Log high-risk operations
    const highRiskPaths = [
      '/api/auth/reset-password',
      '/api/users/delete',
      '/api/permissions',
      '/api/settings',
      '/api/export'
    ];

    if (highRiskPaths.some(path => req.path.startsWith(path))) {
      logger.info('High-risk operation accessed', securityEvent);
    }

    next();
  };
};

/**
 * API security middleware
 */
const apiSecurity = () => {
  return [
    // Prevent parameter pollution
    (req, res, next) => {
      // Clean up duplicate parameters
      for (const key in req.query) {
        if (Array.isArray(req.query[key])) {
          req.query[key] = req.query[key][req.query[key].length - 1];
        }
      }
      next();
    },
    
    // API versioning enforcement
    (req, res, next) => {
      if (req.path.startsWith('/api/') && !req.path.match(/\/api\/v\d+\//)) {
        return next(new AppError('API version required', 400));
      }
      next();
    },
    
    // Request ID injection
    (req, res, next) => {
      req.id = req.headers['x-request-id'] || crypto.randomUUID();
      res.setHeader('X-Request-ID', req.id);
      next();
    }
  ];
};

module.exports = {
  securityHeaders,
  csrfProtection,
  sanitizeRequest,
  securityMonitoring,
  apiSecurity
}; 