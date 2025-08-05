/**
 * optimized-repository.js
 * 
 * Example of using QueryOptimizer in a repository
 * Part of RF031 - Implement query optimization
 */

const Repository = require('../core/Repository');
const mongoose = require('mongoose');
const QueryOptimizer = require('../utils/QueryOptimizer');

/**
 * Example of an optimized repository using the QueryOptimizer
 */
class OptimizedRepository extends Repository {
  constructor(model) {
    super();
    this.model = model;
  }
  
  /**
   * Find a document by ID with optimized query
   * @param {string} id - Document ID
   * @param {Array<string>} fields - Fields to include in projection
   * @returns {Promise<Object>} - Document if found, null otherwise
   */
  async findById(id, fields = []) {
    try {
      return await QueryOptimizer.optimizedFindById(this.model, id, fields);
    } catch (error) {
      console.error(`Error in ${this.constructor.name}.findById:`, error);
      throw error;
    }
  }

  /**
   * Find all documents matching the query with optimized query
   * @param {Object} query - Query to match documents against
   * @param {Object} options - Options for pagination, sorting, etc.
   * @param {Array<string>} fields - Fields to include in projection
   * @returns {Promise<Array<Object>>} - Array of documents
   */
  async findAll(query = {}, options = {}, fields = []) {
    try {
      return await QueryOptimizer.optimizedFind(this.model, query, options, fields);
    } catch (error) {
      console.error(`Error in ${this.constructor.name}.findAll:`, error);
      throw error;
    }
  }

  /**
   * Count documents matching the query with optimized query
   * @param {Object} query - Query to match documents against
   * @returns {Promise<number>} - Number of documents matching the query
   */
  async count(query = {}) {
    try {
      return await QueryOptimizer.optimizedCount(this.model, query);
    } catch (error) {
      console.error(`Error in ${this.constructor.name}.count:`, error);
      throw error;
    }
  }

  /**
   * Find one document matching the query with optimized query
   * @param {Object} query - Query to match document against
   * @param {Array<string>} fields - Fields to include in projection
   * @returns {Promise<Object>} - Document if found, null otherwise
   */
  async findOne(query, fields = []) {
    try {
      return await QueryOptimizer.optimizedFindOne(this.model, query, fields);
    } catch (error) {
      console.error(`Error in ${this.constructor.name}.findOne:`, error);
      throw error;
    }
  }

  /**
   * Execute an aggregation pipeline with optimization
   * @param {Array} pipeline - Aggregation pipeline
   * @returns {Promise<Array>} - Aggregation results
   */
  async aggregate(pipeline) {
    try {
      return await QueryOptimizer.optimizedAggregate(this.model, pipeline);
    } catch (error) {
      console.error(`Error in ${this.constructor.name}.aggregate:`, error);
      throw error;
    }
  }

  /**
   * Analyze query performance
   * @param {Object} query - Query to analyze
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Query explanation
   */
  async explainQuery(query, options = {}) {
    try {
      return await QueryOptimizer.explainQuery(this.model, query, options);
    } catch (error) {
      console.error(`Error in ${this.constructor.name}.explainQuery:`, error);
      throw error;
    }
  }

  /**
   * Get suggested indexes for a query
   * @param {Object} query - Query to analyze
   * @returns {Array<Object>} - Suggested indexes
   */
  getSuggestedIndexes(query) {
    return QueryOptimizer.getSuggestedIndexes(query);
  }
}

/**
 * Example usage with Supplier model
 */
class OptimizedSupplierRepository extends OptimizedRepository {
  constructor() {
    const SupplierModel = mongoose.model('Supplier');
    super(SupplierModel);
  }

  /**
   * Find suppliers by status with optimization
   * @param {string} status - Status to filter by
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Object with suppliers and pagination info
   */
  async findByStatus(status, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const query = { status };
    const options = { skip, limit, sort: { name: 1 } };
    const fields = ['name', 'code', 'status', 'type', 'address.country', 'overallRating'];
    
    try {
      const [suppliers, total] = await Promise.all([
        this.findAll(query, options, fields),
        this.count(query)
      ]);
      
      return {
        data: suppliers,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error in OptimizedSupplierRepository.findByStatus:', error);
      throw error;
    }
  }

  /**
   * Find suppliers by country with optimization
   * @param {string} country - Country to filter by
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Object with suppliers and pagination info
   */
  async findByCountry(country, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const query = { 'address.country': country };
    const options = { skip, limit, sort: { name: 1 } };
    const fields = ['name', 'code', 'status', 'type', 'address', 'overallRating'];
    
    try {
      const [suppliers, total] = await Promise.all([
        this.findAll(query, options, fields),
        this.count(query)
      ]);
      
      return {
        data: suppliers,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error in OptimizedSupplierRepository.findByCountry:', error);
      throw error;
    }
  }

  /**
   * Search suppliers with text index
   * @param {string} searchText - Text to search for
   * @param {number} page - Page number
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Object with suppliers and pagination info
   */
  async search(searchText, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const query = { $text: { $search: searchText } };
    const options = { 
      skip, 
      limit, 
      sort: { score: { $meta: 'textScore' } } 
    };
    const fields = ['name', 'code', 'status', 'type', 'address.country', 'overallRating'];
    
    try {
      const [suppliers, total] = await Promise.all([
        this.findAll(query, options, fields),
        this.count(query)
      ]);
      
      return {
        data: suppliers,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        searchText
      };
    } catch (error) {
      console.error('Error in OptimizedSupplierRepository.search:', error);
      throw error;
    }
  }

  /**
   * Find top rated suppliers with optimization
   * @param {number} limit - Number of suppliers to return
   * @returns {Promise<Array>} - Array of top rated suppliers
   */
  async findTopRated(limit = 10) {
    const query = { status: 'active', overallRating: { $gte: 4 } };
    const options = { limit, sort: { overallRating: -1 } };
    const fields = ['name', 'code', 'overallRating', 'address.country'];
    
    try {
      return await this.findAll(query, options, fields);
    } catch (error) {
      console.error('Error in OptimizedSupplierRepository.findTopRated:', error);
      throw error;
    }
  }

  /**
   * Get supplier statistics with aggregation
   * @returns {Promise<Object>} - Supplier statistics
   */
  async getStatistics() {
    const pipeline = [
      { $match: { status: { $in: ['active', 'inactive'] } } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRating: { $avg: '$overallRating' }
      }},
      { $project: {
        status: '$_id',
        count: 1,
        avgRating: { $round: ['$avgRating', 1] },
        _id: 0
      }},
      { $sort: { count: -1 } }
    ];
    
    try {
      return await this.aggregate(pipeline);
    } catch (error) {
      console.error('Error in OptimizedSupplierRepository.getStatistics:', error);
      throw error;
    }
  }
}

module.exports = {
  OptimizedRepository,
  OptimizedSupplierRepository
}; 