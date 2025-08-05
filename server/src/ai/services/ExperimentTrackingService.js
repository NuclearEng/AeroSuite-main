/**
 * ExperimentTrackingService.js
 * 
 * Service for tracking machine learning experiments
 * Implements RF054 - Implement experiment tracking
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Experiment status enum
 * @enum {string}
 */
const ExperimentStatus = {
  CREATED: 'created',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ARCHIVED: 'archived'
};

/**
 * Experiment run status enum
 * @enum {string}
 */
const RunStatus = {
  CREATED: 'created',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * Experiment Tracking Service
 * Tracks machine learning experiments, parameters, metrics, and artifacts
 */
class ExperimentTrackingService {
  /**
   * Create a new experiment tracking service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      experimentsPath: process.env.ML_EXPERIMENTS_PATH || path.join(__dirname, '../../../..', 'ml-experiments'),
      artifactsPath: process.env.ML_ARTIFACTS_PATH || path.join(__dirname, '../../../..', 'ml-artifacts'),
      ...options
    };
    
    this.eventEmitter = new EventEmitter();
    this.experiments = new Map();
    this.runs = new Map();
    
    // Initialize service
    this._initialize();
  }
  
  /**
   * Initialize the experiment tracking service
   * @private
   */
  async _initialize() {
    try {
      // Ensure directories exist
      await this._ensureDirectories();
      
      // Load existing experiments
      await this._loadExperiments();
      
      // Load existing runs
      await this._loadRuns();
      
      logger.info('Experiment Tracking Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Experiment Tracking Service', error);
    }
  }
  
  /**
   * Ensure required directories exist
   * @private
   */
  async _ensureDirectories() {
    try {
      await fs.mkdir(this.options.experimentsPath, { recursive: true });
      await fs.mkdir(this.options.artifactsPath, { recursive: true });
      
      logger.debug('Required directories created');
    } catch (error) {
      logger.error('Failed to create required directories', error);
      throw error;
    }
  }
  
  /**
   * Load existing experiments from disk
   * @private
   */
  async _loadExperiments() {
    try {
      const experimentsFile = path.join(this.options.experimentsPath, 'experiments.json');
      
      try {
        await fs.access(experimentsFile);
        
        // Read experiments file
        const data = await fs.readFile(experimentsFile, 'utf8');
        const experiments = JSON.parse(data);
        
        // Load experiments into memory
        for (const exp of experiments) {
          this.experiments.set(exp.id, exp);
        }
        
        logger.info(`Loaded ${this.experiments.size} experiments`);
      } catch (error) {
        // File doesn't exist, create it
        await this._saveExperiments();
        logger.info('Created new experiments file');
      }
    } catch (error) {
      logger.error('Failed to load experiments', error);
      throw error;
    }
  }
  
  /**
   * Load existing runs from disk
   * @private
   */
  async _loadRuns() {
    try {
      const runsFile = path.join(this.options.experimentsPath, 'runs.json');
      
      try {
        await fs.access(runsFile);
        
        // Read runs file
        const data = await fs.readFile(runsFile, 'utf8');
        const runs = JSON.parse(data);
        
        // Load runs into memory
        for (const run of runs) {
          this.runs.set(run.id, run);
        }
        
        logger.info(`Loaded ${this.runs.size} experiment runs`);
      } catch (error) {
        // File doesn't exist, create it
        await this._saveRuns();
        logger.info('Created new runs file');
      }
    } catch (error) {
      logger.error('Failed to load experiment runs', error);
      throw error;
    }
  }
  
  /**
   * Save experiments to disk
   * @private
   */
  async _saveExperiments() {
    try {
      const experimentsFile = path.join(this.options.experimentsPath, 'experiments.json');
      
      // Convert experiments map to array
      const experiments = Array.from(this.experiments.values());
      
      // Write to file
      await fs.writeFile(
        experimentsFile,
        JSON.stringify(experiments, null, 2)
      );
      
      logger.debug('Experiments saved successfully');
    } catch (error) {
      logger.error('Failed to save experiments', error);
      throw error;
    }
  }
  
  /**
   * Save runs to disk
   * @private
   */
  async _saveRuns() {
    try {
      const runsFile = path.join(this.options.experimentsPath, 'runs.json');
      
      // Convert runs map to array
      const runs = Array.from(this.runs.values());
      
      // Write to file
      await fs.writeFile(
        runsFile,
        JSON.stringify(runs, null, 2)
      );
      
      logger.debug('Experiment runs saved successfully');
    } catch (error) {
      logger.error('Failed to save experiment runs', error);
      throw error;
    }
  }
  
  /**
   * Create a new experiment
   * @param {string} name - Experiment name
   * @param {Object} metadata - Experiment metadata
   * @returns {Promise<Object>} Created experiment
   */
  async createExperiment(name, metadata = {}) {
    try {
      logger.info(`Creating experiment: ${name}`);
      
      // Generate unique ID
      const id = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create experiment configuration
      const experiment = {
        id,
        name,
        description: metadata.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: ExperimentStatus.CREATED,
        tags: metadata.tags || [],
        metadata: {
          ...metadata
        },
        runs: []
      };
      
      // Store experiment in memory
      this.experiments.set(id, experiment);
      
      // Save experiments to disk
      await this._saveExperiments();
      
      logger.info(`Experiment ${id} created successfully`);
      
      // Emit event
      this.eventEmitter.emit('experiment-created', {
        experimentId: id,
        timestamp: new Date()
      });
      
      return experiment;
    } catch (error) {
      logger.error(`Failed to create experiment: ${name}`, error);
      throw error;
    }
  }
  
  /**
   * Get an experiment by ID
   * @param {string} experimentId - Experiment ID
   * @returns {Promise<Object>} Experiment
   */
  async getExperiment(experimentId) {
    try {
      // Check if experiment exists
      if (!this.experiments.has(experimentId)) {
        throw new Error(`Experiment ${experimentId} not found`);
      }
      
      return this.experiments.get(experimentId);
    } catch (error) {
      logger.error(`Failed to get experiment ${experimentId}`, error);
      throw error;
    }
  }
  
  /**
   * Get all experiments
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array<Object>>} List of experiments
   */
  async getExperiments(filters = {}) {
    try {
      let experiments = Array.from(this.experiments.values());
      
      // Apply filters if provided
      if (filters.status) {
        experiments = experiments.filter(exp => exp.status === filters.status);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        experiments = experiments.filter(exp => 
          filters.tags.some(tag => exp.tags.includes(tag))
        );
      }
      
      if (filters.name) {
        experiments = experiments.filter(exp => 
          exp.name.toLowerCase().includes(filters.name.toLowerCase())
        );
      }
      
      // Sort by creation date (newest first)
      experiments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return experiments;
    } catch (error) {
      logger.error('Failed to get experiments', error);
      throw error;
    }
  }
  
  /**
   * Update an experiment
   * @param {string} experimentId - Experiment ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated experiment
   */
  async updateExperiment(experimentId, updates) {
    try {
      logger.info(`Updating experiment: ${experimentId}`);
      
      // Check if experiment exists
      if (!this.experiments.has(experimentId)) {
        throw new Error(`Experiment ${experimentId} not found`);
      }
      
      const experiment = this.experiments.get(experimentId);
      
      // Update fields
      const updatedExperiment = {
        ...experiment,
        name: updates.name || experiment.name,
        description: updates.description || experiment.description,
        status: updates.status || experiment.status,
        tags: updates.tags || experiment.tags,
        metadata: {
          ...experiment.metadata,
          ...(updates.metadata || {})
        },
        updatedAt: new Date().toISOString()
      };
      
      // Store updated experiment
      this.experiments.set(experimentId, updatedExperiment);
      
      // Save experiments to disk
      await this._saveExperiments();
      
      logger.info(`Experiment ${experimentId} updated successfully`);
      
      // Emit event
      this.eventEmitter.emit('experiment-updated', {
        experimentId,
        timestamp: new Date()
      });
      
      return updatedExperiment;
    } catch (error) {
      logger.error(`Failed to update experiment ${experimentId}`, error);
      throw error;
    }
  }
  
  /**
   * Delete an experiment
   * @param {string} experimentId - Experiment ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteExperiment(experimentId) {
    try {
      logger.info(`Deleting experiment: ${experimentId}`);
      
      // Check if experiment exists
      if (!this.experiments.has(experimentId)) {
        throw new Error(`Experiment ${experimentId} not found`);
      }
      
      // Get experiment runs
      const experiment = this.experiments.get(experimentId);
      const runIds = experiment.runs;
      
      // Delete all runs associated with this experiment
      for (const runId of runIds) {
        if (this.runs.has(runId)) {
          this.runs.delete(runId);
        }
      }
      
      // Remove experiment from memory
      this.experiments.delete(experimentId);
      
      // Save changes to disk
      await this._saveExperiments();
      await this._saveRuns();
      
      logger.info(`Experiment ${experimentId} deleted successfully`);
      
      // Emit event
      this.eventEmitter.emit('experiment-deleted', {
        experimentId,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete experiment ${experimentId}`, error);
      throw error;
    }
  }
  
  /**
   * Create a new run for an experiment
   * @param {string} experimentId - Experiment ID
   * @param {Object} config - Run configuration
   * @returns {Promise<Object>} Created run
   */
  async createRun(experimentId, config = {}) {
    try {
      logger.info(`Creating run for experiment: ${experimentId}`);
      
      // Check if experiment exists
      if (!this.experiments.has(experimentId)) {
        throw new Error(`Experiment ${experimentId} not found`);
      }
      
      // Generate unique ID
      const id = `run-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create run configuration
      const run = {
        id,
        experimentId,
        name: config.name || `Run ${id}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        status: RunStatus.CREATED,
        parameters: config.parameters || {},
        metrics: {},
        artifacts: [],
        tags: config.tags || [],
        metadata: {
          ...config.metadata
        },
        environmentId: config.environmentId || null,
        userId: config.userId || null,
        notes: config.notes || ''
      };
      
      // Store run in memory
      this.runs.set(id, run);
      
      // Update experiment
      const experiment = this.experiments.get(experimentId);
      experiment.runs.push(id);
      experiment.updatedAt = new Date().toISOString();
      
      // Save changes to disk
      await this._saveExperiments();
      await this._saveRuns();
      
      logger.info(`Run ${id} created successfully for experiment ${experimentId}`);
      
      // Emit event
      this.eventEmitter.emit('run-created', {
        experimentId,
        runId: id,
        timestamp: new Date()
      });
      
      return run;
    } catch (error) {
      logger.error(`Failed to create run for experiment ${experimentId}`, error);
      throw error;
    }
  }
  
  /**
   * Start a run
   * @param {string} runId - Run ID
   * @returns {Promise<Object>} Updated run
   */
  async startRun(runId) {
    try {
      logger.info(`Starting run: ${runId}`);
      
      // Check if run exists
      if (!this.runs.has(runId)) {
        throw new Error(`Run ${runId} not found`);
      }
      
      const run = this.runs.get(runId);
      
      // Update run status
      const updatedRun = {
        ...run,
        status: RunStatus.RUNNING,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store updated run
      this.runs.set(runId, updatedRun);
      
      // Save runs to disk
      await this._saveRuns();
      
      logger.info(`Run ${runId} started successfully`);
      
      // Emit event
      this.eventEmitter.emit('run-started', {
        experimentId: updatedRun.experimentId,
        runId,
        timestamp: new Date()
      });
      
      return updatedRun;
    } catch (error) {
      logger.error(`Failed to start run ${runId}`, error);
      throw error;
    }
  }
  
  /**
   * Complete a run
   * @param {string} runId - Run ID
   * @param {Object} results - Run results
   * @returns {Promise<Object>} Updated run
   */
  async completeRun(runId, results = {}) {
    try {
      logger.info(`Completing run: ${runId}`);
      
      // Check if run exists
      if (!this.runs.has(runId)) {
        throw new Error(`Run ${runId} not found`);
      }
      
      const run = this.runs.get(runId);
      
      // Update run status and results
      const updatedRun = {
        ...run,
        status: RunStatus.COMPLETED,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: {
          ...run.metrics,
          ...(results.metrics || {})
        },
        artifacts: [
          ...run.artifacts,
          ...(results.artifacts || [])
        ],
        metadata: {
          ...run.metadata,
          ...(results.metadata || {})
        },
        notes: results.notes || run.notes
      };
      
      // Store updated run
      this.runs.set(runId, updatedRun);
      
      // Save runs to disk
      await this._saveRuns();
      
      logger.info(`Run ${runId} completed successfully`);
      
      // Emit event
      this.eventEmitter.emit('run-completed', {
        experimentId: updatedRun.experimentId,
        runId,
        timestamp: new Date()
      });
      
      return updatedRun;
    } catch (error) {
      logger.error(`Failed to complete run ${runId}`, error);
      throw error;
    }
  }
  
  /**
   * Fail a run
   * @param {string} runId - Run ID
   * @param {string} errorMessage - Error message
   * @returns {Promise<Object>} Updated run
   */
  async failRun(runId, errorMessage) {
    try {
      logger.info(`Failing run: ${runId}`);
      
      // Check if run exists
      if (!this.runs.has(runId)) {
        throw new Error(`Run ${runId} not found`);
      }
      
      const run = this.runs.get(runId);
      
      // Update run status
      const updatedRun = {
        ...run,
        status: RunStatus.FAILED,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...run.metadata,
          error: errorMessage
        }
      };
      
      // Store updated run
      this.runs.set(runId, updatedRun);
      
      // Save runs to disk
      await this._saveRuns();
      
      logger.info(`Run ${runId} marked as failed`);
      
      // Emit event
      this.eventEmitter.emit('run-failed', {
        experimentId: updatedRun.experimentId,
        runId,
        error: errorMessage,
        timestamp: new Date()
      });
      
      return updatedRun;
    } catch (error) {
      logger.error(`Failed to mark run ${runId} as failed`, error);
      throw error;
    }
  }
  
  /**
   * Get a run by ID
   * @param {string} runId - Run ID
   * @returns {Promise<Object>} Run
   */
  async getRun(runId) {
    try {
      // Check if run exists
      if (!this.runs.has(runId)) {
        throw new Error(`Run ${runId} not found`);
      }
      
      return this.runs.get(runId);
    } catch (error) {
      logger.error(`Failed to get run ${runId}`, error);
      throw error;
    }
  }
  
  /**
   * Get all runs for an experiment
   * @param {string} experimentId - Experiment ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array<Object>>} List of runs
   */
  async getRuns(experimentId, filters = {}) {
    try {
      // Check if experiment exists
      if (!this.experiments.has(experimentId)) {
        throw new Error(`Experiment ${experimentId} not found`);
      }
      
      const experiment = this.experiments.get(experimentId);
      let runs = experiment.runs.map(runId => this.runs.get(runId)).filter(run => run !== undefined);
      
      // Apply filters if provided
      if (filters.status) {
        runs = runs.filter(run => run.status === filters.status);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        runs = runs.filter(run => 
          filters.tags.some(tag => run.tags.includes(tag))
        );
      }
      
      // Sort by creation date (newest first)
      runs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return runs;
    } catch (error) {
      logger.error(`Failed to get runs for experiment ${experimentId}`, error);
      throw error;
    }
  }
  
  /**
   * Log metrics for a run
   * @param {string} runId - Run ID
   * @param {Object} metrics - Metrics to log
   * @returns {Promise<Object>} Updated run
   */
  async logMetrics(runId, metrics) {
    try {
      logger.info(`Logging metrics for run: ${runId}`);
      
      // Check if run exists
      if (!this.runs.has(runId)) {
        throw new Error(`Run ${runId} not found`);
      }
      
      const run = this.runs.get(runId);
      
      // Update run metrics
      const updatedRun = {
        ...run,
        metrics: {
          ...run.metrics,
          ...metrics
        },
        updatedAt: new Date().toISOString()
      };
      
      // Store updated run
      this.runs.set(runId, updatedRun);
      
      // Save runs to disk
      await this._saveRuns();
      
      logger.info(`Metrics logged for run ${runId}`);
      
      return updatedRun;
    } catch (error) {
      logger.error(`Failed to log metrics for run ${runId}`, error);
      throw error;
    }
  }
  
  /**
   * Log an artifact for a run
   * @param {string} runId - Run ID
   * @param {string} name - Artifact name
   * @param {string} filePath - Path to artifact file
   * @param {Object} metadata - Artifact metadata
   * @returns {Promise<Object>} Updated run
   */
  async logArtifact(runId, name, filePath, metadata = {}) {
    try {
      logger.info(`Logging artifact for run: ${runId}`);
      
      // Check if run exists
      if (!this.runs.has(runId)) {
        throw new Error(`Run ${runId} not found`);
      }
      
      const run = this.runs.get(runId);
      
      // Generate artifact ID
      const artifactId = `artifact-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create artifact directory
      const artifactDir = path.join(this.options.artifactsPath, run.experimentId, runId);
      await fs.mkdir(artifactDir, { recursive: true });
      
      // Copy artifact file to storage
      const artifactFileName = path.basename(filePath);
      const artifactPath = path.join(artifactDir, artifactFileName);
      
      // Read source file
      const fileContent = await fs.readFile(filePath);
      
      // Write to destination
      await fs.writeFile(artifactPath, fileContent);
      
      // Calculate file hash
      const fileHash = crypto.createHash('md5').update(fileContent).digest('hex');
      
      // Create artifact record
      const artifact = {
        id: artifactId,
        name,
        fileName: artifactFileName,
        path: artifactPath,
        size: fileContent.length,
        hash: fileHash,
        createdAt: new Date().toISOString(),
        metadata: {
          ...metadata
        }
      };
      
      // Update run artifacts
      const updatedRun = {
        ...run,
        artifacts: [...run.artifacts, artifact],
        updatedAt: new Date().toISOString()
      };
      
      // Store updated run
      this.runs.set(runId, updatedRun);
      
      // Save runs to disk
      await this._saveRuns();
      
      logger.info(`Artifact ${name} logged for run ${runId}`);
      
      return artifact;
    } catch (error) {
      logger.error(`Failed to log artifact for run ${runId}`, error);
      throw error;
    }
  }
  
  /**
   * Compare multiple runs
   * @param {Array<string>} runIds - Run IDs to compare
   * @returns {Promise<Object>} Comparison results
   */
  async compareRuns(runIds) {
    try {
      logger.info(`Comparing runs: ${runIds.join(', ')}`);
      
      const runs = [];
      const metrics = {};
      const parameters = {};
      
      // Collect run data
      for (const runId of runIds) {
        if (!this.runs.has(runId)) {
          throw new Error(`Run ${runId} not found`);
        }
        
        const run = this.runs.get(runId);
        runs.push(run);
        
        // Collect metrics
        for (const [key, value] of Object.entries(run.metrics)) {
          if (!metrics[key]) {
            metrics[key] = [];
          }
          metrics[key].push({ runId, value });
        }
        
        // Collect parameters
        for (const [key, value] of Object.entries(run.parameters)) {
          if (!parameters[key]) {
            parameters[key] = [];
          }
          parameters[key].push({ runId, value });
        }
      }
      
      return {
        runs,
        metrics,
        parameters
      };
    } catch (error) {
      logger.error(`Failed to compare runs: ${runIds.join(', ')}`, error);
      throw error;
    }
  }
  
  /**
   * Get best run for an experiment based on a metric
   * @param {string} experimentId - Experiment ID
   * @param {string} metricName - Metric name
   * @param {boolean} isHigherBetter - True if higher metric value is better
   * @returns {Promise<Object>} Best run
   */
  async getBestRun(experimentId, metricName, isHigherBetter = true) {
    try {
      logger.info(`Getting best run for experiment ${experimentId} based on ${metricName}`);
      
      // Get all runs for the experiment
      const runs = await this.getRuns(experimentId, { status: RunStatus.COMPLETED });
      
      if (runs.length === 0) {
        throw new Error(`No completed runs found for experiment ${experimentId}`);
      }
      
      // Filter runs that have the specified metric
      const runsWithMetric = runs.filter(run => run.metrics[metricName] !== undefined);
      
      if (runsWithMetric.length === 0) {
        throw new Error(`No runs with metric ${metricName} found for experiment ${experimentId}`);
      }
      
      // Sort runs by metric value
      runsWithMetric.sort((a, b) => {
        const aValue = a.metrics[metricName];
        const bValue = b.metrics[metricName];
        
        return isHigherBetter ? bValue - aValue : aValue - bValue;
      });
      
      // Return best run
      return runsWithMetric[0];
    } catch (error) {
      logger.error(`Failed to get best run for experiment ${experimentId}`, error);
      throw error;
    }
  }
  
  /**
   * Link a training environment to an experiment
   * @param {string} experimentId - Experiment ID
   * @param {string} environmentId - Environment ID
   * @returns {Promise<Object>} Updated experiment
   */
  async linkEnvironment(experimentId, environmentId) {
    try {
      logger.info(`Linking environment ${environmentId} to experiment ${experimentId}`);
      
      // Check if experiment exists
      if (!this.experiments.has(experimentId)) {
        throw new Error(`Experiment ${experimentId} not found`);
      }
      
      const experiment = this.experiments.get(experimentId);
      
      // Update experiment
      const updatedExperiment = {
        ...experiment,
        metadata: {
          ...experiment.metadata,
          environmentId
        },
        updatedAt: new Date().toISOString()
      };
      
      // Store updated experiment
      this.experiments.set(experimentId, updatedExperiment);
      
      // Save experiments to disk
      await this._saveExperiments();
      
      logger.info(`Environment ${environmentId} linked to experiment ${experimentId}`);
      
      return updatedExperiment;
    } catch (error) {
      logger.error(`Failed to link environment to experiment ${experimentId}`, error);
      throw error;
    }
  }
  
  /**
   * Register for experiment events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  }
  
  /**
   * Unregister from experiment events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    this.eventEmitter.off(event, callback);
  }
}

module.exports = {
  ExperimentTrackingService,
  ExperimentStatus,
  RunStatus
}; 