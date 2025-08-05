/**
 * serviceTracing.js
 * 
 * Utilities for tracing service operations
 * Implements RF046 - Add distributed tracing
 */

const { getTracer, createSpan } = require('./index');

/**
 * Create a service wrapper with tracing
 * @param {Object} service - Original service
 * @param {string} serviceName - Name of the service
 * @returns {Object} Service with tracing
 */
function createTracedService(service, serviceName) {
  const tracedService = {};
  const tracer = getTracer(serviceName);
  
  // Wrap each method with tracing
  Object.getOwnPropertyNames(Object.getPrototypeOf(service))
    .filter(prop => typeof service[prop] === 'function' && prop !== 'constructor')
    .forEach(method => {
      tracedService[method] = async function(...args) {
        return createSpan(`${serviceName}.${method}`, {
          attributes: {
            'service.name': serviceName,
            'service.method': method,
            'service.args_count': args.length
          }
        }, async (span) => {
          try {
            // Add argument metadata
            if (args.length > 0) {
              // Try to safely extract IDs or other identifiers from first argument
              if (typeof args[0] === 'object' && args[0] !== null) {
                const safeArg = {};
                
                // Extract only id fields to avoid logging sensitive data
                if (args[0].id) safeArg.id = args[0].id;
                if (args[0]._id) safeArg._id = args[0]._id.toString();
                if (args[0].userId) safeArg.userId = args[0].userId;
                if (args[0].entityId) safeArg.entityId = args[0].entityId;
                
                span.setAttributes({
                  'service.arg': JSON.stringify(safeArg)
                });
              } else if (typeof args[0] === 'string') {
                // If first arg is a string, it's often an ID
                span.setAttributes({
                  'service.entity_id': args[0]
                });
              }
            }
            
            const result = await service[method].apply(service, args);
            
            // Add result metadata (carefully to avoid huge objects)
            if (result) {
              if (Array.isArray(result)) {
                span.setAttributes({
                  'service.result_count': result.length
                });
              } else if (typeof result === 'object') {
                // Only log if result has an ID
                if (result.id || result._id) {
                  span.setAttributes({
                    'service.result_id': result.id || (result._id ? result._id.toString() : undefined)
                  });
                }
              }
            }
            
            return result;
          } catch (error) {
            span.recordException(error);
            span.setAttributes({
              'error.type': error.name,
              'error.message': error.message
            });
            throw error;
          }
        });
      };
    });
  
  return tracedService;
}

/**
 * Wrap a service method with tracing
 * @param {string} serviceName - Name of the service
 * @param {string} methodName - Name of the method
 * @param {Function} method - Method to wrap
 * @returns {Function} Wrapped method with tracing
 */
function traceServiceMethod(serviceName, methodName, method) {
  const tracer = getTracer(serviceName);
  
  return async function(...args) {
    return createSpan(`${serviceName}.${methodName}`, {
      attributes: {
        'service.name': serviceName,
        'service.method': methodName
      }
    }, async (span) => {
      try {
        return await method.apply(this, args);
      } catch (error) {
        span.recordException(error);
        throw error;
      }
    });
  };
}

/**
 * Create a decorator for tracing class methods
 * @param {string} serviceName - Name of the service
 * @returns {Function} Decorator function
 */
function traceMethod(serviceName) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    const tracer = getTracer(serviceName);
    
    descriptor.value = async function(...args) {
      return createSpan(`${serviceName}.${propertyKey}`, {
        attributes: {
          'service.name': serviceName,
          'service.method': propertyKey
        }
      }, async (span) => {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          span.recordException(error);
          throw error;
        }
      });
    };
    
    return descriptor;
  };
}

module.exports = {
  createTracedService,
  traceServiceMethod,
  traceMethod
}; 