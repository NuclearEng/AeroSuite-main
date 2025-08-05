const { AutomatedRetrainingService } = require('../AutomatedRetrainingService');

// Mocks for dependencies
const mockDataDriftService = { eventEmitter: { on: jest.fn() } };
const mockModelPerformanceService = { eventEmitter: { on: jest.fn() } };
const mockTrainingEnvironmentService = {
  createEnvironment: jest.fn().mockResolvedValue({ id: 'env-1' }),
  startEnvironment: jest.fn().mockResolvedValue(true)
};
const mockExperimentTrackingService = {
  createExperiment: jest.fn().mockResolvedValue({ id: 'exp-1' }),
  linkEnvironment: jest.fn().mockResolvedValue(true)
};
const mockModelRegistry = {
  getModelMetadata: jest.fn().mockReturnValue({ framework: 'tensorflow', dependencies: [] })
};

jest.mock('../../index', () => ({
  dataDriftService: mockDataDriftService,
  modelPerformanceService: mockModelPerformanceService,
  trainingEnvironmentService: mockTrainingEnvironmentService,
  experimentTrackingService: mockExperimentTrackingService,
  modelRegistry: mockModelRegistry
}));

describe('AutomatedRetrainingService', () => {
  let service;
  let notify;
  beforeEach(() => {
    jest.clearAllMocks();
    notify = jest.fn();
    service = new AutomatedRetrainingService({
      retrainCooldownMs: 1000,
      notify,
      modelConfig: {
        'model-1': { performanceMetric: 'accuracy', performanceThreshold: 0.9, retrainCooldownMs: 1000 }
      }
    });
  });

  it('should trigger retraining on drift event (high severity)', async () => {
    await service.triggerRetraining('model-1', 'drift', { modelId: 'model-1', severity: 'high' });
    expect(mockTrainingEnvironmentService.createEnvironment).toHaveBeenCalled();
    expect(mockTrainingEnvironmentService.startEnvironment).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('retraining-started', expect.objectContaining({ modelId: 'model-1' }));
  });

  it('should not retrain if cooldown is active', async () => {
    await service.triggerRetraining('model-1', 'drift', { modelId: 'model-1', severity: 'high' });
    await service.triggerRetraining('model-1', 'drift', { modelId: 'model-1', severity: 'high' });
    expect(mockTrainingEnvironmentService.createEnvironment).toHaveBeenCalledTimes(1);
  });

  it('should trigger retraining on performance drop', async () => {
    await service.triggerRetraining('model-1', 'performance', { modelId: 'model-1', metricName: 'accuracy', value: 0.85 });
    expect(mockTrainingEnvironmentService.createEnvironment).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('retraining-started', expect.objectContaining({ modelId: 'model-1' }));
  });

  it('should call notification callback on retrain failure', async () => {
    mockTrainingEnvironmentService.createEnvironment.mockRejectedValueOnce(new Error('fail'));
    await service.triggerRetraining('model-1', 'drift', { modelId: 'model-1', severity: 'high' });
    expect(notify).toHaveBeenCalledWith('retraining-failed', expect.objectContaining({ modelId: 'model-1' }));
  });
}); 