/**
 * dbTracing.js
 * 
 * Utilities for tracing database operations
 * Implements RF046 - Add distributed tracing
 */

const { getTracer, createSpan } = require('./index');

/**
 * Wrap a database operation with tracing
 * @param {string} operationName - Name of the database operation
 * @param {Object} details - Operation details
 * @param {Function} operation - Database operation to execute
 * @returns {Promise<any>} Result of the database operation
 */
async function traceDbOperation(operationName, details, operation) {
  return createSpan(`db.${operationName}`, {
    attributes: {
      'db.operation': operationName,
      'db.collection': details.collection,
      'db.query': JSON.stringify(details.query || {}),
      'db.statement': details.statement,
      ...details.attributes
    }
  }, async (span) => {
    return operation(span);
  });
}

/**
 * Create a MongoDB repository wrapper with tracing
 * @param {Object} repository - Original repository
 * @returns {Object} Repository with tracing
 */
function createTracedMongoRepository(repository) {
  const tracedRepository = {};
  const tracer = getTracer('mongodb');
  
  // Wrap each method with tracing
  Object.getOwnPropertyNames(Object.getPrototypeOf(repository))
    .filter(prop => typeof repository[prop] === 'function' && prop !== 'constructor')
    .forEach(method => {
      tracedRepository[method] = async function(...args) {
        const collection = repository.collectionName;
        
        return createSpan(`mongodb.${method}`, {
          attributes: {
            'db.system': 'mongodb',
            'db.operation': method,
            'db.collection': collection,
            'db.mongodb.args_length': args.length
          }
        }, async (span) => {
          try {
            // Add query details if first argument is an object (likely a query)
            if (args.length > 0 && typeof args[0] === 'object') {
              try {
                span.setAttributes({
                  'db.mongodb.query': JSON.stringify(args[0])
                });
              } catch (e) {
                // Ignore serialization errors
              }
            }
            
            const result = await repository[method].apply(repository, args);
            
            // Add result metadata
            if (result && typeof result === 'object') {
              if (Array.isArray(result)) {
                span.setAttributes({
                  'db.mongodb.result_count': result.length
                });
              } else if (result.modifiedCount !== undefined) {
                span.setAttributes({
                  'db.mongodb.modified_count': result.modifiedCount,
                  'db.mongodb.matched_count': result.matchedCount,
                  'db.mongodb.upserted_count': result.upsertedCount
                });
              }
            }
            
            return result;
          } catch (error) {
            span.recordException(error);
            throw error;
          }
        });
      };
    });
  
  return tracedRepository;
}

/**
 * Create a SQL repository wrapper with tracing
 * @param {Object} repository - Original repository
 * @returns {Object} Repository with tracing
 */
function createTracedSqlRepository(repository) {
  const tracedRepository = {};
  const tracer = getTracer('sql');
  
  // Wrap each method with tracing
  Object.getOwnPropertyNames(Object.getPrototypeOf(repository))
    .filter(prop => typeof repository[prop] === 'function' && prop !== 'constructor')
    .forEach(method => {
      tracedRepository[method] = async function(...args) {
        const table = repository.tableName;
        
        return createSpan(`sql.${method}`, {
          attributes: {
            'db.system': 'sql',
            'db.operation': method,
            'db.sql.table': table
          }
        }, async (span) => {
          try {
            // If this is a query method and has SQL
            if (args.length > 0 && typeof args[0] === 'string' && args[0].trim().toUpperCase().startsWith('SELECT')) {
              span.setAttributes({
                'db.statement': args[0],
                'db.operation_type': 'SELECT'
              });
            } else if (args.length > 0 && typeof args[0] === 'string') {
              // Try to determine operation type
              const sql = args[0].trim().toUpperCase();
              let operationType = 'UNKNOWN';
              
              if (sql.startsWith('INSERT')) operationType = 'INSERT';
              else if (sql.startsWith('UPDATE')) operationType = 'UPDATE';
              else if (sql.startsWith('DELETE')) operationType = 'DELETE';
              else if (sql.startsWith('CREATE')) operationType = 'CREATE';
              else if (sql.startsWith('ALTER')) operationType = 'ALTER';
              else if (sql.startsWith('DROP')) operationType = 'DROP';
              
              span.setAttributes({
                'db.statement': args[0],
                'db.operation_type': operationType
              });
            }
            
            const result = await repository[method].apply(repository, args);
            
            // Add result metadata for common result objects
            if (result && typeof result === 'object') {
              if (result.rowCount !== undefined) {
                span.setAttributes({
                  'db.sql.row_count': result.rowCount
                });
              } else if (result.affectedRows !== undefined) {
                span.setAttributes({
                  'db.sql.affected_rows': result.affectedRows
                });
              }
            }
            
            return result;
          } catch (error) {
            span.recordException(error);
            throw error;
          }
        });
      };
    });
  
  return tracedRepository;
}

module.exports = {
  traceDbOperation,
  createTracedMongoRepository,
  createTracedSqlRepository
}; 