/**
 * Test Data Generator
 * 
 * Generates realistic test data for testing purposes using @faker-js/faker.
 * Part of TS356: Test data generation implementation
 */

const { faker } = require('@faker-js/faker');

/**
 * Generate a random user with realistic data
 * @param {Object} overrides - Properties to override in the generated user
 * @returns {Object} User object
 */
function generateUser(overrides = {}) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    firstName,
    lastName,
    email: faker.internet.email({ firstName, lastName }),
    password: faker.internet.password({ length: 12 }),
    role: faker.helpers.arrayElement(['admin', 'manager', 'inspector', 'user']),
    phoneNumber: faker.phone.number(),
    isActive: faker.datatype.boolean({ probability: 0.9 }),
    emailVerified: faker.datatype.boolean({ probability: 0.95 }),
    lastLogin: faker.date.recent(),
    preferences: {
      theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
      notifications: faker.datatype.boolean(),
      language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
    },
    ...overrides
  };
}

/**
 * Generate a random supplier with realistic data
 * @param {Object} overrides - Properties to override in the generated supplier
 * @returns {Object} Supplier object
 */
function generateSupplier(overrides = {}) {
  const name = faker.company.name();
  const address = {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    country: faker.location.country()
  };
  
  return {
    name,
    code: faker.string.alphanumeric(6).toUpperCase(),
    address,
    contactPerson: {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number()
    },
    category: faker.helpers.arrayElement(['Raw Materials', 'Components', 'Services', 'Equipment']),
    status: faker.helpers.arrayElement(['Active', 'Inactive', 'Pending', 'Suspended']),
    qualificationStatus: faker.helpers.arrayElement(['Qualified', 'Provisional', 'Under Review', 'Not Qualified']),
    riskLevel: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
    performanceMetrics: {
      qualityScore: faker.number.float({ min: 60, max: 100, precision: 0.1 }),
      deliveryScore: faker.number.float({ min: 60, max: 100, precision: 0.1 }),
      responseTime: faker.number.float({ min: 1, max: 10, precision: 0.1 }),
      costEfficiency: faker.number.float({ min: 60, max: 100, precision: 0.1 }),
    },
    certifications: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
      name: faker.helpers.arrayElement(['ISO 9001', 'ISO 14001', 'AS9100', 'IATF 16949', 'ISO 13485']),
      issueDate: faker.date.past(),
      expiryDate: faker.date.future(),
      certificationBody: faker.company.name(),
      documentUrl: faker.internet.url()
    })),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides
  };
}

/**
 * Generate a random inspection with realistic data
 * @param {Object} overrides - Properties to override in the generated inspection
 * @returns {Object} Inspection object
 */
function generateInspection(overrides = {}) {
  const startDate = faker.date.recent();
  const endDate = faker.date.soon({ refDate: startDate });
  
  const checklistItems = Array.from({ length: faker.number.int({ min: 5, max: 15 }) }, () => ({
    id: faker.string.uuid(),
    description: faker.lorem.sentence(),
    result: faker.helpers.arrayElement(['Pass', 'Fail', 'N/A']),
    notes: faker.lorem.sentence(),
    severity: faker.helpers.arrayElement(['Critical', 'Major', 'Minor']),
    completed: faker.datatype.boolean({ probability: 0.9 })
  }));
  
  const defects = Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => ({
    id: faker.string.uuid(),
    description: faker.lorem.sentence(),
    category: faker.helpers.arrayElement(['Dimensional', 'Visual', 'Functional', 'Material']),
    severity: faker.helpers.arrayElement(['Critical', 'Major', 'Minor']),
    location: faker.lorem.words(2),
    images: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
      url: faker.image.url(),
      caption: faker.lorem.sentence()
    })),
    measurements: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
      name: faker.lorem.word(),
      value: faker.number.float({ min: 0, max: 100, precision: 0.01 }),
      unit: faker.helpers.arrayElement(['mm', 'cm', 'in', 'kg', 'g']),
      tolerance: {
        min: faker.number.float({ min: 0, max: 10, precision: 0.01 }),
        max: faker.number.float({ min: 10, max: 20, precision: 0.01 })
      }
    }))
  }));
  
  return {
    inspectionNumber: `INS-${faker.string.alphanumeric(8).toUpperCase()}`,
    type: faker.helpers.arrayElement(['Incoming', 'In-Process', 'Final', 'Audit']),
    status: faker.helpers.arrayElement(['Scheduled', 'In Progress', 'Completed', 'Cancelled']),
    supplierId: faker.string.uuid(),
    customerId: faker.string.uuid(),
    productId: faker.string.uuid(),
    lotNumber: faker.string.alphanumeric(10).toUpperCase(),
    scheduledDate: faker.date.soon(),
    startDate,
    endDate,
    location: faker.helpers.arrayElement(['Supplier Site', 'Customer Site', 'Third Party']),
    inspector: {
      id: faker.string.uuid(),
      name: faker.person.fullName()
    },
    checklistItems,
    defects,
    result: faker.helpers.arrayElement(['Accepted', 'Rejected', 'Accepted with Deviation']),
    notes: faker.lorem.paragraph(),
    attachments: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
      name: `${faker.lorem.word()}.${faker.helpers.arrayElement(['pdf', 'jpg', 'png', 'xlsx'])}`,
      url: faker.internet.url(),
      size: faker.number.int({ min: 100000, max: 5000000 })
    })),
    signatures: {
      inspector: faker.datatype.boolean({ probability: 0.9 }),
      supervisor: faker.datatype.boolean({ probability: 0.7 }),
      customer: faker.datatype.boolean({ probability: 0.5 })
    },
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides
  };
}

