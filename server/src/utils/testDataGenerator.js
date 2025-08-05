/**
 * Test Data Generator
 * 
 * This utility generates realistic test data for various entities in the application.
 * It provides both random data generation and seeded data generation for consistent test results.
 */

const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

class TestDataGenerator {
  /**
   * Create a new TestDataGenerator instance
   * @param {Object} options - Generator options
   * @param {string} options.seed - Optional seed for reproducible data generation
   */
  constructor(options = {}) {
    this.options = options;
    
    // Initialize faker with seed if provided
    if (options.seed) {
      faker.seed(this.stringToSeed(options.seed));
    }
    
    // Default counts for bulk generation
    this.defaultCounts = {
      users: 10,
      customers: 10,
      suppliers: 10,
      inspections: 20,
      products: 15,
      defects: 30
    };
  }
  
  /**
   * Convert a string to a numeric seed
   * @param {string} str - String to convert
   * @returns {number} - Numeric seed
   */
  stringToSeed(str) {
    let seed = 0;
    for (let i = 0; i < str.length; i++) {
      seed = ((seed << 5) - seed) + str.charCodeAt(i);
      seed = seed & seed; // Convert to 32bit integer
    }
    return Math.abs(seed);
  }
  
  /**
   * Generate a MongoDB ObjectId
   * @returns {string} - MongoDB ObjectId
   */
  generateObjectId() {
    return new mongoose.Types.ObjectId().toString();
  }
  
