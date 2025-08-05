/**
 * Cache Controller
 * 
 * This controller provides endpoints to manage the database query cache.
 * 
 * Task: TS296 - Status: Completed - Query result caching
 */

const queryOptimizer = require('../utils/queryOptimizer');

/**
 * Get cache statistics
 * @route GET /api/cache/stats
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCacheStats = (req, res) => {
  try {
    const queryStats = queryOptimizer.getQueryStats();
    
    // Format the response
    const response = {
      cache: queryStats.cache,
      queries: {
        total: queryStats.totalQueries,
        avgExecutionTime: queryStats.avgExecutionTime.toFixed(2),
        totalExecutionTime: queryStats.totalExecutionTime.toFixed(2),
        slowQueries: queryStats.slowQueries.slice(0, 10) // Return only top 10 slow queries
      }
    };
    
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
      error: error.message
    });
  }
};

/**
 * Reset cache statistics
 * @route POST /api/cache/stats/reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.resetCacheStats = (req, res) => {
  try {
    queryOptimizer.resetQueryStats();
    
    res.status(200).json({
      success: true,
      message: 'Cache statistics reset successfully'
    });
  } catch (error) {
    console.error('Error resetting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset cache statistics',
      error: error.message
    });
  }
};

/**
 * Invalidate cache for a specific model
 * @route DELETE /api/cache/model/:modelName
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.invalidateModelCache = async (req, res) => {
  try {
    const { modelName } = req.params;
    
    if (!modelName) {
      return res.status(400).json({
        success: false,
        message: 'Model name is required'
      });
    }
    
    const count = await queryOptimizer.invalidateQueryCache(modelName);
    
    res.status(200).json({
      success: true,
      message: `Successfully invalidated ${count} cache entries for model ${modelName}`
    });
  } catch (error) {
    console.error('Error invalidating model cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate model cache',
      error: error.message
    });
  }
};

/**
 * Invalidate all cache entries
 * @route DELETE /api/cache
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.invalidateAllCache = async (req, res) => {
  try {
    await queryOptimizer.invalidateAllQueryCache();
    
    res.status(200).json({
      success: true,
      message: 'Successfully invalidated all cache entries'
    });
  } catch (error) {
    console.error('Error invalidating all cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate all cache entries',
      error: error.message
    });
  }
}; 