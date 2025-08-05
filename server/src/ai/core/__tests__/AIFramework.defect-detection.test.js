const { aiFramework } = require('../AIFramework');

describe('AIFramework Defect Detection Pipeline (AI001)', () => {
  it('should have defect-detection-pipeline registered', () => {
    const pipeline = aiFramework.pipelines.get('defect-detection-pipeline');
    expect(pipeline).toBeDefined();
    expect(pipeline.steps.length).toBeGreaterThan(0);
  });

  it('should execute the pipeline and filter predictions by confidence', async () => {
    // Mock input image (array of numbers)
    const input = Array(640 * 640 * 3).fill(0.5); // Simulate normalized image
    // Mock model in framework
    aiFramework.models.set('defect-detection', {
      id: 'defect-detection',
      type: 'custom',
      status: 'ready',
      instance: {
        predict: async () => ({
          predictions: [
            { label: 'scratch', confidence: 0.9 },
            { label: 'dent', confidence: 0.4 }
          ]
        })
      }
    });
    const result = await aiFramework.runDefectDetectionPipeline(input, { threshold: 0.5 });
    expect(result.predictions).toHaveLength(1);
    expect(result.predictions[0].label).toBe('scratch');
  });
}); 