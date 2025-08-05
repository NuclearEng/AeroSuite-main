/**
 * Customers API Integration Tests
 * 
 * This file contains integration tests for the customers API endpoints.
 * 
 * Task: TS344 - API integration tests completion
 */

const { request, generateTestData, authenticateUser } = require('./setup');
const mongoose = require('mongoose');

describe('Customers API', () => {
  let token;
  let testCustomers;

  beforeEach(async () => {
    // Generate test data
    const testData = await generateTestData({ customers: 5 });
    testCustomers = testData.customers;
    
    // Authenticate user to get token
    token = await authenticateUser();
  });

  describe('GET /api/customers', () => {
    test('should get list of customers', async () => {
      const response = await request
        .get('/api/customers')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(5);
    });

    test('should support pagination', async () => {
      const response = await request
        .get('/api/customers?page=1&limit=2')
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
      // Update first customer name to make it searchable
      const customerId = testCustomers[0]._id;
      await mongoose.connection.collection('customers').updateOne(
        { _id: customerId },
        { $set: { name: 'Unique Customer Name' } }
      );

      const response = await request
        .get('/api/customers?name=Unique')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Unique Customer Name');
    });

    test('should return 401 without token', async () => {
      const response = await request.get('/api/customers');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/customers/:id', () => {
    test('should get customer by ID', async () => {
      const customerId = testCustomers[0]._id;

      const response = await request
        .get(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data._id.toString()).toBe(customerId.toString());
    });

    test('should return 404 for non-existent customer', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request
        .get(`/api/customers/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const customerId = testCustomers[0]._id;

      const response = await request.get(`/api/customers/${customerId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/customers', () => {
    test('should create a new customer', async () => {
      const newCustomer = {
        name: 'New Test Customer',
        email: 'newcustomer@example.com',
        phone: '555-123-4567',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country'
        },
        industry: 'Technology',
        notes: 'Test customer notes'
      };

      const response = await request
        .post('/api/customers')
        .set('Authorization', `Bearer ${token}`)
        .send(newCustomer);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(newCustomer.name);
      expect(response.body.data.email).toBe(newCustomer.email);
      expect(response.body.data._id).toBeDefined();
    });

    test('should return validation error for invalid input', async () => {
      const invalidCustomer = {
        // Missing required name field
        email: 'invalid@example.com'
      };

      const response = await request
        .post('/api/customers')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidCustomer);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const newCustomer = {
        name: 'New Test Customer',
        email: 'newcustomer@example.com'
      };

      const response = await request
        .post('/api/customers')
        .send(newCustomer);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/customers/:id', () => {
    test('should update a customer', async () => {
      const customerId = testCustomers[0]._id;
      const updateData = {
        name: 'Updated Customer Name',
        email: 'updated@example.com'
      };

      const response = await request
        .put(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);
      expect(response.body.data._id.toString()).toBe(customerId.toString());
    });

    test('should return 404 for non-existent customer', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = { name: 'Updated Name' };

      const response = await request
        .put(`/api/customers/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const customerId = testCustomers[0]._id;
      const updateData = { name: 'Updated Name' };

      const response = await request
        .put(`/api/customers/${customerId}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    test('should delete a customer', async () => {
      const customerId = testCustomers[0]._id;

      const response = await request
        .delete(`/api/customers/${customerId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify customer is actually deleted
      const customerExists = await mongoose.connection.collection('customers').findOne({ _id: customerId });
      expect(customerExists).toBeNull();
    });

    test('should return 404 for non-existent customer', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request
        .delete(`/api/customers/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 without token', async () => {
      const customerId = testCustomers[0]._id;

      const response = await request
        .delete(`/api/customers/${customerId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
}); 