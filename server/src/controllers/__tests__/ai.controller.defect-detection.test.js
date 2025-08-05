const request = require('supertest');
const express = require('express');
const aiController = require('../ai.controller');

const app = express();
app.use(express.json());
app.post('/api/v1/ai/defect-detection', aiController.runDefectDetection);

describe('POST /api/v1/ai/defect-detection', () => {
  it('should return 400 if image is missing', async () => {
    const res = await request(app)
      .post('/api/v1/ai/defect-detection')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('should return predictions for valid image', async () => {
    // Mock aiFramework
    aiController.__setMockFramework({
      runDefectDetectionPipeline: async () => ({
        predictions: [
          { label: 'scratch', confidence: 0.95 }
        ]
      })
    });
    const res = await request(app)
      .post('/api/v1/ai/defect-detection')
      .send({ image: 'data:image/png;base64,AAAA', options: { threshold: 0.5 } });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.predictions).toBeDefined();
  });
}); 