const { analyzeData } = require('./foundation.service');
const testDataGenerator = require('../../__tests__/utils/testDataGenerator');

jest.mock('../../infrastructure/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('AI Foundation Service - analyzeData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return summary statistics for array of objects with numeric fields', async () => {
    const data = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
      { a: 5, b: 6 }
    ];
    const result = await analyzeData(data);
    expect(result.receivedType).toBe('array');
    expect(result.itemCount).toBe(3);
    expect(result.summary).toHaveProperty('a');
    expect(result.summary.a).toMatchObject({ min: 1, max: 5, mean: 3 });
    expect(result.summary.b).toMatchObject({ min: 2, max: 6, mean: 4 });
    expect(result.message).toMatch(/placeholder/i);
  });

  it('should handle single object data', async () => {
    const data = { a: 10, b: 20, c: 'test' };
    const result = await analyzeData(data);
    expect(result.receivedType).toBe('object');
    expect(result.fieldTypes).toEqual({
      a: 'number',
      b: 'number',
      c: 'string'
    });
    expect(result.message).toMatch(/placeholder/i);
  });

  it('should handle missing data gracefully', async () => {
    const result = await analyzeData();
    expect(result.receivedType).toBe('undefined');
    expect(result.message).toMatch(/no data/i);
  });

  it('should handle empty array data', async () => {
    const result = await analyzeData([]);
    expect(result.receivedType).toBe('array');
    expect(result.itemCount).toBe(0);
    expect(result.message).toMatch(/empty array/i);
  });

  it('should handle complex nested data structures', async () => {
    const data = {
      user: { id: 1, name: 'Test User' },
      metrics: [10, 20, 30],
      settings: { active: true }
    };
    const result = await analyzeData(data);
    expect(result.receivedType).toBe('object');
    expect(result.fieldTypes).toHaveProperty('user', 'object');
    expect(result.fieldTypes).toHaveProperty('metrics', 'array');
    expect(result.fieldTypes).toHaveProperty('settings', 'object');
    expect(result.nestedSummary).toBeDefined();
  });

  it('should handle realistic supplier data', async () => {
    const supplier = testDataGenerator.generateSupplier();
    const result = await analyzeData(supplier);
    expect(result.receivedType).toBe('object');
    expect(result.fieldTypes).toHaveProperty('name', 'string');
    expect(result.fieldTypes).toHaveProperty('performanceMetrics', 'object');
    expect(result.suggestedAnalysis).toBeDefined();
  });

  it('should handle realistic inspection data', async () => {
    const inspection = testDataGenerator.generateInspection();
    const result = await analyzeData(inspection);
    expect(result.receivedType).toBe('object');
    expect(result.fieldTypes).toHaveProperty('checklistItems', 'array');
    expect(result.fieldTypes).toHaveProperty('defects', 'array');
    expect(result.suggestedAnalysis).toBeDefined();
  });

  it('should handle time series data with options', async () => {
    const timeSeriesData = testDataGenerator.generateAnalysisDataset('time-series', 30);
    const options = { analysisType: 'time-series' };
    const result = await analyzeData(timeSeriesData, options);
    expect(result.receivedType).toBe('array');
    expect(result.itemCount).toBe(30);
    expect(result.timeSeriesAnalysis).toBeDefined();
    expect(result.timeSeriesAnalysis).toHaveProperty('hasTrend');
  });

  it('should respect options parameter for analysis customization', async () => {
    const data = testDataGenerator.generateAnalysisDataset('numeric', 20);
    const options = { 
      includeOutliers: true,
      detailedStats: true
    };
    const result = await analyzeData(data, options);
    expect(result.receivedType).toBe('array');
    expect(result.outliers).toBeDefined();
    expect(result.detailedStats).toBeDefined();
  });
}); 