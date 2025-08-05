/**
 * Database Seeder
 * 
 * @task TS356 - Test data generation implementation
 * 
 * This utility provides methods to seed the database with test data.
 * It integrates with the TestDataGenerator to create realistic test data
 * and supports various seeding strategies.
 */

const mongoose = require('mongoose');
const TestDataGenerator = require('./testDataGenerator');
const User = require('../models/user.model');
const Customer = require('../models/customer.model');
const Supplier = require('../models/supplier.model');
const Inspection = require('../models/inspection.model');
const Product = require('../models/product.model');
const Defect = require('../models/defect.model');
const { logger } = require('./logger');

class DatabaseSeeder {
  /**
   * Create a new DatabaseSeeder instance
   * @param {Object} options - Seeder options
   * @param {string} options.seed - Optional seed for reproducible data generation
   * @param {boolean} options.clearExisting - Whether to clear existing data before seeding
   * @param {Object} options.counts - Number of entities to generate
   */
  constructor(options = {}) {
    this.options = {
      seed: options.seed || 'aerosuite-seed',
      clearExisting: options.clearExisting !== undefined ? options.clearExisting : false,
      counts: options.counts || {
        users: 10,
        customers: 20,
        suppliers: 15,
        inspections: 30,
        products: 25,
        defects: 40
      }
    };
    
    this.generator = new TestDataGenerator({ seed: this.options.seed });
    this.generatedIds = {
      users: [],
      customers: [],
      suppliers: [],
      inspections: [],
      products: [],
      defects: []
    };
  }
  
  /**
   * Clear all existing data from the database
   * @returns {Promise<void>}
   */
  async clearDatabase() {
    if (!this.options.clearExisting) {
      return;
    }
    
    logger.info('Clearing existing database data...');
    
    try {
      await Promise.all([
        User.deleteMany({}),
        Customer.deleteMany({}),
        Supplier.deleteMany({}),
        Inspection.deleteMany({}),
        Product.deleteMany({}),
        Defect.deleteMany({})
      ]);
      
      logger.info('Database cleared successfully');
    } catch (error) {
      logger.error('Error clearing database:', error);
      throw error;
    }
  }
  
  /**
   * Seed users into the database
   * @returns {Promise<Array>} - Array of created user IDs
   */
  async seedUsers() {
    logger.info(`Seeding ${this.options.counts.users} users...`);
    
    try {
      // Always create an admin user
      const adminUser = this.generator.generateUser({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@aerosuite.com',
        role: 'admin',
        isActive: true
      });
      
      // Generate regular users
      const userPromises = [User.create(adminUser)];
      this.generatedIds.users.push(adminUser._id);
      
      for (let i = 1; i < this.options.counts.users; i++) {
        const user = this.generator.generateUser();
        userPromises.push(User.create(user));
        this.generatedIds.users.push(user._id);
      }
      
      await Promise.all(userPromises);
      logger.info(`${this.options.counts.users} users seeded successfully`);
      
      return this.generatedIds.users;
    } catch (error) {
      logger.error('Error seeding users:', error);
      throw error;
    }
  }
  
  /**
   * Seed customers into the database
   * @returns {Promise<Array>} - Array of created customer IDs
   */
  async seedCustomers() {
    logger.info(`Seeding ${this.options.counts.customers} customers...`);
    
    try {
      const customerPromises = [];
      
      for (let i = 0; i < this.options.counts.customers; i++) {
        const customer = this.generator.generateCustomer();
        customerPromises.push(Customer.create(customer));
        this.generatedIds.customers.push(customer._id);
      }
      
      await Promise.all(customerPromises);
      logger.info(`${this.options.counts.customers} customers seeded successfully`);
      
      return this.generatedIds.customers;
    } catch (error) {
      logger.error('Error seeding customers:', error);
      throw error;
    }
  }
  
  /**
   * Seed suppliers into the database
   * @returns {Promise<Array>} - Array of created supplier IDs
   */
  async seedSuppliers() {
    logger.info(`Seeding ${this.options.counts.suppliers} suppliers...`);
    
    try {
      const supplierPromises = [];
      
      for (let i = 0; i < this.options.counts.suppliers; i++) {
        const supplier = this.generator.generateSupplier();
        supplierPromises.push(Supplier.create(supplier));
        this.generatedIds.suppliers.push(supplier._id);
      }
      
      await Promise.all(supplierPromises);
      logger.info(`${this.options.counts.suppliers} suppliers seeded successfully`);
      
      return this.generatedIds.suppliers;
    } catch (error) {
      logger.error('Error seeding suppliers:', error);
      throw error;
    }
  }
  
