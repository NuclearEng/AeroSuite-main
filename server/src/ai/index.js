/**
 * AI Module Index
 * 
 * Exports all AI/ML services and infrastructure
 * Implements RF049 - Set up ML service infrastructure
 * Implements RF051 - Create feature engineering pipeline
 * Implements RF052 - Add model registry
 * Implements RF053 - Set up containerized training environments
 * Implements RF054 - Implement experiment tracking
 * Implements RF055 - Add automated model evaluation
 * Implements RF056 - Create CI/CD pipeline for models
 * Implements RF057 - Implement performance metrics tracking
 * Implements RF058 - Add data drift detection
 */

// Core infrastructure
const MLServiceInfrastructure = require('./core/MLServiceInfrastructure');

// Services
const { MLService, getMLService, ModelType } = require('./services/MLService');
const { ModelLoaderService } = require('./services/ModelLoaderService');
const { FeatureEngineeringService, FeatureType, TransformationType } = require('./services/FeatureEngineeringService');
const { ModelRegistry, ModelStatus, ModelStage } = require('./services/ModelRegistry');
const { TrainingEnvironmentService, EnvironmentType, EnvironmentStatus } = require('./services/TrainingEnvironmentService');
const { ExperimentTrackingService, ExperimentStatus, RunStatus } = require('./services/ExperimentTrackingService');
const { ModelEvaluationService, EvaluationStatus, EvaluationType } = require('./services/ModelEvaluationService');
const { ModelCICDService, PipelineStage, PipelineStatus } = require('./services/ModelCICDService');
const { ModelPerformanceService, MetricType, TimeWindow } = require('./services/ModelPerformanceService');
const { DataDriftService, DriftType, DriftDetectionMethod, DriftSeverity } = require('./services/DataDriftService');
const { AutomatedRetrainingService } = require('./services/AutomatedRetrainingService');

// Initialize singleton instances
const mlService = getMLService();
const featureEngineeringService = new FeatureEngineeringService();
const modelRegistry = new ModelRegistry();
const trainingEnvironmentService = new TrainingEnvironmentService();
const experimentTrackingService = new ExperimentTrackingService();
const modelEvaluationService = new ModelEvaluationService({
  experimentTrackingService,
  modelRegistry
});
const modelCICDService = new ModelCICDService({
  modelRegistry,
  modelEvaluationService,
  experimentTrackingService
});
const modelPerformanceService = new ModelPerformanceService();
const dataDriftService = new DataDriftService();
const automatedRetrainingService = new AutomatedRetrainingService();

