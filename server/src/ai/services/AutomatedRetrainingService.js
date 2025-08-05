/**
 * AutomatedRetrainingService.js
 *
 * Service for automated retraining triggers
 * Implements RF059 - Set up automated retraining triggers
 *
 * Features:
 * - Listens for drift/performance events and triggers retraining
 * - Supports per-model config for metrics, thresholds, and cooldowns
 * - Prevents retrain loops with cooldowns
 * - Emits events for retrain start/failure
 */

const { EventEmitter } = require('events');
const logger = require('../../infrastructure/logger');
const path = require('path');
const fs = require('fs');
const { server } = require('../../app');

// Import required services
const {
  dataDriftService,
  modelPerformanceService,
  trainingEnvironmentService,
  experimentTrackingService,
  modelRegistry,
} = require('../index');

let io = null;
try {
  io = require('socket.io')(server, { path: '/socket.io' });
} catch (e) {
  // If already initialized, get from server
  io = server.io || null;
}

/**
 * Automated Retraining Service
 * Listens for drift/performance events and triggers retraining
 */
class AutomatedRetrainingService {
  constructor(options = {}) {
    this.options = {
      retrainOnDriftSeverity: options.retrainOnDriftSeverity || ['high', 'critical'],
      retrainOnPerformanceDrop: options.retrainOnPerformanceDrop !== false,
      performanceMetric: options.performanceMetric || 'prediction_accuracy',
      performanceThreshold: options.performanceThreshold || 0.8, // Example threshold
      retrainCooldownMs: options.retrainCooldownMs || 6 * 60 * 60 * 1000, // 6 hours default
      ...options
    };
    /**
     * Per-model config: {
     *   [modelId]: {
     *     performanceMetric: string,
     *     performanceThreshold: number,
     *     retrainCooldownMs: number
     *   }
     * }
     */
    this.modelConfig = options.modelConfig || {};
    this.lastRetrainTimestamps = new Map();
    this.eventEmitter = new EventEmitter();
    this.notify = options.notify || null; // function(type, payload)
    this.auditLogPath = options.auditLogPath || path.join(__dirname, 'retrain-audit.log');
    this.retrainPolicy = options.retrainPolicy || null; // function({modelId, reason, event}): boolean|Promise<boolean>
    this.approvalCallback = options.approvalCallback || null; // function({modelId, reason, event}): boolean|Promise<boolean>
    this._setupListeners();
    logger.info('AutomatedRetrainingService initialized');
  }

  _getModelConfig(modelId) {
    return {
      performanceMetric: this.modelConfig[modelId]?.performanceMetric || this.options.performanceMetric,
      performanceThreshold: this.modelConfig[modelId]?.performanceThreshold || this.options.performanceThreshold,
      retrainCooldownMs: this.modelConfig[modelId]?.retrainCooldownMs || this.options.retrainCooldownMs,
    };
  }

  _canRetrain(modelId) {
    const { retrainCooldownMs } = this._getModelConfig(modelId);
    const last = this.lastRetrainTimestamps.get(modelId);
    if (!last) return true;
    return (Date.now() - last) > retrainCooldownMs;
  }

  _markRetrain(modelId) {
    this.lastRetrainTimestamps.set(modelId, Date.now());
  }

  _setupListeners() {
    // Listen for drift-detected events
    dataDriftService.eventEmitter.on('drift-detected', async (event) => {
      logger.info(`[AutoRetrain] Drift detected for model ${event.modelId} (severity: ${event.severity})`);
      if (this.options.retrainOnDriftSeverity.includes(event.severity)) {
        if (this._canRetrain(event.modelId)) {
          await this.triggerRetraining(event.modelId, 'drift', event);
        } else {
          logger.info(`[AutoRetrain] Cooldown active for model ${event.modelId}, skipping retrain.`);
        }
      }
    });

    // Listen for performance drops (custom event, must be emitted by modelPerformanceService)
    modelPerformanceService.eventEmitter.on('performance-drop', async (event) => {
      logger.info(`[AutoRetrain] Performance drop detected for model ${event.modelId}`);
      if (this.options.retrainOnPerformanceDrop) {
        const { performanceMetric, performanceThreshold } = this._getModelConfig(event.modelId);
        if (
          event.metricName === performanceMetric &&
          typeof event.value === 'number' &&
          event.value < performanceThreshold
        ) {
          if (this._canRetrain(event.modelId)) {
            await this.triggerRetraining(event.modelId, 'performance', event);
          } else {
            logger.info(`[AutoRetrain] Cooldown active for model ${event.modelId}, skipping retrain.`);
          }
        }
      }
    });
  }

  setNotificationCallback(fn) {
    this.notify = fn;
  }

  setRetrainPolicy(fn) {
    this.retrainPolicy = fn;
  }

  setApprovalCallback(fn) {
    this.approvalCallback = fn;
  }

  async _logAudit(entry) {
    const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n';
    fs.appendFile(this.auditLogPath, line, err => {
      if (err) logger.error('[AutoRetrain] Failed to write audit log:', err);
    });
  }

