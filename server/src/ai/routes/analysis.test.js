const request = require('supertest');
const path = require('path');
const jestOpenAPI = require('jest-openapi');
const app = require('../../app');

beforeAll(() => {
  jestOpenAPI(path.join(__dirname, '../../openapi.yaml'));
});

describe('POST /api/v1/ai/analysis', () => {
  it('returns 400 for invalid data', async () => {
    const res = await request(app)
      .post('/api/v1/ai/analysis')
      .send({ data: null });
    expect(res.statusCode).toBe(400);
    expect(res).toSatisfyApiSpec();
  });

  it('returns analysis for valid data', async () => {
    const res = await request(app)
      .post('/api/v1/ai/analysis')
      .send({ data: [{ value: 1 }, { value: 2 }] });
    expect(res.statusCode).toBe(200);
    expect(res.body.analysis).toBeDefined();
    expect(res).toSatisfyApiSpec();
  });

  it('response matches OpenAPI schema (stub)', async () => {
    // TODO: Integrate with OpenAPI schema validation tool (e.g., jest-openapi)
    // Example:
    // expect(res).toSatisfyApiSpec();
  });
}); 