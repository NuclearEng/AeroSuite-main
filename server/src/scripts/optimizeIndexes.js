/**
 * Database Indexing Optimization Script
 * This script ensures all necessary indexes are created for improved query performance
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import all models
const Supplier = require('../models/supplier.model');
const Customer = require('../models/customer.model');
const Inspection = require('../models/inspection.model');
const User = require('../models/user.model');
const Component = require('../models/component.model');
const Notification = require('../models/notification.model');
const Document = require('../models/document.model');
const RiskAssessment = require('../models/RiskAssessment');
const SupplierAudit = require('../models/SupplierAudit');
const QualityManagement = require('../models/QualityManagement');

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Create indexes for User collection
 */
const optimizeUserIndexes = async () => {
  console.log('Optimizing User indexes...');
  
  try {
    // Indexes for common queries
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ status: 1 });
    await User.collection.createIndex({ "account.lastLogin": -1 });
    await User.collection.createIndex({ createdAt: -1 });
    
    // Compound indexes for common queries
    await User.collection.createIndex({ role: 1, status: 1 });
    
    console.log('User indexes optimized successfully');
  } catch (error) {
    console.error('Error optimizing User indexes:', error);
  }
};

/**
 * Create indexes for Supplier collection
 */
const optimizeSupplierIndexes = async () => {
  console.log('Optimizing Supplier indexes...');
  
  try {
    // Indexes for common queries
    await Supplier.collection.createIndex({ name: 1 });
    await Supplier.collection.createIndex({ code: 1 }, { unique: true });
    await Supplier.collection.createIndex({ status: 1 });
    await Supplier.collection.createIndex({ industry: 1 });
    await Supplier.collection.createIndex({ "address.country": 1 });
    await Supplier.collection.createIndex({ customers: 1 });
    await Supplier.collection.createIndex({ createdAt: -1 });
    
    // Text index for search queries
    await Supplier.collection.createIndex({ 
      name: "text", 
      code: "text", 
      primaryContactName: "text", 
      primaryContactEmail: "text" 
    }, { name: "supplier_text_index" });
    
    // Compound indexes for common queries
    await Supplier.collection.createIndex({ status: 1, industry: 1 });
    await Supplier.collection.createIndex({ customers: 1, status: 1 });
    
    console.log('Supplier indexes optimized successfully');
  } catch (error) {
    console.error('Error optimizing Supplier indexes:', error);
  }
};

/**
 * Create indexes for Customer collection
 */
const optimizeCustomerIndexes = async () => {
  console.log('Optimizing Customer indexes...');
  
  try {
    // Indexes for common queries
    await Customer.collection.createIndex({ name: 1 });
    await Customer.collection.createIndex({ code: 1 }, { unique: true });
    await Customer.collection.createIndex({ status: 1 });
    await Customer.collection.createIndex({ suppliers: 1 });
    await Customer.collection.createIndex({ createdAt: -1 });
    
    // Text index for search queries
    await Customer.collection.createIndex({ 
      name: "text", 
      code: "text", 
      contactName: "text", 
      contactEmail: "text" 
    }, { name: "customer_text_index" });
    
    // Compound indexes for common queries
    await Customer.collection.createIndex({ status: 1, createdAt: -1 });
    
    console.log('Customer indexes optimized successfully');
  } catch (error) {
    console.error('Error optimizing Customer indexes:', error);
  }
};

/**
 * Create indexes for Inspection collection
 */
const optimizeInspectionIndexes = async () => {
  console.log('Optimizing Inspection indexes...');
  
  try {
    // Indexes for common queries
    await Inspection.collection.createIndex({ supplier: 1 });
    await Inspection.collection.createIndex({ customer: 1 });
    await Inspection.collection.createIndex({ inspector: 1 });
    await Inspection.collection.createIndex({ result: 1 });
    await Inspection.collection.createIndex({ status: 1 });
    await Inspection.collection.createIndex({ scheduledDate: 1 });
    await Inspection.collection.createIndex({ completedDate: 1 });
    await Inspection.collection.createIndex({ createdAt: -1 });
    
    // Compound indexes for common queries
    await Inspection.collection.createIndex({ supplier: 1, status: 1 });
    await Inspection.collection.createIndex({ customer: 1, status: 1 });
    await Inspection.collection.createIndex({ supplier: 1, result: 1 });
    await Inspection.collection.createIndex({ scheduledDate: 1, status: 1 });
    await Inspection.collection.createIndex({ status: 1, scheduledDate: 1 });
    
    console.log('Inspection indexes optimized successfully');
  } catch (error) {
    console.error('Error optimizing Inspection indexes:', error);
  }
};

