const ModelPerformanceService = require('../ModelPerformanceService');

describe('ModelPerformanceService', () => {
  let service;

  beforeEach(() => {
    service = new ModelPerformanceService();
    // Mock internal data or methods as needed
    service.metricsStore = {
      'modelA': {
        accuracy: [
          { timestamp: '2024-06-01T00:00:00Z', value: 0.95 },
          { timestamp: '2024-06-02T00:00:00Z', value: 0.96 }
        ],
        latency: [
          { timestamp: '2024-06-01T00:00:00Z', value: 120 },
          { timestamp: '2024-06-02T00:00:00Z', value: 110 }
        ]
      }
    };
  });

  test('getModelMetrics returns metrics for valid model and metricType', async () => {
    const result = await service.getModelMetrics('modelA', 'accuracy', 'all');
    expect(result.dataPoints).toHaveLength(2);
    expect(result.dataPoints[0].value).toBe(0.95);
  });

  test('getModelMetrics returns empty for invalid modelId', async () => {
    const result = await service.getModelMetrics('invalidModel', 'accuracy', 'all');
    expect(result.dataPoints).toHaveLength(0);
  });

  test('getModelMetrics returns empty for missing metricType', async () => {
    const result = await service.getModelMetrics('modelA', 'nonexistent', 'all');
    expect(result.dataPoints).toHaveLength(0);
  });

  test('getAllMetrics aggregates metrics across models', async () => {
    const result = await service.getAllMetrics('accuracy', 'all');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  test('getAggregatedMetrics returns aggregated metrics', async () => {
    const result = await service.getAggregatedMetrics('accuracy', 'all');
    expect(Array.isArray(result)).toBe(true);
  });

  test('getModelMetrics handles timeWindow edge case', async () => {
    const result = await service.getModelMetrics('modelA', 'accuracy', '1d');
    expect(Array.isArray(result.dataPoints)).toBe(true);
  });
}); 