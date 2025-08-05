/**
 * Test Data Factory
 * 
 * @task TS356 - Test data generation implementation
 * 
 * This utility provides factory functions to generate test data for automated tests.
 * It uses the testDataGenerator to create consistent, realistic test data.
 */

const testDataGenerator = require('./testDataGenerator');
const mongoose = require('mongoose');

/**
 * Generate a MongoDB ObjectId
 * @returns {string} - MongoDB ObjectId
 */
function generateObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

/**
 * Create a user object for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} - User object
 */
function createUser(overrides = {}) {
  return {
    _id: generateObjectId(),
    ...testDataGenerator.generateUser(overrides)
  };
}

/**
 * Create a customer object for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Customer object
 */
function createCustomer(overrides = {}) {
  return {
    _id: generateObjectId(),
    ...testDataGenerator.generateCustomer(overrides)
  };
}

/**
 * Create a supplier object for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Supplier object
 */
function createSupplier(overrides = {}) {
  return {
    _id: generateObjectId(),
    ...testDataGenerator.generateSupplier(overrides)
  };
}

/**
 * Create an inspection object for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Inspection object
 */
function createInspection(overrides = {}) {
  return {
    _id: generateObjectId(),
    ...testDataGenerator.generateInspection(overrides)
  };
}

/**
 * Create multiple test entities
 * @param {string} entityType - Type of entity to create (user, customer, supplier, inspection)
 * @param {number} count - Number of entities to create
 * @param {Function} overrideCallback - Optional callback to customize each entity
 * @returns {Array} - Array of created entities
 */
function createMany(entityType, count, overrideCallback = null) {
  const entities = [];
  const factoryFunctions = {
    user: createUser,
    customer: createCustomer,
    supplier: createSupplier,
    inspection: createInspection
  };
  
  const factoryFunction = factoryFunctions[entityType];
  if (!factoryFunction) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  
  for (let i = 0; i < count; i++) {
    const overrides = overrideCallback ? overrideCallback(i) : {};
    entities.push(factoryFunction(overrides));
  }
  
  return entities;
}

/**
 * Create a related set of test data
 * @param {Object} options - Configuration options
 * @returns {Object} - Object containing all created entities
 */
function createRelatedData(options = {}) {
  const {
    userCount = 2,
    customerCount = 2,
    supplierCount = 2,
    inspectionCount = 3
  } = options;
  
  // Create users
  const users = createMany('user', userCount);
  
  // Create customers
  const customers = createMany('customer', customerCount);
  
  // Create suppliers
  const suppliers = createMany('supplier', supplierCount);
  
  // Create inspections with relationships
  const inspections = [];
  for (let i = 0; i < inspectionCount; i++) {
    const inspection = createInspection({
      supplierId: suppliers[i % suppliers.length]._id,
      customerId: customers[i % customers.length]._id,
      assignedTo: users[i % users.length]._id,
      createdBy: users[(i + 1) % users.length]._id
    });
    
    inspections.push(inspection);
  }
  
  return {
    users,
    customers,
    suppliers,
    inspections
  };
}

/**
 * Create a test dataset with specific characteristics
 * @param {string} scenario - Scenario name (e.g., 'empty', 'basic', 'complex')
 * @returns {Object} - Object containing the test dataset
 */
function createTestScenario(scenario) {
  switch (scenario) {
    case 'empty':
      return {
        users: [],
        customers: [],
        suppliers: [],
        inspections: []
      };
      
    case 'basic':
      return createRelatedData({
        userCount: 3,
        customerCount: 2,
        supplierCount: 2,
        inspectionCount: 4
      });
      
    case 'complex':
      return createRelatedData({
        userCount: 5,
        customerCount: 10,
        supplierCount: 8,
        inspectionCount: 15
      });
      
    case 'admin-only':
      return {
        users: [createUser({ role: 'admin' })],
        customers: [],
        suppliers: [],
        inspections: []
      };
      
    case 'inspection-heavy':
      const data = createRelatedData({
        userCount: 3,
        customerCount: 2,
        supplierCount: 3,
        inspectionCount: 20
      });
      
      // Add inspections in various states
      const statuses = ['scheduled', 'in-progress', 'completed', 'cancelled', 'delayed'];
      data.inspections.forEach((inspection, i) => {
        inspection.status = statuses[i % statuses.length];
      });
      
      return data;
      
    default:
      return createRelatedData();
  }
}

module.exports = {
  createUser,
  createCustomer,
  createSupplier,
  createInspection,
  createMany,
  createRelatedData,
  createTestScenario,
  generateObjectId
}; 