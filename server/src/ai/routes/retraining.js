const express = require('express');
const router = express.Router();
const { automatedRetrainingService, modelRegistry } = require('../index');

// GET /api/retraining/models
router.get('/models', async (req, res) => {
  try {
    const models = modelRegistry.listModels ? modelRegistry.listModels() : [];
    res.json({ models });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/retraining/:modelId/history
router.get('/:modelId/history', async (req, res) => {
  try {
    const history = await automatedRetrainingService.getRetrainHistory(req.params.modelId);
    res.json({ history });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/retraining/:modelId/status
router.get('/:modelId/status', async (req, res) => {
  try {
    const status = await automatedRetrainingService.getLastRetrainStatus(req.params.modelId);
    const nextEligible = automatedRetrainingService.getNextEligibleRetrainTime(req.params.modelId);
    res.json({ status, nextEligible });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/retraining/:modelId/trigger
router.post('/:modelId/trigger', async (req, res) => {
  try {
    const { reason = 'manual', event = {} } = req.body || {};
    await automatedRetrainingService.triggerRetraining(req.params.modelId, reason, event);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/retraining/:modelId/approve
router.post('/:modelId/approve', async (req, res) => {
  // This is a stub; actual approval logic may depend on your workflow
  // For now, just call approval callback if set
  try {
    if (automatedRetrainingService.approvalCallback) {
      await automatedRetrainingService.approvalCallback({ modelId: req.params.modelId, approved: true });
    }
    res.json({ approved: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/retraining/:modelId/deny
router.post('/:modelId/deny', async (req, res) => {
  try {
    if (automatedRetrainingService.approvalCallback) {
      await automatedRetrainingService.approvalCallback({ modelId: req.params.modelId, approved: false });
    }
    res.json({ denied: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/retraining/:modelId/metrics
router.get('/:modelId/metrics', async (req, res) => {
  try {
    const { metricType, timeWindow } = req.query;
    const metrics = await automatedRetrainingService.modelPerformanceService?.getModelMetrics
      ? automatedRetrainingService.modelPerformanceService.getModelMetrics(req.params.modelId, metricType, timeWindow)
      : require('../index').getModelMetrics(req.params.modelId, metricType, timeWindow);
    res.json({ metrics });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/retraining/metrics/all
router.get('/metrics/all', async (req, res) => {
  try {
    const { metricType, timeWindow } = req.query;
    const metrics = require('../index').getAllMetrics(metricType, timeWindow);
    res.json({ metrics });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/retraining/metrics/aggregated
router.get('/metrics/aggregated', async (req, res) => {
  try {
    const { metricType, timeWindow } = req.query;
    const metrics = require('../index').getAggregatedMetrics(metricType, timeWindow);
    res.json({ metrics });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router; 