  /**
   * Seed products into the database
   * @returns {Promise<Array>} - Array of created product IDs
   */
  async seedProducts() {
    logger.info(`Seeding ${this.options.counts.products} products...`);
    
    try {
      const productPromises = [];
      
      for (let i = 0; i < this.options.counts.products; i++) {
        // Link products to suppliers if available
        const supplierOverride = this.generatedIds.suppliers.length > 0 ? {
          supplierId: this.generatedIds.suppliers[i % this.generatedIds.suppliers.length]
        } : {};
        
        const product = this.generator.generateProduct(supplierOverride);
        productPromises.push(Product.create(product));
        this.generatedIds.products.push(product._id);
      }
      
      await Promise.all(productPromises);
      logger.info(`${this.options.counts.products} products seeded successfully`);
      
      return this.generatedIds.products;
    } catch (error) {
      logger.error('Error seeding products:', error);
      throw error;
    }
  }
  
  /**
   * Seed inspections into the database
   * @returns {Promise<Array>} - Array of created inspection IDs
   */
  async seedInspections() {
    logger.info(`Seeding ${this.options.counts.inspections} inspections...`);
    
    try {
      const inspectionPromises = [];
      
      for (let i = 0; i < this.options.counts.inspections; i++) {
        // Link inspections to suppliers, customers, and users if available
        const override = {};
        
        if (this.generatedIds.suppliers.length > 0) {
          override.supplierId = this.generatedIds.suppliers[i % this.generatedIds.suppliers.length];
        }
        
        if (this.generatedIds.customers.length > 0) {
          override.customerId = this.generatedIds.customers[i % this.generatedIds.customers.length];
        }
        
        if (this.generatedIds.users.length > 0) {
          const inspectors = this.generatedIds.users.filter(id => {
            const user = User.findById(id);
            return user && (user.role === 'inspector' || user.role === 'manager');
          });
          
          if (inspectors.length > 0) {
            override.assignedToId = inspectors[i % inspectors.length];
          } else {
            override.assignedToId = this.generatedIds.users[i % this.generatedIds.users.length];
          }
        }
        
        const inspection = this.generator.generateInspection(override);
        inspectionPromises.push(Inspection.create(inspection));
        this.generatedIds.inspections.push(inspection._id);
      }
      
      await Promise.all(inspectionPromises);
      logger.info(`${this.options.counts.inspections} inspections seeded successfully`);
      
      return this.generatedIds.inspections;
    } catch (error) {
      logger.error('Error seeding inspections:', error);
      throw error;
    }
  }
  
  /**
   * Seed defects into the database
   * @returns {Promise<Array>} - Array of created defect IDs
   */
  async seedDefects() {
    logger.info(`Seeding ${this.options.counts.defects} defects...`);
    
    try {
      const defectPromises = [];
      
      for (let i = 0; i < this.options.counts.defects; i++) {
        // Link defects to inspections if available
        const override = {};
        
        if (this.generatedIds.inspections.length > 0) {
          override.inspectionId = this.generatedIds.inspections[i % this.generatedIds.inspections.length];
        }
        
        const defect = this.generator.generateDefect(override);
        defectPromises.push(Defect.create(defect));
        this.generatedIds.defects.push(defect._id);
      }
      
      await Promise.all(defectPromises);
      logger.info(`${this.options.counts.defects} defects seeded successfully`);
      
      return this.generatedIds.defects;
    } catch (error) {
      logger.error('Error seeding defects:', error);
      throw error;
    }
  }
  
  /**
   * Seed all entities into the database
   * @returns {Promise<Object>} - Object containing all generated entity IDs
   */
  async seedAll() {
    logger.info('Starting database seeding...');
    
    try {
      await this.clearDatabase();
      
      // Seed in order to maintain relationships
      await this.seedUsers();
      await this.seedCustomers();
      await this.seedSuppliers();
      await this.seedProducts();
      await this.seedInspections();
      await this.seedDefects();
      
      logger.info('Database seeding completed successfully');
      
      return this.generatedIds;
    } catch (error) {
      logger.error('Error seeding database:', error);
      throw error;
    }
  }
}

module.exports = DatabaseSeeder; 