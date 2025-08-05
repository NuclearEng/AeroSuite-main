/**
 * Test Data Generator Tests
 */

const TestDataGenerator = require('../../utils/testDataGenerator');

describe('TestDataGenerator', () => {
  let generator;

  beforeEach(() => {
    // Create a new generator with a fixed seed for consistent test results
    generator = new TestDataGenerator({ seed: 'test-seed-123' });
  });

  describe('Constructor', () => {
    test('should create a generator with default options', () => {
      const defaultGenerator = new TestDataGenerator();
      expect(defaultGenerator).toBeInstanceOf(TestDataGenerator);
      expect(defaultGenerator.defaultCounts).toBeDefined();
    });

    test('should create a generator with specified seed', () => {
      const seededGenerator = new TestDataGenerator({ seed: 'my-seed' });
      expect(seededGenerator).toBeInstanceOf(TestDataGenerator);
    });
  });

  describe('String to Seed Conversion', () => {
    test('should convert string to numeric seed', () => {
      const seed = generator.stringToSeed('my-test-seed');
      expect(typeof seed).toBe('number');
      expect(seed).toBeGreaterThan(0);
    });

    test('should produce the same numeric seed for the same string', () => {
      const seed1 = generator.stringToSeed('consistent-seed');
      const seed2 = generator.stringToSeed('consistent-seed');
      expect(seed1).toBe(seed2);
    });

    test('should produce different numeric seeds for different strings', () => {
      const seed1 = generator.stringToSeed('seed-1');
      const seed2 = generator.stringToSeed('seed-2');
      expect(seed1).not.toBe(seed2);
    });
  });

  describe('ObjectId Generation', () => {
    test('should generate a valid ObjectId string', () => {
      const id = generator.generateObjectId();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^[0-9a-f]{24}$/);
    });

    test('should generate unique ObjectIds', () => {
      const id1 = generator.generateObjectId();
      const id2 = generator.generateObjectId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('User Generation', () => {
    test('should generate a user object with expected fields', () => {
      const user = generator.generateUser();
      
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('password');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('department');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      expect(user).toHaveProperty('preferences');
    });

    test('should allow overriding specific user properties', () => {
      const customEmail = 'custom@example.com';
      const customRole = 'admin';
      
      const user = generator.generateUser({
        email: customEmail,
        role: customRole
      });
      
      expect(user.email).toBe(customEmail);
      expect(user.role).toBe(customRole);
    });

    test('should generate consistent users with the same generator', () => {
      const fixedGenerator = new TestDataGenerator({ seed: 'fixed-seed' });
      const user1 = fixedGenerator.generateUser();
      const user2 = fixedGenerator.generateUser();
      
      // Different users should have different IDs
      expect(user1._id).not.toBe(user2._id);
      
      // But creating the generator again with the same seed should produce the same first user
      const sameGenerator = new TestDataGenerator({ seed: 'fixed-seed' });
      const sameUser = sameGenerator.generateUser();
      
      expect(sameUser.firstName).toBe(user1.firstName);
      expect(sameUser.lastName).toBe(user1.lastName);
      expect(sameUser.email).toBe(user1.email);
    });
  });

  describe('Customer Generation', () => {
    test('should generate a customer object with expected fields', () => {
      const customer = generator.generateCustomer();
      
      expect(customer).toHaveProperty('_id');
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('contactPerson');
      expect(customer.contactPerson).toHaveProperty('firstName');
      expect(customer.contactPerson).toHaveProperty('lastName');
      expect(customer.contactPerson).toHaveProperty('email');
      expect(customer).toHaveProperty('address');
      expect(customer.address).toHaveProperty('street');
      expect(customer.address).toHaveProperty('city');
      expect(customer).toHaveProperty('industry');
      expect(customer).toHaveProperty('createdAt');
      expect(customer).toHaveProperty('updatedAt');
    });
  });

  describe('Supplier Generation', () => {
    test('should generate a supplier object with expected fields', () => {
      const supplier = generator.generateSupplier();
      
      expect(supplier).toHaveProperty('_id');
      expect(supplier).toHaveProperty('name');
      expect(supplier).toHaveProperty('contactPerson');
      expect(supplier).toHaveProperty('address');
      expect(supplier).toHaveProperty('qualifications');
      expect(supplier).toHaveProperty('performance');
      expect(supplier.performance).toHaveProperty('qualityScore');
      expect(supplier.performance).toHaveProperty('deliveryScore');
      expect(supplier).toHaveProperty('products');
      expect(supplier).toHaveProperty('riskLevel');
      expect(supplier).toHaveProperty('status');
    });

    test('should generate a supplier with risk level based on quality score', () => {
      const lowRiskSupplier = generator.generateSupplier({
        performance: { qualityScore: 95 }
      });
      expect(lowRiskSupplier.riskLevel).toBe('low');
      
      const mediumRiskSupplier = generator.generateSupplier({
        performance: { qualityScore: 85 }
      });
      expect(mediumRiskSupplier.riskLevel).toBe('medium');
      
      const highRiskSupplier = generator.generateSupplier({
        performance: { qualityScore: 75 }
      });
      expect(highRiskSupplier.riskLevel).toBe('high');
    });
  });

  describe('Inspection Generation', () => {
    test('should generate an inspection object with expected fields', () => {
      const inspection = generator.generateInspection();
      
      expect(inspection).toHaveProperty('_id');
      expect(inspection).toHaveProperty('supplierId');
      expect(inspection).toHaveProperty('customerId');
      expect(inspection).toHaveProperty('assignedTo');
      expect(inspection).toHaveProperty('scheduledDate');
      expect(inspection).toHaveProperty('type');
      expect(inspection).toHaveProperty('status');
      expect(inspection).toHaveProperty('priority');
      expect(inspection).toHaveProperty('checklist');
      expect(Array.isArray(inspection.checklist)).toBe(true);
    });

    test('should generate appropriate data based on inspection status', () => {
      const scheduledInspection = generator.generateInspection({
        status: 'scheduled'
      });
      expect(scheduledInspection.actualStartTime).toBeNull();
      expect(scheduledInspection.actualEndTime).toBeNull();
      expect(scheduledInspection.outcome).toBeNull();
      
      const inProgressInspection = generator.generateInspection({
        status: 'in-progress'
      });
      expect(inProgressInspection.actualStartTime).toBeInstanceOf(Date);
      expect(inProgressInspection.actualEndTime).toBeNull();
      expect(inProgressInspection.outcome).toBeNull();
      
      const completedInspection = generator.generateInspection({
        status: 'completed'
      });
      expect(completedInspection.actualStartTime).toBeInstanceOf(Date);
      expect(completedInspection.actualEndTime).toBeInstanceOf(Date);
      expect(['passed', 'failed', 'conditional']).toContain(completedInspection.outcome);
    });
  });

  describe('Defect Generation', () => {
    test('should generate a defect object with expected fields', () => {
      const defect = generator.generateDefect();
      
      expect(defect).toHaveProperty('_id');
      expect(defect).toHaveProperty('inspectionId');
      expect(defect).toHaveProperty('title');
      expect(defect).toHaveProperty('description');
      expect(defect).toHaveProperty('severity');
      expect(defect).toHaveProperty('location');
      expect(defect).toHaveProperty('photoIds');
      expect(defect).toHaveProperty('measurements');
      expect(defect).toHaveProperty('status');
    });
  });

  describe('Product Generation', () => {
    test('should generate a product object with expected fields', () => {
      const product = generator.generateProduct();
      
      expect(product).toHaveProperty('_id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('specifications');
      expect(product).toHaveProperty('suppliers');
      expect(product).toHaveProperty('status');
    });
  });

  describe('Multiple Entity Generation', () => {
    test('should generate multiple users', () => {
      const users = generator.generateMany('users', 5);
      
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(5);
      users.forEach(user => {
        expect(user).toHaveProperty('_id');
        expect(user).toHaveProperty('email');
      });
    });

    test('should generate multiple suppliers with custom overrides', () => {
      const suppliers = generator.generateMany('suppliers', 3, (index) => ({
        name: `Test Supplier ${index + 1}`,
        status: 'approved'
      }));
      
      expect(suppliers.length).toBe(3);
      expect(suppliers[0].name).toBe('Test Supplier 1');
      expect(suppliers[1].name).toBe('Test Supplier 2');
      expect(suppliers[2].name).toBe('Test Supplier 3');
      suppliers.forEach(supplier => {
        expect(supplier.status).toBe('approved');
      });
    });

    test('should throw error for unknown entity type', () => {
      expect(() => {
        generator.generateMany('unknownType', 3);
      }).toThrow('Unknown entity type: unknownType');
    });
  });

  describe('Dataset Generation', () => {
    test('should generate a complete dataset with related entities', () => {
      const dataset = generator.generateDataset({ users: 3, customers: 2, suppliers: 2 });
      
      expect(dataset).toHaveProperty('users');
      expect(dataset).toHaveProperty('customers');
      expect(dataset).toHaveProperty('suppliers');
      expect(dataset).toHaveProperty('inspections');
      expect(dataset).toHaveProperty('products');
      expect(dataset).toHaveProperty('defects');
      
      expect(dataset.users.length).toBeGreaterThanOrEqual(3);
      expect(dataset.customers.length).toBe(2);
      expect(dataset.suppliers.length).toBe(2);
      
      // Verify relationships between entities
      const inspectionWithSupplier = dataset.inspections[0];
      const supplierId = inspectionWithSupplier.supplierId;
      const supplierExists = dataset.suppliers.some(s => s._id === supplierId);
      expect(supplierExists).toBe(true);
    });
  });
}); 