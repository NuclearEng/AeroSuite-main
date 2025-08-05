/**
 * Cache Routes
 * 
 * This file defines routes for managing the database query cache.
 * 
 * Task: TS296 - Status: Completed - Query result caching
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const cacheController = require('../controllers/cache.controller');

const router = express.Router();

/**
 * @route GET /api/cache/stats
 * @desc Get cache statistics
 * @access Private (Admin only)
 */
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  cacheController.getCacheStats
);

/**
 * @route POST /api/cache/stats/reset
 * @desc Reset cache statistics
 * @access Private (Admin only)
 */
router.post(
  '/stats/reset',
  authenticate,
  authorize('admin'),
  cacheController.resetCacheStats
);

/**
 * @route DELETE /api/cache/model/:modelName
 * @desc Invalidate cache for a specific model
 * @access Private (Admin only)
 */
router.delete(
  '/model/:modelName',
  authenticate,
  authorize('admin'),
  cacheController.invalidateModelCache
);

/**
 * @route DELETE /api/cache
 * @desc Invalidate all cache entries
 * @access Private (Admin only)
 */
router.delete(
  '/',
  authenticate,
  authorize('admin'),
  cacheController.invalidateAllCache
);

module.exports = router; 