/**
 * Create indexes for Component collection
 */
const optimizeComponentIndexes = async () => {
  console.log('Optimizing Component indexes...');
  
  try {
    // Indexes for common queries
    await Component.collection.createIndex({ name: 1 });
    await Component.collection.createIndex({ code: 1 }, { unique: true });
    await Component.collection.createIndex({ supplier: 1 });
    await Component.collection.createIndex({ status: 1 });
    await Component.collection.createIndex({ createdAt: -1 });
    
    // Text index for search queries
    await Component.collection.createIndex({ 
      name: "text", 
      code: "text", 
      description: "text" 
    }, { name: "component_text_index" });
    
    // Compound indexes for common queries
    await Component.collection.createIndex({ supplier: 1, status: 1 });
    
    console.log('Component indexes optimized successfully');
  } catch (error) {
    console.error('Error optimizing Component indexes:', error);
  }
};

/**
 * Create indexes for Notification collection
 */
const optimizeNotificationIndexes = async () => {
  console.log('Optimizing Notification indexes...');
  
  try {
    // Indexes for common queries
    await Notification.collection.createIndex({ user: 1 });
    await Notification.collection.createIndex({ read: 1 });
    await Notification.collection.createIndex({ type: 1 });
    await Notification.collection.createIndex({ createdAt: -1 });
    
    // Compound indexes for common queries
    await Notification.collection.createIndex({ user: 1, read: 1 });
    await Notification.collection.createIndex({ user: 1, createdAt: -1 });
    
    console.log('Notification indexes optimized successfully');
  } catch (error) {
    console.error('Error optimizing Notification indexes:', error);
  }
};

/**
 * Create indexes for Document collection
 */
const optimizeDocumentIndexes = async () => {
  console.log('Optimizing Document indexes...');
  
  try {
    // Indexes for common queries
    await Document.collection.createIndex({ type: 1 });
    await Document.collection.createIndex({ owner: 1 });
    await Document.collection.createIndex({ "metadata.supplier": 1 });
    await Document.collection.createIndex({ "metadata.customer": 1 });
    await Document.collection.createIndex({ "metadata.inspection": 1 });
    await Document.collection.createIndex({ createdAt: -1 });
    
    // Compound indexes for common queries
    await Document.collection.createIndex({ type: 1, owner: 1 });
    await Document.collection.createIndex({ "metadata.supplier": 1, type: 1 });
    await Document.collection.createIndex({ "metadata.customer": 1, type: 1 });
    
    console.log('Document indexes optimized successfully');
  } catch (error) {
    console.error('Error optimizing Document indexes:', error);
  }
};

/**
 * Main function to run all optimization tasks
 */
const optimizeAllIndexes = async () => {
  console.log('Starting database index optimization...');
  
  const connection = await connectDB();
  
  try {
    // Optimize indexes for all collections
    await optimizeUserIndexes();
    await optimizeSupplierIndexes();
    await optimizeCustomerIndexes();
    await optimizeInspectionIndexes();
    await optimizeComponentIndexes();
    await optimizeNotificationIndexes();
    await optimizeDocumentIndexes();
    
    console.log('All database indexes have been optimized successfully');
  } catch (error) {
    console.error('Error during index optimization:', error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
};

// Run the optimization script
if (require.main === module) {
  optimizeAllIndexes()
    .then(() => {
      console.log('Index optimization completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error in index optimization script:', err);
      process.exit(1);
    });
}

module.exports = { optimizeAllIndexes }; 