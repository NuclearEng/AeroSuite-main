/**
 * Suppliers API Integration Tests
 * 
 * This file contains integration tests for the suppliers API endpoints.
 * 
 * Task: TS344 - API integration tests completion
 */

const { request, generateTestData, authenticateUser } = require('./setup');
const mongoose = require('mongoose');

describe('Suppliers API', () => {
  let token;
  let testSuppliers;

  beforeEach(async () => {
    // Generate test data
    const testData = await generateTestData({ suppliers: 5 });
    testSuppliers = testData.suppliers;
    
    // Authenticate user to get token
    token = await authenticateUser();
  });

  describe('GET /api/suppliers', () => {
    test('should get list of suppliers', async () => {
      const response = await request
        .get('/api/suppliers')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(5);
    });

    test('should support pagination', async () => {
      const response = await request
        .get('/api/suppliers?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.totalPages).toBe(3);
      expect(response.body.pagination.currentPage).toBe(1);
    });

    test('should support filtering by name', async () => {
      // Update first supplier name to make it searchable
      const supplierId = testSuppliers[0]._id;
      await mongoose.connection.collection('suppliers').updateOne(
        { _id: supplierId },
        { $set: { name: 'Unique Supplier Name' } }
      );

      const response = await request
        .get('/api/suppliers?name=Unique')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Unique Supplier Name');
    });

    test('should support filtering by status', async () => {
      // Update suppliers to have different statuses
      await mongoose.connection.collection('suppliers').updateMany(
        {},
        { $set: { status: 'pending' } }
      );
      
      // Set one supplier to approved
      await mongoose.connection.collection('suppliers').updateOne(
        { _id: testSuppliers[0]._id },
        { $set: { status: 'approved' } }
      );

      const response = await request
        .get('/api/suppliers?status=approved')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('approved');
    });

    test('should return 401 without token', async () => {
      const response = await request.get('/api/suppliers');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/suppliers/:id', () => {
    test('should get supplier by ID', async () => {
      const supplierId = testSuppliers[0]._id;

      const response = await request
        .get(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id.toString()).toBe(supplierId.toString());
    });

    test('should return 404 for non-existent supplier', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request
        .get(`/api/suppliers/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const supplierId = testSuppliers[0]._id;

      const response = await request.get(`/api/suppliers/${supplierId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/suppliers', () => {
    test('should create a new supplier', async () => {
      const newSupplier = {
        name: 'New Test Supplier',
        email: 'newsupplier@example.com',
        phone: '555-123-4567',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        },
        category: 'hardware',
        status: 'active',
        notes: 'Test supplier notes'
      };

      const response = await request
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${token}`)
        .send(newSupplier);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(newSupplier.name);
      expect(response.body.data.email).toBe(newSupplier.email);
      expect(response.body.data._id).toBeDefined();
    });

    test('should return validation error for invalid input', async () => {
      const invalidSupplier = {
        // Missing required name field
        email: 'invalid@example.com'
      };

      const response = await request
        .post('/api/suppliers')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidSupplier);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const newSupplier = {
        name: 'New Test Supplier',
        email: 'newsupplier@example.com'
      };

      const response = await request
        .post('/api/suppliers')
        .send(newSupplier);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/suppliers/:id', () => {
    test('should update a supplier', async () => {
      const supplierId = testSuppliers[0]._id;
      const updateData = {
        name: 'Updated Supplier Name',
        email: 'updated@example.com',
        status: 'approved'
      };

      const response = await request
        .put(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data._id.toString()).toBe(supplierId.toString());
    });

    test('should return 404 for non-existent supplier', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { name: 'Updated Name' };

      const response = await request
        .put(`/api/suppliers/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const supplierId = testSuppliers[0]._id;
      const updateData = { name: 'Updated Name' };

      const response = await request
        .put(`/api/suppliers/${supplierId}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/suppliers/:id', () => {
    test('should delete a supplier', async () => {
      const supplierId = testSuppliers[0]._id;

      const response = await request
        .delete(`/api/suppliers/${supplierId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify supplier is actually deleted
      const supplierExists = await mongoose.connection.collection('suppliers').findOne({ _id: supplierId });
      expect(supplierExists).toBeNull();
    });

    test('should return 404 for non-existent supplier', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request
        .delete(`/api/suppliers/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const supplierId = testSuppliers[0]._id;

      const response = await request
        .delete(`/api/suppliers/${supplierId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/suppliers/:id/performance', () => {
    test('should get supplier performance metrics', async () => {
      const supplierId = testSuppliers[0]._id;
      
      // Add some performance data for the supplier
      await mongoose.connection.collection('supplierPerformance').insertOne({
        supplierId,
        qualityScore: 85,
        deliveryScore: 90,
        responseTimeScore: 75,
        lastUpdated: new Date(),
        metrics: {
          defectRate: 2.3,
          onTimeDelivery: 92.5,
          responseTime: 24
        }
      });

      const response = await request
        .get(`/api/suppliers/${supplierId}/performance`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.supplierId.toString()).toBe(supplierId.toString());
      expect(response.body.data.qualityScore).toBe(85);
      expect(response.body.data.deliveryScore).toBe(90);
    });

    test('should return 404 for supplier without performance data', async () => {
      const supplierId = testSuppliers[1]._id;

      const response = await request
        .get(`/api/suppliers/${supplierId}/performance`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const supplierId = testSuppliers[0]._id;

      const response = await request
        .get(`/api/suppliers/${supplierId}/performance`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
}); 