  /**
   * Generate a user object
   * @param {Object} override - Properties to override
   * @returns {Object} - User object
   */
  generateUser(override = {}) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    
    return {
      _id: this.generateObjectId(),
      firstName,
      lastName,
      email,
      password: bcrypt.hashSync('Password123!', 10),
      phoneNumber: faker.phone.number(),
      role: faker.helpers.arrayElement(['admin', 'manager', 'inspector', 'user']),
      department: faker.helpers.arrayElement(['Quality', 'Production', 'Engineering', 'Management']),
      jobTitle: faker.person.jobTitle(),
      isActive: faker.datatype.boolean(0.9), // 90% chance of being active
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent(),
      lastLogin: faker.date.recent(),
      preferences: {
        darkMode: faker.datatype.boolean(0.5),
        emailNotifications: faker.datatype.boolean(0.8),
        dashboardLayout: faker.helpers.arrayElement(['standard', 'compact', 'custom']),
        defaultView: faker.helpers.arrayElement(['dashboard', 'inspections', 'suppliers'])
      },
      profileImage: faker.image.avatar(),
      ...override
    };
  }
  
  /**
   * Generate a customer object
   * @param {Object} override - Properties to override
   * @returns {Object} - Customer object
   */
  generateCustomer(override = {}) {
    const companyName = faker.company.name();
    
    return {
      _id: this.generateObjectId(),
      name: companyName,
      contactPerson: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number()
      },
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country()
      },
      industry: faker.helpers.arrayElement(['Aerospace', 'Automotive', 'Defense', 'Electronics', 'Medical', 'Consumer Goods']),
      notes: faker.lorem.paragraph(),
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent(),
      website: faker.internet.url(),
      status: faker.helpers.arrayElement(['active', 'inactive', 'prospect']),
      ...override
    };
  }
  
  /**
   * Generate a supplier object
   * @param {Object} override - Properties to override
   * @returns {Object} - Supplier object
   */
  generateSupplier(override = {}) {
    const companyName = faker.company.name();
    const qualityScore = faker.number.float({ min: 70, max: 100, precision: 0.1 });
    const deliveryScore = faker.number.float({ min: 70, max: 100, precision: 0.1 });
    const riskLevel = qualityScore < 80 ? 'high' : (qualityScore < 90 ? 'medium' : 'low');
    
    return {
      _id: this.generateObjectId(),
      name: companyName,
      contactPerson: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number()
      },
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country()
      },
      qualifications: faker.helpers.arrayElements([
        'ISO 9001', 'AS9100', 'ISO 14001', 'IATF 16949', 'NADCAP'
      ], faker.number.int({ min: 1, max: 3 })),
      performance: {
        qualityScore,
        deliveryScore,
        lastAuditDate: faker.date.recent({ days: 90 }),
        auditResult: faker.helpers.arrayElement(['passed', 'failed', 'conditional']),
        ncCount: faker.number.int({ min: 0, max: 10 })
      },
      products: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
        name: faker.commerce.productName(),
        category: faker.helpers.arrayElement(['Raw Materials', 'Components', 'Assemblies', 'Services']),
        leadTime: faker.number.int({ min: 7, max: 60 })
      })),
      riskLevel,
      notes: faker.lorem.paragraph(),
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent(),
      status: faker.helpers.arrayElement(['approved', 'probation', 'suspended']),
      ...override
    };
  }
  
  /**
   * Generate an inspection object
   * @param {Object} override - Properties to override
   * @returns {Object} - Inspection object
   */
  generateInspection(override = {}) {
    const supplierId = override.supplierId || this.generateObjectId();
    const customerId = override.customerId || this.generateObjectId();
    const assignedToId = override.assignedToId || this.generateObjectId();
    const scheduledDate = faker.date.soon({ days: 30 });
    const status = faker.helpers.arrayElement(['scheduled', 'in-progress', 'completed', 'cancelled', 'delayed']);
    
    // Determine dates based on status
    let actualStartTime = null;
    let actualEndTime = null;
    
    if (status === 'in-progress' || status === 'completed') {
      actualStartTime = faker.date.recent({ days: 5 });
    }
    
    if (status === 'completed') {
      actualEndTime = new Date(actualStartTime.getTime() + faker.number.int({ min: 1, max: 8 }) * 60 * 60 * 1000); // 1-8 hours after start
    }
    
    return {
      _id: this.generateObjectId(),
      supplierId,
      customerId,
      assignedTo: assignedToId,
      scheduledDate,
      type: faker.helpers.arrayElement(['incoming', 'inprocess', 'final', 'supplier-audit']),
      status,
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
      location: faker.helpers.arrayElement(['supplier', 'customer', 'internal']),
      checklist: Array.from({ length: faker.number.int({ min: 3, max: 10 }) }, () => ({
        _id: this.generateObjectId(),
        title: faker.lorem.sentence({ min: 3, max: 8 }),
        description: faker.lorem.sentence(),
        status: faker.helpers.arrayElement(['pending', 'passed', 'failed', 'na']),
        comment: faker.lorem.sentence(),
        requiresPhoto: faker.datatype.boolean(0.3),
        requiresComment: faker.datatype.boolean(0.5)
      })),
      defects: status === 'completed' ? Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => ({
        _id: this.generateObjectId(),
        title: faker.lorem.sentence({ min: 3, max: 8 }),
        description: faker.lorem.paragraph(),
        severity: faker.helpers.arrayElement(['minor', 'major', 'critical']),
        location: faker.lorem.words(2),
        photoIds: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => this.generateObjectId())
      })) : [],
      notes: faker.lorem.paragraph(),
      createdBy: this.generateObjectId(),
      createdAt: faker.date.past({ days: 30 }),
      updatedAt: faker.date.recent(),
      actualStartTime,
      actualEndTime,
      outcome: status === 'completed' ? faker.helpers.arrayElement(['passed', 'failed', 'conditional']) : null,
      followUpRequired: status === 'completed' ? faker.datatype.boolean(0.3) : null,
      followUpDate: status === 'completed' && faker.datatype.boolean(0.3) ? faker.date.soon({ days: 30 }) : null,
      ...override
    };
  }
  
  /**
   * Generate a defect object
   * @param {Object} override - Properties to override
   * @returns {Object} - Defect object
   */
  generateDefect(override = {}) {
    const inspectionId = override.inspectionId || this.generateObjectId();
    
    return {
      _id: this.generateObjectId(),
      inspectionId,
      title: faker.lorem.sentence({ min: 3, max: 8 }),
      description: faker.lorem.paragraph(),
      severity: faker.helpers.arrayElement(['minor', 'major', 'critical']),
      location: faker.lorem.words(2),
      photoIds: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => this.generateObjectId()),
      measurements: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
        name: faker.helpers.arrayElement(['length', 'width', 'height', 'diameter', 'thickness']),
        value: faker.number.float({ min: 0.1, max: 100, precision: 0.01 }),
        unit: faker.helpers.arrayElement(['mm', 'cm', 'in']),
        tolerance: faker.number.float({ min: 0.01, max: 1, precision: 0.001 })
      })),
      createdBy: this.generateObjectId(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      status: faker.helpers.arrayElement(['open', 'investigating', 'resolved', 'rejected']),
      rootCause: faker.lorem.sentence(),
      correctiveAction: faker.lorem.paragraph(),
      ...override
    };
  }
  
  /**
   * Generate a product object
   * @param {Object} override - Properties to override
   * @returns {Object} - Product object
   */
  generateProduct(override = {}) {
    return {
      _id: this.generateObjectId(),
      name: faker.commerce.productName(),
      sku: faker.string.alphanumeric(8).toUpperCase(),
      description: faker.commerce.productDescription(),
      category: faker.helpers.arrayElement(['Raw Materials', 'Components', 'Assemblies', 'Finished Goods']),
      specifications: Array.from({ length: faker.number.int({ min: 2, max: 6 }) }, () => ({
        name: faker.lorem.word(),
        value: faker.lorem.words(2),
        unit: faker.helpers.arrayElement(['mm', 'cm', 'kg', 'g', 'N', 'MPa', '']),
        tolerance: faker.helpers.maybe(() => `±${faker.number.float({ min: 0.01, max: 1, precision: 0.01 })}`, { probability: 0.7 })
      })),
      suppliers: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
        supplierId: this.generateObjectId(),
        supplierPartNumber: faker.string.alphanumeric(10).toUpperCase(),
        leadTime: faker.number.int({ min: 7, max: 60 }),
        unitCost: faker.commerce.price({ min: 10, max: 1000 })
      })),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
      status: faker.helpers.arrayElement(['active', 'discontinued', 'development']),
      ...override
    };
  }
  
  /**
   * Generate multiple entities of a specific type
   * @param {string} entityType - Type of entity to generate ('users', 'customers', etc.)
   * @param {number} count - Number of entities to generate
   * @param {Function} [overrideCallback] - Function to customize each entity (receives index and returns override object)
   * @returns {Array<Object>} - Array of generated entities
   */
  generateMany(entityType, count, overrideCallback = null) {
    const generateMethod = {
      users: this.generateUser.bind(this),
      customers: this.generateCustomer.bind(this),
      suppliers: this.generateSupplier.bind(this),
      inspections: this.generateInspection.bind(this),
      products: this.generateProduct.bind(this),
      defects: this.generateDefect.bind(this)
    }[entityType];
    
    if (!generateMethod) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    return Array.from({ length: count }, (_, index) => {
      const override = overrideCallback ? overrideCallback(index) : {};
      return generateMethod(override);
    });
  }
  
  /**
   * Generate a complete dataset with related entities
   * @param {Object} [counts] - Number of each entity to generate
   * @returns {Object} - Object containing all generated entities
   */
  generateDataset(counts = {}) {
    const finalCounts = { ...this.defaultCounts, ...counts };
    
    // Generate users first
    const users = this.generateMany('users', finalCounts.users);
    const adminUser = this.generateUser({ role: 'admin', email: 'admin@example.com' });
    users.push(adminUser);
    
    // Generate customers
    const customers = this.generateMany('customers', finalCounts.customers);
    
    // Generate suppliers
    const suppliers = this.generateMany('suppliers', finalCounts.suppliers);
    
    // Generate inspections with references to users, customers, and suppliers
    const inspections = this.generateMany('inspections', finalCounts.inspections, (index) => {
      const supplier = suppliers[index % suppliers.length];
      const customer = customers[index % customers.length];
      const assignedUser = users[index % users.length];
      
      return {
        supplierId: supplier._id,
        customerId: customer._id,
        assignedTo: assignedUser._id,
        createdBy: adminUser._id
      };
    });
    
    // Generate products with references to suppliers
    const products = this.generateMany('products', finalCounts.products, (index) => {
      return {
        suppliers: [
          { supplierId: suppliers[index % suppliers.length]._id },
          { supplierId: suppliers[(index + 1) % suppliers.length]._id }
        ]
      };
    });
    
    // Generate defects with references to inspections
    const defects = this.generateMany('defects', finalCounts.defects, (index) => {
      return {
        inspectionId: inspections[index % inspections.length]._id,
        createdBy: users[index % users.length]._id
      };
    });
    
    return {
      users,
      customers,
      suppliers,
      inspections,
      products,
      defects
    };
  }
}

module.exports = TestDataGenerator; 