  /**
   * Triggers retraining for a model
   * @param {string} modelId - Model identifier
   * @param {string} reason - 'drift' or 'performance'
   * @param {Object} event - Event data
   */
  async triggerRetraining(modelId, reason, event) {
    const auditBase = { modelId, reason, event, status: 'attempted' };
    try {
      if (!this._canRetrain(modelId)) {
        logger.info(`[AutoRetrain] Cooldown active for model ${modelId}, skipping retrain.`);
        await this._logAudit({ ...auditBase, status: 'cooldown' });
        if (io) io.emit('retraining-event', { type: 'cooldown', modelId });
        return;
      }
      if (this.retrainPolicy) {
        const shouldRetrain = await this.retrainPolicy({ modelId, reason, event });
        if (!shouldRetrain) {
          logger.info(`[AutoRetrain] Custom retrain policy denied retrain for model ${modelId}.`);
          await this._logAudit({ ...auditBase, status: 'policy-denied' });
          if (io) io.emit('retraining-event', { type: 'policy-denied', modelId });
          return;
        }
      }
      if (this.approvalCallback) {
        const approved = await this.approvalCallback({ modelId, reason, event });
        if (!approved) {
          logger.info(`[AutoRetrain] Human approval denied retrain for model ${modelId}.`);
          await this._logAudit({ ...auditBase, status: 'approval-denied' });
          if (io) io.emit('retraining-event', { type: 'approval-denied', modelId });
          return;
        }
      }
      this._markRetrain(modelId);
      logger.info(`[AutoRetrain] Triggering retraining for model ${modelId} due to ${reason}`);
      // Find model metadata
      const modelMeta = modelRegistry.getModelMetadata
        ? modelRegistry.getModelMetadata(modelId)
        : (modelRegistry.getModel && modelRegistry.getModel(modelId));
      if (!modelMeta) {
        logger.error(`[AutoRetrain] Model metadata not found for ${modelId}`);
        return;
      }

      // Create experiment for retraining
      const experiment = await experimentTrackingService.createExperiment(
        `AutoRetrain: ${modelId} (${reason})`,
        {
          reason,
          event,
          modelId,
          tags: ['auto-retrain', reason, modelId],
        }
      );

      // Create training environment
      const env = await trainingEnvironmentService.createEnvironment(
        `AutoRetrainEnv-${modelId}-${Date.now()}`,
        modelMeta.framework || 'custom',
        {
          packages: modelMeta.dependencies || [],
          tags: ['auto-retrain', modelId],
        }
      );

      // Link environment to experiment
      await experimentTrackingService.linkEnvironment(experiment.id, env.id);

      // Start training (this may need to be customized per project)
      await trainingEnvironmentService.startEnvironment(env.id, {
        modelId,
        experimentId: experiment.id,
        reason,
        event: JSON.stringify(event),
      });

      logger.info(`[AutoRetrain] Retraining started for model ${modelId} in environment ${env.id}`);
      this.eventEmitter.emit('retraining-started', { modelId, experimentId: experiment.id, environmentId: env.id, reason });
      if (io) io.emit('retraining-event', { type: 'retraining-started', modelId, experimentId: experiment.id, environmentId: env.id, reason });
      if (this.notify) {
        this.notify('retraining-started', { modelId, experimentId: experiment.id, environmentId: env.id, reason });
      }
      await this._logAudit({ ...auditBase, status: 'started', experimentId: experiment.id, environmentId: env.id });
      if (io) io.emit('retraining-audit', { modelId });
    } catch (error) {
      logger.error(`[AutoRetrain] Failed to trigger retraining for model ${modelId}: ${error.message}`);
      this.eventEmitter.emit('retraining-failed', { modelId, reason, error: error.message });
      if (io) io.emit('retraining-event', { type: 'retraining-failed', modelId, reason, error: error.message });
      if (this.notify) {
        this.notify('retraining-failed', { modelId, reason, error: error.message });
      }
      await this._logAudit({ ...auditBase, status: 'failed', error: error.message });
      if (io) io.emit('retraining-audit', { modelId });
    }
  }

  async getRetrainHistory(modelId) {
    // Returns array of audit log entries for the model
    try {
      const data = fs.existsSync(this.auditLogPath)
        ? fs.readFileSync(this.auditLogPath, 'utf8')
        : '';
      return data
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line))
        .filter(entry => entry.modelId === modelId);
    } catch (e) {
      logger.error('[AutoRetrain] Failed to read audit log:', e);
      return [];
    }
  }

  async getLastRetrainStatus(modelId) {
    const history = await this.getRetrainHistory(modelId);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  getNextEligibleRetrainTime(modelId) {
    const { retrainCooldownMs } = this._getModelConfig(modelId);
    const last = this.lastRetrainTimestamps.get(modelId);
    if (!last) return new Date();
    return new Date(last + retrainCooldownMs);
  }
}

module.exports = { AutomatedRetrainingService }; 