/**
 * Generate a random customer with realistic data
 * @param {Object} overrides - Properties to override in the generated customer
 * @returns {Object} Customer object
 */
function generateCustomer(overrides = {}) {
  const name = faker.company.name();
  
  return {
    name,
    code: faker.string.alphanumeric(6).toUpperCase(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country()
    },
    contacts: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
      name: faker.person.fullName(),
      position: faker.person.jobTitle(),
      email: faker.internet.email(),
      phone: faker.phone.number()
    })),
    industry: faker.helpers.arrayElement(['Aerospace', 'Automotive', 'Electronics', 'Medical', 'Consumer Goods']),
    status: faker.helpers.arrayElement(['Active', 'Inactive', 'Prospect']),
    accountManager: {
      id: faker.string.uuid(),
      name: faker.person.fullName()
    },
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides
  };
}

/**
 * Generate a dataset for AI analysis testing
 * @param {String} type - Type of dataset to generate (numeric, categorical, time-series)
 * @param {Number} size - Number of records to generate
 * @returns {Array} Dataset for AI analysis
 */
function generateAnalysisDataset(type = 'numeric', size = 50) {
  switch (type) {
    case 'numeric':
      return Array.from({ length: size }, () => ({
        id: faker.string.uuid(),
        value1: faker.number.float({ min: 0, max: 100, precision: 0.01 }),
        value2: faker.number.float({ min: 0, max: 50, precision: 0.01 }),
        value3: faker.number.float({ min: -20, max: 20, precision: 0.01 }),
        category: faker.helpers.arrayElement(['A', 'B', 'C']),
        timestamp: faker.date.recent()
      }));
      
    case 'categorical':
      return Array.from({ length: size }, () => ({
        id: faker.string.uuid(),
        category1: faker.helpers.arrayElement(['Red', 'Green', 'Blue', 'Yellow']),
        category2: faker.helpers.arrayElement(['Small', 'Medium', 'Large']),
        category3: faker.helpers.arrayElement(['High', 'Medium', 'Low']),
        value: faker.number.float({ min: 0, max: 100, precision: 0.01 }),
        timestamp: faker.date.recent()
      }));
      
    case 'time-series':
      const startDate = faker.date.past({ years: 1 });
      return Array.from({ length: size }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return {
          id: faker.string.uuid(),
          date,
          value1: faker.number.float({ min: 0, max: 100, precision: 0.01 }),
          value2: faker.number.float({ min: 0, max: 50, precision: 0.01 }),
          trend: faker.helpers.arrayElement(['Increasing', 'Decreasing', 'Stable'])
        };
      });
      
    default:
      return Array.from({ length: size }, () => ({
        id: faker.string.uuid(),
        name: faker.lorem.word(),
        value: faker.number.float({ min: 0, max: 100, precision: 0.01 }),
        category: faker.helpers.arrayElement(['A', 'B', 'C']),
        timestamp: faker.date.recent()
      }));
  }
}

/**
 * Generate a batch of test data
 * @param {Object} options - Configuration for data generation
 * @returns {Object} Batch of test data
 */
function generateTestDataBatch(options = {}) {
  const {
    userCount = 5,
    supplierCount = 10,
    customerCount = 8,
    inspectionCount = 15,
    analysisDatasetSize = 50,
    analysisDatasetType = 'numeric'
  } = options;
  
  return {
    users: Array.from({ length: userCount }, () => generateUser()),
    suppliers: Array.from({ length: supplierCount }, () => generateSupplier()),
    customers: Array.from({ length: customerCount }, () => generateCustomer()),
    inspections: Array.from({ length: inspectionCount }, () => generateInspection()),
    analysisData: generateAnalysisDataset(analysisDatasetType, analysisDatasetSize)
  };
}

module.exports = {
  generateUser,
  generateSupplier,
  generateCustomer,
  generateInspection,
  generateAnalysisDataset,
  generateTestDataBatch
}; 