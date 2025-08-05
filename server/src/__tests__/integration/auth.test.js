/**
 * Authentication API Integration Tests
 * 
 * This file contains integration tests for the authentication API endpoints.
 * 
 * Task: TS344 - API integration tests completion
 */

const { request, generateTestData } = require('./setup');
const mongoose = require('mongoose');

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });

    test('should return validation error for invalid input', async () => {
      const invalidUserData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'weak',
        confirmPassword: 'weak'
      };

      const response = await request
        .post('/api/auth/register')
        .send(invalidUserData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    test('should return error for existing email', async () => {
      // First create a user
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      await request
        .post('/api/auth/register')
        .send(userData);

      // Try to register with the same email
      const response = await request
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await mongoose.connection.collection('users').insertOne({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        // Hash for 'Password123!'
        password: '$2b$10$PziV6adIkZDRQzpVjBLR3OP5jJc7coZ1.dTrjfAYdA13tLUH9I/Gi',
        isActive: true,
        emailVerified: true,
        role: 'user'
      });
    });

    test('should login successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const response = await request
        .post('/api/auth/login')
        .send(credentials);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    test('should return error for invalid credentials', async () => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      const response = await request
        .post('/api/auth/login')
        .send(invalidCredentials);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should return error for non-existent user', async () => {
      const nonExistentUser = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };

      const response = await request
        .post('/api/auth/login')
        .send(nonExistentUser);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      // Create a test user
      await mongoose.connection.collection('users').insertOne({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: '$2b$10$PziV6adIkZDRQzpVjBLR3OP5jJc7coZ1.dTrjfAYdA13tLUH9I/Gi',
        isActive: true,
        emailVerified: true
      });
    });

    test('should send password reset email', async () => {
      const response = await request
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password reset email sent');
    });

    test('should return 404 for non-existent email', async () => {
      const response = await request
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      // Create a test user
      await mongoose.connection.collection('users').insertOne({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: '$2b$10$PziV6adIkZDRQzpVjBLR3OP5jJc7coZ1.dTrjfAYdA13tLUH9I/Gi',
        isActive: true,
        emailVerified: true,
        role: 'user'
      });

      // Login to get token
      const loginResponse = await request
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      token = loginResponse.body.token;
    });

    test('should get current user profile', async () => {
      const response = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe('test@example.com');
    });

    test('should return 401 without token', async () => {
      const response = await request.get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 with invalid token', async () => {
      const response = await request
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
}); 