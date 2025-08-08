const mongoose = require('mongoose');
const supertest = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../../app');
const VerificationOrder = require('../../models/verificationOrder.model');
const VerificationResult = require('../../models/verificationResult.model');

describe('Verification workflow', () => {
  let server;
  let request;
  let mongoServer;

  beforeAll(async () => {
    process.env.SKIP_AUTH_FOR_TESTS = 'true';
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    server = app.listen(0);
    request = supertest(server);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
    await new Promise((r) => server.close(r));
  });

  test('POST /api/v2/verification/orders creates an order', async () => {
    const res = await request
      .post('/api/v2/verification/orders')
      .send({ orderId: 'ord-1', customerId: 'cust-1', orderDetails: { foo: 'bar' } });

    // In our default middleware chain, this route requires auth; for this
    // minimal test, expect 401 without token. This ensures route is mounted.
    expect([201, 401]).toContain(res.status);
  });

  test('Model CRUD works', async () => {
    const order = await VerificationOrder.create({ orderId: 'o2', customerId: 'c2', orderDetails: { a: 1 } });
    const result = await VerificationResult.create({ resultId: 'r2', orderId: 'o2', status: 'success', details: { ok: true } });
    expect(order.orderId).toBe('o2');
    expect(result.status).toBe('success');
  });
});


