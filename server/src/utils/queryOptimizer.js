/**
 * QueryOptimizer.js
 * 
 * Utility class for optimizing MongoDB queries
 * Implements RF031 - Implement query optimization
 */

const mongoose = require('mongoose');
const logger = require('../infrastructure/logger');

class QueryOptimizer {
  /**
   * Optimize a query by adding projection and explaining the query plan
   * @param {Object} model - Mongoose model
   * @param {Object} query - Query object
   * @param {Object} options - Query options
   * @param {Array} fields - Fields to include in projection
   * @returns {Object} Optimized query
   */
  static optimizeQuery(model, query, options = {}, fields = []) {
    // Create a copy of the query to avoid modifying the original
    const optimizedQuery = { ...query };
    const optimizedOptions = { ...options };
    
    // Add projection if fields are specified
    if (fields && fields.length > 0) {
      optimizedOptions.projection = fields.reduce((projection, field) => {
        projection[field] = 1;
        return projection;
      }, {});
    }
    
    // Ensure pagination is applied
    if (!optimizedOptions.limit) {
      optimizedOptions.limit = 100; // Default limit
    }
    
    // Log the optimized query for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Optimized query:', {
        collection: model.collection.name,
        query: optimizedQuery,
        options: optimizedOptions
      });
    }
    
    return { query: optimizedQuery, options: optimizedOptions };
  }
  
  /**
   * Explain a query to analyze its performance
   * @param {Object} model - Mongoose model
   * @param {Object} query - Query object
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query explanation
   */
  static async explainQuery(model, query, options = {}) {
    try {
      const explanation = await model.find(query, null, options).explain('executionStats');
      
      // Extract useful information from the explanation
      const summary = {
        executionTimeMillis: explanation.executionStats.executionTimeMillis,
        totalDocsExamined: explanation.executionStats.totalDocsExamined,
        totalKeysExamined: explanation.executionStats.totalKeysExamined,
        nReturned: explanation.executionStats.nReturned,
        indexesUsed: [],
        isOptimal: false
      };
      
      // Check if indexes were used
      if (explanation.queryPlanner.winningPlan.inputStage) {
        if (explanation.queryPlanner.winningPlan.inputStage.stage === 'IXSCAN') {
          summary.indexesUsed.push(explanation.queryPlanner.winningPlan.inputStage.indexName);
          summary.isOptimal = summary.totalDocsExamined === summary.nReturned;
        }
      }
      
      // Log query performance issues
      if (!summary.isOptimal) {
        const ratio = summary.totalDocsExamined / (summary.nReturned || 1);
        if (ratio > 10) {
          logger.warn(`Inefficient query in ${model.collection.name}: examined ${summary.totalDocsExamined} docs to return ${summary.nReturned} (ratio: ${ratio.toFixed(2)})`);
        }
      }
      
      return summary;
    } catch (error) {
      logger.error('Failed to explain query:', error);
      return null;
    }
  }
  
  /**
   * Get suggested indexes for a query
   * @param {Object} query - Query object
   * @returns {Array<Object>} Suggested indexes
   */
  static getSuggestedIndexes(query) {
    const suggestedIndexes = [];
    
    // Extract fields from query
    const fields = this.extractQueryFields(query);
    
    if (fields.length === 0) {
      return suggestedIndexes;
    }
    
    // Suggest single-field indexes for each field
    fields.forEach(field => {
      suggestedIndexes.push({
        fields: { [field]: 1 },
        options: { background: true }
      });
    });
    
    // Suggest compound index if there are multiple fields
    if (fields.length > 1) {
      const compoundIndex = fields.reduce((index, field) => {
        index[field] = 1;
        return index;
      }, {});
      
      suggestedIndexes.push({
        fields: compoundIndex,
        options: { background: true }
      });
    }
    
    return suggestedIndexes;
  }
  
  /**
   * Extract fields from a query object
   * @param {Object} query - Query object
   * @returns {Array<string>} Array of field names
   */
  static extractQueryFields(query) {
    const fields = [];
    
    if (!query || typeof query !== 'object') {
      return fields;
    }
    
    // Extract fields from query object
    for (const [key, value] of Object.entries(query)) {
      // Skip special operators
      if (key.startsWith('$')) {
        if (key === '$and' || key === '$or') {
          // Handle logical operators
          if (Array.isArray(value)) {
            value.forEach(subQuery => {
              fields.push(...this.extractQueryFields(subQuery));
            });
          }
        }
        continue;
      }
      
      // Add field to list
      if (!key.includes('$')) {
        fields.push(key);
      }
      
      // Check if value is an object with operators
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Skip if it's a nested query
        if (!Object.keys(value).some(k => k.startsWith('$'))) {
          // Extract fields from nested object
          Object.keys(value).forEach(nestedKey => {
            fields.push(`${key}.${nestedKey}`);
          });
        }
      }
    }
    
    return [...new Set(fields)]; // Remove duplicates
  }
  
  /**
   * Optimize a find query
   * @param {Object} model - Mongoose model
   * @param {Object} query - Query object
   * @param {Object} options - Query options
   * @param {Array} fields - Fields to include in projection
   * @returns {Promise<Array>} Query results
   */
  static async optimizedFind(model, query, options = {}, fields = []) {
    const { query: optimizedQuery, options: optimizedOptions } = this.optimizeQuery(model, query, options, fields);
    
    try {
      return await model.find(optimizedQuery, null, optimizedOptions);
    } catch (error) {
      logger.error('Error in optimizedFind:', error);
      throw error;
    }
  }
  
  /**
   * Optimize an aggregate query
   * @param {Object} model - Mongoose model
   * @param {Array} pipeline - Aggregation pipeline
   * @returns {Promise<Array>} Aggregation results
   */
  static async optimizedAggregate(model, pipeline) {
    try {
      // Add $limit stage if not present
      let haslimit = false;
      for (const stage of pipeline) {
        if (stage.$limit) {
          haslimit = true;
          break;
        }
      }
      
      if (!haslimit) {
        pipeline.push({ $limit: 1000 }); // Default limit
      }
      
      // Log the pipeline in development
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Optimized aggregate pipeline:', {
          collection: model.collection.name,
          pipeline
        });
      }
      
      return await model.aggregate(pipeline);
    } catch (error) {
      logger.error('Error in optimizedAggregate:', error);
      throw error;
    }
  }
  
  /**
   * Optimize a findOne query
   * @param {Object} model - Mongoose model
   * @param {Object} query - Query object
   * @param {Array} fields - Fields to include in projection
   * @returns {Promise<Object>} Query result
   */
  static async optimizedFindOne(model, query, fields = []) {
    const projection = fields.length > 0 ? fields.reduce((proj, field) => {
      proj[field] = 1;
      return proj;
    }, {}) : null;
    
    try {
      return await model.findOne(query, projection);
    } catch (error) {
      logger.error('Error in optimizedFindOne:', error);
      throw error;
    }
  }
  
  /**
   * Optimize a findById query
   * @param {Object} model - Mongoose model
   * @param {string} id - Document ID
   * @param {Array} fields - Fields to include in projection
   * @returns {Promise<Object>} Query result
   */
  static async optimizedFindById(model, id, fields = []) {
    const projection = fields.length > 0 ? fields.reduce((proj, field) => {
      proj[field] = 1;
      return proj;
    }, {}) : null;
    
    try {
      return await model.findById(id, projection);
    } catch (error) {
      logger.error('Error in optimizedFindById:', error);
      throw error;
    }
  }
  
  /**
   * Optimize a count query
   * @param {Object} model - Mongoose model
   * @param {Object} query - Query object
   * @returns {Promise<number>} Count result
   */
  static async optimizedCount(model, query) {
    try {
      return await model.countDocuments(query);
    } catch (error) {
      logger.error('Error in optimizedCount:', error);
      throw error;
    }
  }
}

module.exports = QueryOptimizer; 