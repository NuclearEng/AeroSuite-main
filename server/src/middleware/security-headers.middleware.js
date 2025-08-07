/**
 * Security Headers Middleware
 * 
 * This middleware configures security headers for the application including:
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 * - Cross-Origin headers
 * - Cache-Control
 */

const helmet = require('helmet');
const config = require('../config');

/**
 * Get environment-specific CSP directives
 */
const getCspDirectives = () => {
  // Base CSP directives
  const directives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'strict-dynamic'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'blob:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    manifestSrc: ["'self'"],
    workerSrc: ["'self'", 'blob:'],
    upgradeInsecureRequests: [],
  };

  // Add environment-specific sources
  if (process.env.NODE_ENV === 'development') {
    // Allow websocket connections for hot reloading
    directives.connectSrc.push('ws:', 'wss:');
    // Allow inline scripts for development tools
    directives.scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
    directives.styleSrc.push("'unsafe-inline'");
  } else {
    // Production CDN sources
    const trustedCDNs = config.trustedCDNs || ['https://cdn.aerosuite.com'];
    directives.scriptSrc.push(...trustedCDNs);
    directives.styleSrc.push(...trustedCDNs);
    directives.imgSrc.push(...trustedCDNs);
    directives.connectSrc.push(...trustedCDNs);
    directives.fontSrc.push(...trustedCDNs);
    
    // Add nonce support for CSP in production
    directives.scriptSrc.push((req, res) => {
      const nonce = Buffer.from(Math.random().toString()).toString('base64');
      res.locals.cspNonce = nonce;
      return `'nonce-${nonce}'`;
    });
  }

  return directives;
};

/**
 * Configure security headers middleware
 */
const securityHeaders = () => {
  return [
    // Basic Helmet configuration
    helmet({
      contentSecurityPolicy: false, // We'll configure this separately
      crossOriginEmbedderPolicy: { policy: 'require-corp' },
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      originAgentCluster: true
    }),
    
    // Content Security Policy
    helmet.contentSecurityPolicy({
      directives: getCspDirectives(),
      reportOnly: process.env.CSP_REPORT_ONLY === 'true',
    }),
    
    // HTTP Strict Transport Security
    helmet.hsts({
      maxAge: 15552000, // 180 days in seconds
      includeSubDomains: true,
      preload: true
    }),
    
    // X-Frame-Options
    helmet.frameguard({ action: 'deny' }),
    
    // X-Content-Type-Options
    helmet.noSniff(),
    
    // X-XSS-Protection
    helmet.xssFilter(),
    
    // Referrer-Policy
    helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }),
    
    // Permissions-Policy (formerly Feature-Policy)
    (req, res, next) => {
      res.setHeader('Permissions-Policy', 
        'camera=(), microphone=(), geolocation=(self), interest-cohort=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()');
      next();
    },
    
    // Report-To and NEL (Network Error Logging) headers for monitoring
    (req, res, next) => {
      if (process.env.NODE_ENV === 'production' && config.cspReportUri) {
        const reportToHeader = {
          group: 'csp-endpoint',
          max_age: 10886400,
          endpoints: [{ url: config.cspReportUri }]
        };
        
        res.setHeader('Report-To', JSON.stringify(reportToHeader));
        
        res.setHeader('NEL', JSON.stringify({
          report_to: 'csp-endpoint',
          max_age: 31536000,
          include_subdomains: true,
          success_fraction: 0.1,
          failure_fraction: 1.0
        }));
      }
      next();
    },
    
    // Cache control for non-static resources
    (req, res, next) => {
      // Skip for static files which should have their own cache headers
      if (!req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        res.setHeader('Pragma', 'no-cache');
      }
      next();
    },
    
    // Clear-Site-Data header for logout routes
    (req, res, next) => {
      if (req.path === '/api/auth/logout' || req.path === '/api/auth/revoke') {
        res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
      }
      next();
    }
  ];
};

module.exports = securityHeaders; 