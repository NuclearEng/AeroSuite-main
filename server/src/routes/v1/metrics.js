/**
 * metrics.js
 * 
 * Routes for exposing metrics
 * Implements RF028 - Add cache monitoring and metrics
 */

const express = require('express');
const router = express.Router();
const { getCacheMonitor } = require('../../infrastructure/caching');
const { getCachePrometheusExporter } = require('../../infrastructure/caching');
const logger = require('../../infrastructure/logger');

/**
 * @swagger
 * /api/v1/metrics/cache:
 *   get:
 *     summary: Get cache metrics
 *     description: Returns cache metrics in JSON format
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Cache metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: object
 *                   description: Basic cache metrics
 */
router.get('/cache', (req, res) => {
  try {
    const cacheMonitor = getCacheMonitor();
    
    if (!cacheMonitor) {
      return res.status(503).json({ error: 'Cache monitoring not available' });
    }
    
    const metrics = cacheMonitor.getMetrics();
    res.json({ metrics });
  } catch (error) {
    logger.error('Error getting cache metrics:', error);
    res.status(500).json({ error: 'Failed to get cache metrics' });
  }
});

/**
 * @swagger
 * /api/v1/metrics/cache/detailed:
 *   get:
 *     summary: Get detailed cache metrics
 *     description: Returns detailed cache metrics in JSON format
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Detailed cache metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: object
 *                   description: Basic cache metrics
 *                 detailedMetrics:
 *                   type: object
 *                   description: Detailed cache metrics
 */
router.get('/cache/detailed', (req, res) => {
  try {
    const cacheMonitor = getCacheMonitor();
    
    if (!cacheMonitor) {
      return res.status(503).json({ error: 'Cache monitoring not available' });
    }
    
    const metrics = cacheMonitor.getMetrics();
    const detailedMetrics = cacheMonitor.getDetailedMetrics();
    
    res.json({ metrics, detailedMetrics });
  } catch (error) {
    logger.error('Error getting detailed cache metrics:', error);
    res.status(500).json({ error: 'Failed to get detailed cache metrics' });
  }
});

/**
 * @swagger
 * /api/v1/metrics/cache/prometheus:
 *   get:
 *     summary: Get cache metrics in Prometheus format
 *     description: Returns cache metrics in Prometheus text format
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Cache metrics in Prometheus format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/cache/prometheus', async (req, res) => {
  try {
    const exporter = getCachePrometheusExporter();
    
    if (!exporter) {
      return res.status(503).json({ error: 'Prometheus exporter not available' });
    }
    
    const metrics = await exporter.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Error getting Prometheus metrics:', error);
    res.status(500).json({ error: 'Failed to get Prometheus metrics' });
  }
});

/**
 * @swagger
 * /api/v1/metrics/cache/reset:
 *   post:
 *     summary: Reset cache metrics
 *     description: Resets all cache metrics
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Metrics reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 */
router.post('/cache/reset', (req, res) => {
  try {
    const cacheMonitor = getCacheMonitor();
    
    if (!cacheMonitor) {
      return res.status(503).json({ error: 'Cache monitoring not available' });
    }
    
    cacheMonitor.resetMetrics();
    res.json({ success: true });
  } catch (error) {
    logger.error('Error resetting cache metrics:', error);
    res.status(500).json({ error: 'Failed to reset cache metrics' });
  }
});

module.exports = router; 