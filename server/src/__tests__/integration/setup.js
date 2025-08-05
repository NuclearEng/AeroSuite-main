/**
 * Integration Tests Setup
 * 
 * This file contains the setup for integration tests, including database connection,
 * test server initialization, and cleanup functions.
 * 
 * Task: TS344 - API integration tests completion
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const supertest = require('supertest');
const app = require('../../app');
const TestDataGenerator = require('../utils/testDataGenerator');

let mongoServer;
let testDataGenerator;

/**
 * Connect to a new in-memory database before running any tests
 */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  // Initialize test data generator
  testDataGenerator = new TestDataGenerator();
});

/**
 * Clear all test data after each test
 */
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

/**
 * Remove and close the db and server
 */
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

/**
 * Create a supertest request object with the app
 */
const request = supertest(app);

/**
 * Generate test data and insert into database
 * @param {Object} entityCounts - Number of entities to generate for each type
 * @returns {Object} Generated entities
 */
const generateTestData = async (entityCounts) => {
  const data = testDataGenerator.generateDataset(entityCounts);
  
  // Insert data into database
  for (const [collection, documents] of Object.entries(data)) {
    if (documents.length > 0) {
      await mongoose.connection.collection(collection).insertMany(documents);
    }
  }
  
  return data;
};

/**
 * Authenticate a test user and get JWT token
 * @param {Object} credentials - User credentials
 * @returns {String} JWT token
 */
const authenticateUser = async (credentials = { email: 'admin@test.com', password: 'Password123!' }) => {
  // Create test user if it doesn't exist
  await mongoose.connection.collection('users').updateOne(
    { email: credentials.email },
    { 
      $set: {
        email: credentials.email,
        password: '$2b$10$PziV6adIkZDRQzpVjBLR3OP5jJc7coZ1.dTrjfAYdA13tLUH9I/Gi', // bcrypt hash for 'Password123!'
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        emailVerified: true
      }
    },
    { upsert: true }
  );
  
  // Authenticate and get token
  const response = await request
    .post('/api/auth/login')
    .send(credentials);
  
  return response.body.token;
};

module.exports = {
  request,
  generateTestData,
  authenticateUser
}; 