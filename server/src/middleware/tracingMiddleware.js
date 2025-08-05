/**
 * tracingMiddleware.js
 * 
 * Express middleware for distributed tracing
 * Implements RF046 - Add distributed tracing
 */

const { opentelemetry, getCurrentSpan, addAttributes } = require('../infrastructure/tracing');
const { SpanStatusCode } = opentelemetry.trace;
const logger = require('../infrastructure/logger');

/**
 * Create middleware for distributed tracing
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function createTracingMiddleware(options = {}) {
  return (req, res, next) => {
    const span = getCurrentSpan();
    
    // If no span is active, skip middleware
    if (!span) {
      return next();
    }
    
    // Add request attributes to span
    const requestAttributes = {
      'http.route': req.route ? req.route.path : undefined,
      'http.request.size': req.headers['content-length'],
      'http.request_id': req.headers['x-request-id'] || req.id,
      'http.user_agent': req.headers['user-agent'],
      'http.referer': req.headers.referer,
      'http.client_ip': req.ip || req.connection.remoteAddress,
      'enduser.id': req.user ? req.user.id : undefined,
      'enduser.role': req.user ? req.user.role : undefined
    };
    
    // Filter out undefined attributes
    Object.keys(requestAttributes).forEach(key => {
      if (requestAttributes[key] === undefined) {
        delete requestAttributes[key];
      }
    });
    
    // Add attributes to span
    addAttributes(requestAttributes);
    
    // Store original end method
    const originalEnd = res.end;
    
    // Override end method
    res.end = function(...args) {
      // Add response attributes to span
      const responseAttributes = {
        'http.status_code': res.statusCode,
        'http.response.size': res.getHeader('content-length')
      };
      
      // Add attributes to span
      addAttributes(responseAttributes);
      
      // Set span status based on response status code
      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode} ${res.statusMessage}`
        });
        
        // Add error details for 5xx errors
        if (res.statusCode >= 500) {
          span.recordException({
            name: 'ServerError',
            message: `HTTP ${res.statusCode} ${res.statusMessage}`,
            stack: new Error().stack
          });
        }
      }
      
      // Call original end method
      originalEnd.apply(res, args);
    };
    
    // Continue to next middleware
    next();
  };
}

/**
 * Create middleware for tracing specific routes or operations
 * @param {string} operationName - Name of the operation
 * @param {Object} options - Span options
 * @returns {Function} Express middleware
 */
function traceRoute(operationName, options = {}) {
  const tracer = opentelemetry.trace.getTracer('express-routes');
  
  return (req, res, next) => {
    // Get current context
    const currentContext = opentelemetry.context.active();
    
    // Get parent span from context if available
    const parentSpan = opentelemetry.trace.getSpan(currentContext);
    
    // Create span options
    const spanOptions = {
      ...options,
      attributes: {
        'operation.name': operationName,
        'http.method': req.method,
        'http.url': req.originalUrl,
        'http.route': req.route ? req.route.path : undefined,
        ...(options.attributes || {})
      }
    };
    
    // Start a new span
    const span = tracer.startSpan(operationName, spanOptions, currentContext);
    
    // Store span in request for later use
    req.span = span;
    
    // Execute request in the context of the new span
    opentelemetry.context.with(
      opentelemetry.trace.setSpan(currentContext, span),
      () => {
        // Store original end method
        const originalEnd = res.end;
        
        // Override end method to end span
        res.end = function(...args) {
          // Add response attributes
          span.setAttributes({
            'http.status_code': res.statusCode,
            'http.response.size': res.getHeader('content-length')
          });
          
          // Set span status based on response status code
          if (res.statusCode >= 400) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP ${res.statusCode} ${res.statusMessage}`
            });
          }
          
          // End span
          span.end();
          
          // Call original end method
          originalEnd.apply(res, args);
        };
        
        // Continue to next middleware
        next();
      }
    );
  };
}

/**
 * Create middleware for error tracing
 * @returns {Function} Express error middleware
 */
function traceErrors() {
  return (err, req, res, next) => {
    const span = getCurrentSpan();
    
    if (span) {
      // Add error details to span
      span.recordException(err);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err.message
      });
      
      // Add error attributes
      span.setAttributes({
        'error.type': err.name,
        'error.message': err.message,
        'error.stack': err.stack
      });
    }
    
    // Continue to next error handler
    next(err);
  };
}

module.exports = {
  createTracingMiddleware,
  traceRoute,
  traceErrors
}; 