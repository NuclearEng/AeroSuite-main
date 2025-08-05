/**
 * Inspections API Integration Tests
 * 
 * This file contains integration tests for the inspections API endpoints.
 * 
 * Task: TS344 - API integration tests completion
 */

const { request, generateTestData, authenticateUser } = require('./setup');
const mongoose = require('mongoose');

describe('Inspections API', () => {
  let token;
  let testInspections;
  let testSuppliers;
  let testCustomers;

  beforeEach(async () => {
    // Generate test data with related entities
    const testData = await generateTestData({ 
      customers: 2, 
      suppliers: 2,
      inspections: 5
    });
    
    testInspections = testData.inspections;
    testSuppliers = testData.suppliers;
    testCustomers = testData.customers;
    
    // Authenticate user to get token
    token = await authenticateUser();
  });

  describe('GET /api/inspections', () => {
    test('should get list of inspections', async () => {
      const response = await request
        .get('/api/inspections')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(5);
    });

    test('should support pagination', async () => {
      const response = await request
        .get('/api/inspections?page=1&limit=2')
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

    test('should support filtering by status', async () => {
      // Update inspections to have different statuses
      await mongoose.connection.collection('inspections').updateMany(
        {},
        { $set: { status: 'scheduled' } }
      );
      
      // Set one inspection to completed
      await mongoose.connection.collection('inspections').updateOne(
        { _id: testInspections[0]._id },
        { $set: { status: 'completed' } }
      );

      const response = await request
        .get('/api/inspections?status=completed')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('completed');
    });

    test('should support filtering by supplier', async () => {
      const supplierId = testSuppliers[0]._id;
      
      // Update all inspections to have the same supplier
      await mongoose.connection.collection('inspections').updateMany(
        {},
        { $set: { supplierId: testSuppliers[1]._id } }
      );
      
      // Set one inspection to have our target supplier
      await mongoose.connection.collection('inspections').updateOne(
        { _id: testInspections[0]._id },
        { $set: { supplierId } }
      );

      const response = await request
        .get(`/api/inspections?supplierId=${supplierId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].supplierId.toString()).toBe(supplierId.toString());
    });

    test('should return 401 without token', async () => {
      const response = await request.get('/api/inspections');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/inspections/:id', () => {
    test('should get inspection by ID', async () => {
      const inspectionId = testInspections[0]._id;

      const response = await request
        .get(`/api/inspections/${inspectionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id.toString()).toBe(inspectionId.toString());
    });

    test('should return 404 for non-existent inspection', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request
        .get(`/api/inspections/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const inspectionId = testInspections[0]._id;

      const response = await request.get(`/api/inspections/${inspectionId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/inspections', () => {
    test('should create a new inspection', async () => {
      const supplierId = testSuppliers[0]._id;
      const customerId = testCustomers[0]._id;
      
      const newInspection = {
        title: 'New Test Inspection',
        description: 'This is a test inspection',
        scheduledDate: new Date().toISOString(),
        supplierId: supplierId.toString(),
        customerId: customerId.toString(),
        status: 'scheduled',
        type: 'quality',
        priority: 'medium',
        location: {
          name: 'Test Location',
          address: '123 Test St, Test City, TS 12345'
        }
      };

      const response = await request
        .post('/api/inspections')
        .set('Authorization', `Bearer ${token}`)
        .send(newInspection);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(newInspection.title);
      expect(response.body.data.supplierId).toBe(supplierId.toString());
      expect(response.body.data.customerId).toBe(customerId.toString());
      expect(response.body.data._id).toBeDefined();
    });

    test('should return validation error for invalid input', async () => {
      const invalidInspection = {
        // Missing required fields
        title: 'Invalid Inspection'
      };

      const response = await request
        .post('/api/inspections')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidInspection);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const supplierId = testSuppliers[0]._id;
      const customerId = testCustomers[0]._id;
      
      const newInspection = {
        title: 'New Test Inspection',
        scheduledDate: new Date().toISOString(),
        supplierId: supplierId.toString(),
        customerId: customerId.toString()
      };

      const response = await request
        .post('/api/inspections')
        .send(newInspection);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/inspections/:id', () => {
    test('should update an inspection', async () => {
      const inspectionId = testInspections[0]._id;
      const updateData = {
        title: 'Updated Inspection Title',
        status: 'in-progress',
        notes: 'Updated notes for the inspection'
      };

      const response = await request
        .put(`/api/inspections/${inspectionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.notes).toBe(updateData.notes);
      expect(response.body.data._id.toString()).toBe(inspectionId.toString());
    });

    test('should return 404 for non-existent inspection', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { title: 'Updated Title' };

      const response = await request
        .put(`/api/inspections/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const inspectionId = testInspections[0]._id;
      const updateData = { title: 'Updated Title' };

      const response = await request
        .put(`/api/inspections/${inspectionId}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/inspections/:id', () => {
    test('should delete an inspection', async () => {
      const inspectionId = testInspections[0]._id;

      const response = await request
        .delete(`/api/inspections/${inspectionId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify inspection is actually deleted
      const inspectionExists = await mongoose.connection.collection('inspections').findOne({ _id: inspectionId });
      expect(inspectionExists).toBeNull();
    });

    test('should return 404 for non-existent inspection', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request
        .delete(`/api/inspections/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const inspectionId = testInspections[0]._id;

      const response = await request
        .delete(`/api/inspections/${inspectionId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/inspections/:id/complete', () => {
    test('should mark an inspection as completed', async () => {
      const inspectionId = testInspections[0]._id;
      
      // Ensure inspection is in scheduled state
      await mongoose.connection.collection('inspections').updateOne(
        { _id: inspectionId },
        { $set: { status: 'scheduled' } }
      );
      
      const completionData = {
        notes: 'Inspection completed successfully',
        findings: [
          { 
            category: 'observation',
            description: 'All quality standards met',
            severity: 'none'
          }
        ],
        passedInspection: true
      };

      const response = await request
        .post(`/api/inspections/${inspectionId}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send(completionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.completedAt).toBeDefined();
      expect(response.body.data.notes).toBe(completionData.notes);
      expect(response.body.data.findings).toEqual(expect.arrayContaining([
        expect.objectContaining(completionData.findings[0])
      ]));
    });

    test('should return 400 for already completed inspection', async () => {
      const inspectionId = testInspections[0]._id;
      
      // Set inspection as already completed
      await mongoose.connection.collection('inspections').updateOne(
        { _id: inspectionId },
        { 
          $set: { 
            status: 'completed',
            completedAt: new Date()
          } 
        }
      );
      
      const completionData = {
        notes: 'Trying to complete again',
        passedInspection: true
      };

      const response = await request
        .post(`/api/inspections/${inspectionId}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send(completionData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already completed');
    });

    test('should return 404 for non-existent inspection', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const completionData = {
        notes: 'Completing non-existent inspection',
        passedInspection: true
      };

      const response = await request
        .post(`/api/inspections/${nonExistentId}/complete`)
        .set('Authorization', `Bearer ${token}`)
        .send(completionData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
}); 