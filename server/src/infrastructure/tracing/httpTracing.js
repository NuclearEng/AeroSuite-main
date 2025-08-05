/**
 * httpTracing.js
 * 
 * Utilities for tracing HTTP client requests
 * Implements RF046 - Add distributed tracing
 */

const { getTracer, createSpan, opentelemetry } = require('./index');
const http = require('http');
const https = require('https');

/**
 * Create a traced HTTP/HTTPS request function
 * @param {Function} originalRequest - Original request function (http.request or https.request)
 * @param {string} protocol - Protocol ('http' or 'https')
 * @returns {Function} Traced request function
 */
function createTracedRequest(originalRequest, protocol) {
  const tracer = getTracer(`${protocol}-client`);
  
  return function tracedRequest(options, callback) {
    let url;
    let hostname;
    let path;
    let method;
    let port;
    
    // Parse options
    if (typeof options === 'string') {
      url = new URL(options);
      hostname = url.hostname;
      path = url.pathname + url.search;
      method = 'GET';
      port = url.port || (protocol === 'https' ? 443 : 80);
    } else if (options instanceof URL) {
      url = options;
      hostname = url.hostname;
      path = url.pathname + url.search;
      method = 'GET';
      port = url.port || (protocol === 'https' ? 443 : 80);
    } else {
      hostname = options.hostname || options.host || 'localhost';
      path = options.path || '/';
      method = options.method || 'GET';
      port = options.port || (protocol === 'https' ? 443 : 80);
      
      // Reconstruct URL
      url = new URL(`${protocol}://${hostname}:${port}${path}`);
    }
    
    // Create span
    return tracer.startActiveSpan(`${protocol}.request`, {
      attributes: {
        'http.url': url.toString(),
        'http.method': method,
        'http.host': hostname,
        'http.path': path,
        'http.scheme': protocol,
        'http.port': port,
        'net.peer.name': hostname,
        'net.peer.port': port
      }
    }, (span) => {
      // Create headers with trace context
      const headers = options.headers || {};
      
      // Inject trace context into headers
      const carrier = {};
      opentelemetry.propagation.inject(opentelemetry.context.active(), carrier);
      
      // Merge with existing headers
      options.headers = { ...headers, ...carrier };
      
      // Create request
      const req = originalRequest(options, (res) => {
        // Add response attributes
        span.setAttributes({
          'http.status_code': res.statusCode,
          'http.response_content_length': res.headers['content-length'],
          'http.response_content_type': res.headers['content-type']
        });
        
        // Set span status based on response status code
        if (res.statusCode >= 400) {
          span.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode} ${res.statusMessage}`
          });
        } else {
          span.setStatus({ code: opentelemetry.SpanStatusCode.OK });
        }
        
        // Call original callback
        if (callback) {
          callback(res);
        }
        
        // End span when response ends
        res.on('end', () => {
          span.end();
        });
      });
      
      // Handle request errors
      req.on('error', (error) => {
        span.recordException(error);
        span.setStatus({
          code: opentelemetry.SpanStatusCode.ERROR,
          message: error.message
        });
        span.end();
      });
      
      return req;
    });
  };
}

/**
 * Patch HTTP and HTTPS modules with tracing
 */
function patchHttpModules() {
  // Patch http.request
  const originalHttpRequest = http.request;
  http.request = createTracedRequest(originalHttpRequest, 'http');
  
  // Patch http.get
  http.get = function tracedGet(options, callback) {
    const req = http.request(options, callback);
    req.end();
    return req;
  };
  
  // Patch https.request
  const originalHttpsRequest = https.request;
  https.request = createTracedRequest(originalHttpsRequest, 'https');
  
  // Patch https.get
  https.get = function tracedGet(options, callback) {
    const req = https.request(options, callback);
    req.end();
    return req;
  };
}

/**
 * Create a traced fetch function
 * @param {Function} originalFetch - Original fetch function
 * @returns {Function} Traced fetch function
 */
function createTracedFetch(originalFetch) {
  const tracer = getTracer('fetch-client');
  
  return async function tracedFetch(input, init = {}) {
    let url;
    let method;
    
    // Parse input
    if (typeof input === 'string') {
      url = new URL(input);
      method = (init.method || 'GET').toUpperCase();
    } else if (input instanceof URL) {
      url = input;
      method = (init.method || 'GET').toUpperCase();
    } else if (input instanceof Request) {
      url = new URL(input.url);
      method = input.method;
    }
    
    return createSpan('fetch', {
      attributes: {
        'http.url': url.toString(),
        'http.method': method,
        'http.host': url.hostname,
        'http.path': url.pathname + url.search,
        'http.scheme': url.protocol.replace(':', ''),
        'net.peer.name': url.hostname,
        'net.peer.port': url.port || (url.protocol === 'https:' ? 443 : 80)
      }
    }, async (span) => {
      try {
        // Create headers with trace context
        const headers = new Headers(init.headers || {});
        
        // Inject trace context into headers
        const carrier = {};
        opentelemetry.propagation.inject(opentelemetry.context.active(), carrier);
        
        // Add trace context headers
        Object.keys(carrier).forEach(key => {
          headers.set(key, carrier[key]);
        });
        
        // Update init object with new headers
        init.headers = headers;
        
        // Make the fetch request
        const response = await originalFetch(input, init);
        
        // Add response attributes
        span.setAttributes({
          'http.status_code': response.status,
          'http.response_content_type': response.headers.get('content-type')
        });
        
        // Set span status based on response status code
        if (!response.ok) {
          span.setStatus({
            code: opentelemetry.SpanStatusCode.ERROR,
            message: `HTTP ${response.status} ${response.statusText}`
          });
        }
        
        return response;
      } catch (error) {
        span.recordException(error);
        span.setStatus({
          code: opentelemetry.SpanStatusCode.ERROR,
          message: error.message
        });
        throw error;
      }
    });
  };
}

/**
 * Patch global fetch with tracing if available
 */
function patchFetch() {
  if (typeof fetch === 'function') {
    const originalFetch = fetch;
    global.fetch = createTracedFetch(originalFetch);
  }
}

module.exports = {
  createTracedRequest,
  patchHttpModules,
  createTracedFetch,
  patchFetch
}; 