jest.mock('socket.io', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
  }));
});

jest.mock('../../infrastructure/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const request = require('supertest');
const { app } = require('../../app');
const jwt = require('jsonwebtoken');
const testDataGenerator = require('../utils/testDataGenerator');

// Helper to generate a valid JWT for a test user
function getAuthToken(user = { id: 'test-user-id', role: 'user' }) {
  return jwt.sign(user, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
}

describe('AI API Integration Tests', () => {
  describe('POST /api/v1/ai/analysis', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/v1/ai/analysis')
        .send({ data: [{ a: 1 }] });
      
      expect(res.status).toBe(401);
    });

    it('should return 400 if no data is provided', async () => {
      const token = getAuthToken();
      
      const res = await request(app)
        .post('/api/v1/ai/analysis')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('status', 'error');
      expect(res.body).toHaveProperty('message');
    });

    it('should analyze numeric array data successfully', async () => {
      const token = getAuthToken();
      const testData = [
        { value: 10, category: 'A' },
        { value: 20, category: 'B' },
        { value: 30, category: 'A' }
      ];
      
      const res = await request(app)
        .post('/api/v1/ai/analysis')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: testData });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('analysis');
      expect(res.body.analysis).toHaveProperty('receivedType', 'array');
      expect(res.body.analysis).toHaveProperty('itemCount', 3);
      expect(res.body.analysis.summary).toHaveProperty('value');
    });

    it('should analyze object data successfully', async () => {
      const token = getAuthToken();
      const testData = {
        name: 'Test Object',
        values: [1, 2, 3],
        active: true
      };
      
      const res = await request(app)
        .post('/api/v1/ai/analysis')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: testData });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('analysis');
      expect(res.body.analysis).toHaveProperty('receivedType', 'object');
      expect(res.body.analysis).toHaveProperty('fieldTypes');
    });

    it('should analyze complex supplier data successfully', async () => {
      const token = getAuthToken();
      const supplierData = testDataGenerator.generateSupplier();
      
      const res = await request(app)
        .post('/api/v1/ai/analysis')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: supplierData });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('analysis');
      expect(res.body.analysis).toHaveProperty('suggestedAnalysis');
    });

    it('should respect analysis options', async () => {
      const token = getAuthToken();
      const testData = testDataGenerator.generateAnalysisDataset('time-series', 20);
      const options = { 
        analysisType: 'time-series',
        includeOutliers: true
      };
      
      const res = await request(app)
        .post('/api/v1/ai/analysis')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: testData, options });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('analysis');
      expect(res.body.analysis).toHaveProperty('timeSeriesAnalysis');
      expect(res.body.analysis).toHaveProperty('outliers');
    });

    it('should handle invalid token', async () => {
      const res = await request(app)
        .post('/api/v1/ai/analysis')
        .set('Authorization', 'Bearer invalid-token')
        .send({ data: [{ a: 1 }] });
      
      expect(res.status).toBe(401);
    });

    it('should handle errors gracefully', async () => {
      const token = getAuthToken();
      // Circular reference will cause JSON serialization error
      const circularObj = {};
      circularObj.self = circularObj;
      
      const res = await request(app)
        .post('/api/v1/ai/analysis')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: circularObj });
      
      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('status', 'error');
    });
  });
}); 