import express from 'express';
import batchController from '../controllers/batchController';
import { rateLimit } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * @route POST /api/batch
 * @description Process a batch of API requests
 * @param {Array} requests - Array of request objects, each containing:
 *   - id: Unique identifier for the request
 *   - endpoint: API endpoint to call
 *   - method: HTTP method (GET, POST, PUT, DELETE)
 *   - body: Request body (optional)
 *   - headers: Request headers (optional)
 * @returns {Object} Object containing responses array
 */
router.post(
  '/',
  // Apply stricter rate limiting for batch requests
  rateLimit({ windowMs: 60 * 1000, max: 5, message: 'Too many batch requests' }), 
  batchController.processBatch
);

/**
 * @route GET /api/batch/health
 * @description Health check for the batch API
 * @returns {Object} Status message
 */
router.get('/health', batchController.healthCheck);

export default router; 