// Export all modules
module.exports = {
  // Core classes
  MLServiceInfrastructure,
  
  // Services
  MLService,
  ModelLoaderService,
  FeatureEngineeringService,
  ModelRegistry,
  TrainingEnvironmentService,
  ExperimentTrackingService,
  ModelEvaluationService,
  ModelCICDService,
  ModelPerformanceService,
  DataDriftService,
  AutomatedRetrainingService,
  
  // Singleton getters
  getMLService,
  
  // Convenience exports
  mlService,
  featureEngineeringService,
  modelRegistry,
  trainingEnvironmentService,
  experimentTrackingService,
  modelEvaluationService,
  modelCICDService,
  modelPerformanceService,
  dataDriftService,
  automatedRetrainingService,
  ModelType,
  FeatureType,
  TransformationType,
  ModelStatus,
  ModelStage,
  EnvironmentType,
  EnvironmentStatus,
  ExperimentStatus,
  RunStatus,
  EvaluationStatus,
  EvaluationType,
  PipelineStage,
  PipelineStatus,
  MetricType,
  TimeWindow,
  DriftType,
  DriftDetectionMethod,
  DriftSeverity,
  
  // Helper functions
  loadModel: (modelId, modelType, options) => mlService.loadModel(modelId, modelType, options),
  unloadModel: (modelId) => mlService.unloadModel(modelId),
  runInference: (modelId, input, options) => mlService.runInference(modelId, input, options),
  queueInference: (modelId, input, options) => mlService.queueInference(modelId, input, options),
  getAvailableModels: () => mlService.getAvailableModels(),
  getActiveModels: () => mlService.getActiveModels(),
  isModelLoaded: (modelId) => mlService.isModelLoaded(modelId),
  
  // Feature engineering helpers
  createPipeline: (pipelineId, steps) => featureEngineeringService.createPipeline(pipelineId, steps),
  fitPipeline: (pipelineId, data) => featureEngineeringService.fitPipeline(pipelineId, data),
  transformData: (pipelineId, data) => featureEngineeringService.transformData(pipelineId, data),
  getPipeline: (pipelineId) => featureEngineeringService.getPipeline(pipelineId),
  getAvailablePipelines: () => featureEngineeringService.getAvailablePipelines(),
  deletePipeline: (pipelineId) => featureEngineeringService.deletePipeline(pipelineId),
  
  // Model registry helpers
  registerModel: (modelName, metadata) => modelRegistry.registerModel(modelName, metadata),
  addModelVersion: (modelName, modelId, metadata) => modelRegistry.addModelVersion(modelName, modelId, metadata),
  getModel: (modelName) => modelRegistry.getModel(modelName),
  getModels: () => modelRegistry.getModels(),
  getModelVersion: (modelName, version) => modelRegistry.getModelVersion(modelName, version),
  updateModelVersionStatus: (modelName, version, status) => modelRegistry.updateModelVersionStatus(modelName, version, status),
  getProductionVersion: (modelName) => modelRegistry.getProductionVersion(modelName),
  getStagingVersion: (modelName) => modelRegistry.getStagingVersion(modelName),
  importModel: (modelId, modelName, metadata) => modelRegistry.importModel(modelId, modelName, metadata),
  
  // Training environment helpers
  createEnvironment: (name, type, options) => trainingEnvironmentService.createEnvironment(name, type, options),
  startEnvironment: (environmentId, trainingOptions) => trainingEnvironmentService.startEnvironment(environmentId, trainingOptions),
  stopEnvironment: (environmentId) => trainingEnvironmentService.stopEnvironment(environmentId),
  getEnvironment: (environmentId) => trainingEnvironmentService.getEnvironment(environmentId),
  getEnvironments: () => trainingEnvironmentService.getEnvironments(),
  deleteEnvironment: (environmentId) => trainingEnvironmentService.deleteEnvironment(environmentId),
  updateTrainingCode: (environmentId, codeFiles) => trainingEnvironmentService.updateTrainingCode(environmentId, codeFiles),
  updateRequirements: (environmentId, requirements) => trainingEnvironmentService.updateRequirements(environmentId, requirements),
  
  // Experiment tracking helpers
  createExperiment: (name, metadata) => experimentTrackingService.createExperiment(name, metadata),
  getExperiment: (experimentId) => experimentTrackingService.getExperiment(experimentId),
  getExperiments: (filters) => experimentTrackingService.getExperiments(filters),
  updateExperiment: (experimentId, updates) => experimentTrackingService.updateExperiment(experimentId, updates),
  deleteExperiment: (experimentId) => experimentTrackingService.deleteExperiment(experimentId),
  createRun: (experimentId, config) => experimentTrackingService.createRun(experimentId, config),
  startRun: (runId) => experimentTrackingService.startRun(runId),
  completeRun: (runId, results) => experimentTrackingService.completeRun(runId, results),
  failRun: (runId, errorMessage) => experimentTrackingService.failRun(runId, errorMessage),
  getRun: (runId) => experimentTrackingService.getRun(runId),
  getRuns: (experimentId, filters) => experimentTrackingService.getRuns(experimentId, filters),
  logMetrics: (runId, metrics) => experimentTrackingService.logMetrics(runId, metrics),
  logArtifact: (runId, name, filePath, metadata) => experimentTrackingService.logArtifact(runId, name, filePath, metadata),
  compareRuns: (runIds) => experimentTrackingService.compareRuns(runIds),
  getBestRun: (experimentId, metricName, isHigherBetter) => experimentTrackingService.getBestRun(experimentId, metricName, isHigherBetter),
  linkEnvironment: (experimentId, environmentId) => experimentTrackingService.linkEnvironment(experimentId, environmentId),
  
  // Model evaluation helpers
  createEvaluation: (name, modelId, datasetId, config) => modelEvaluationService.createEvaluation(name, modelId, datasetId, config),
  getEvaluation: (evaluationId) => modelEvaluationService.getEvaluation(evaluationId),
  getEvaluations: (filters) => modelEvaluationService.getEvaluations(filters),
  startEvaluation: (evaluationId) => modelEvaluationService.startEvaluation(evaluationId),
  compareEvaluations: (evaluationIds) => modelEvaluationService.compareEvaluations(evaluationIds),
  getBestEvaluation: (modelId, metricName, isHigherBetter) => modelEvaluationService.getBestEvaluation(modelId, metricName, isHigherBetter),
  deleteEvaluation: (evaluationId) => modelEvaluationService.deleteEvaluation(evaluationId),
  registerDataset: (datasetId, datasetPath, metadata) => modelEvaluationService.registerDataset(datasetId, datasetPath, metadata),
  getDataset: (datasetId) => modelEvaluationService.getDataset(datasetId),
  
  // Model CI/CD helpers
  createCICDPipeline: (name, modelName, modelVersion, config) => modelCICDService.createPipeline(name, modelName, modelVersion, config),
  getCICDPipeline: (pipelineId) => modelCICDService.getPipeline(pipelineId),
  getCICDPipelines: (filters) => modelCICDService.getPipelines(filters),
  startCICDPipeline: (pipelineId) => modelCICDService.startPipeline(pipelineId),
  deleteCICDPipeline: (pipelineId) => modelCICDService.deletePipeline(pipelineId),
  
  // Model performance metrics helpers
  trackInference: (modelId, latency, success, metadata) => modelPerformanceService.trackInference(modelId, latency, success, metadata),
  trackBatchInference: (modelId, latency, batchSize, success, metadata) => modelPerformanceService.trackBatchInference(modelId, latency, batchSize, success, metadata),
  trackCustomMetric: (modelId, metricName, value, metadata) => modelPerformanceService.trackCustomMetric(modelId, metricName, value, metadata),
  getModelMetrics: (modelId, metricType, timeWindow) => modelPerformanceService.getModelMetrics(modelId, metricType, timeWindow),
  getAllMetrics: (metricType, timeWindow) => modelPerformanceService.getAllMetrics(metricType, timeWindow),
  getAggregatedMetrics: (metricType, timeWindow) => modelPerformanceService.getAggregatedMetrics(metricType, timeWindow),
  
  // Data drift detection helpers
  createBaseline: (modelId, data, options) => dataDriftService.createBaseline(modelId, data, options),
  getBaseline: (modelId) => dataDriftService.getBaseline(modelId),
  detectDriftForModel: (modelId, currentData) => dataDriftService.detectDriftForModel(modelId, currentData),
  getDriftReports: (modelId, options) => dataDriftService.getDriftReports(modelId, options),
  getLatestDriftReport: (modelId) => dataDriftService.getLatestDriftReport(modelId)
}; 