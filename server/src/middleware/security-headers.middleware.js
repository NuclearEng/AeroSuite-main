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
 * - Feature-Policy/Permissions-Policy
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
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: [],
  };

  // Add environment-specific sources
  if (process.env.NODE_ENV === 'development') {
    // Allow websocket connections for hot reloading
    directives.connectSrc.push('ws:');
    // Allow inline scripts for development tools
    directives.scriptSrc.push("'unsafe-inline'");
    directives.styleSrc.push("'unsafe-inline'");
  } else {
    // Production CDN sources
    const trustedCDNs = config.trustedCDNs || ['https://cdn.aerosuite.com'];
    directives.scriptSrc.push(...trustedCDNs);
    directives.styleSrc.push(...trustedCDNs);
    directives.imgSrc.push(...trustedCDNs);
    directives.connectSrc.push(...trustedCDNs);
    directives.fontSrc.push(...trustedCDNs);
  }

  return directives;
};

/**
 * Configure security headers middleware
 */
const securityHeaders = () => {
  return [
    // Basic Helmet configuration
    helmet(),
    
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
        'camera=(), microphone=(), geolocation=(self), interest-cohort=()');
      next();
    },
    
    // Report-To and NEL (Network Error Logging) headers for monitoring
    (req, res, next) => {
      if (process.env.NODE_ENV === 'production' && config.cspReportUri) {
        res.setHeader('Report-To', JSON.stringify({
          group: 'csp-endpoint',
          max_age: 10886400,
          endpoints: [{ url: config.cspReportUri }]
        }));
        
        res.setHeader('NEL', JSON.stringify({
          report_to: 'csp-endpoint',
          max_age: 31536000,
          include_subdomains: true
        }));
      }
      next();
    }
  ];
};

module.exports = securityHeaders; 