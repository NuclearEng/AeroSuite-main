// Task: TS005 - Core Database Schema
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Import all models
const User = require('./User');
const Customer = require('./Customer');
const Supplier = require('./Supplier');
const Inspection = require('./Inspection');
const Product = require('./Product');
const Order = require('./Order');
const Invoice = require('./Invoice');
const Report = require('./Report');
const Dashboard = require('./Dashboard');
const Widget = require('./Widget');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const Setting = require('./Setting');
const Permission = require('./Permission');
const Role = require('./Role');
const Token = require('./Token');
const Session = require('./Session');
const File = require('./File');
const Task = require('./Task');
const Workflow = require('./Workflow');
const Integration = require('./Integration');
const ApiKey = require('./ApiKey');
const Webhook = require('./Webhook');
const EmailTemplate = require('./EmailTemplate');
const SystemConfig = require('./SystemConfig');

// Database connection configuration
const dbConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// Connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerosuite';
    await mongoose.connect(mongoUri, dbConfig);
    
    // Create indexes
    await createIndexes();
    
    // Initialize system data
    await initializeSystemData();
    
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Create database indexes
 */
async function createIndexes() {
  try {
    // User indexes
    await User.createIndexes();
    
    // Customer indexes
    await Customer.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    await Customer.collection.createIndex({ company: 1 });
    await Customer.collection.createIndex({ status: 1 });
    await Customer.collection.createIndex({ 'contact.email': 1 });
    await Customer.collection.createIndex({ createdAt: -1 });
    
    // Supplier indexes
    await Supplier.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    await Supplier.collection.createIndex({ company: 1 });
    await Supplier.collection.createIndex({ status: 1 });
    await Supplier.collection.createIndex({ category: 1 });
    await Supplier.collection.createIndex({ rating: -1 });
    
    // Inspection indexes
    await Inspection.collection.createIndex({ inspectionNumber: 1 }, { unique: true });
    await Inspection.collection.createIndex({ customer: 1 });
    await Inspection.collection.createIndex({ inspector: 1 });
    await Inspection.collection.createIndex({ status: 1 });
    await Inspection.collection.createIndex({ scheduledDate: 1 });
    await Inspection.collection.createIndex({ completedDate: 1 });
    
    // Product indexes
    await Product.collection.createIndex({ sku: 1 }, { unique: true });
    await Product.collection.createIndex({ name: 'text', description: 'text' });
    await Product.collection.createIndex({ category: 1 });
    await Product.collection.createIndex({ supplier: 1 });
    await Product.collection.createIndex({ status: 1 });
    
    // Order indexes
    await Order.collection.createIndex({ orderNumber: 1 }, { unique: true });
    await Order.collection.createIndex({ customer: 1 });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ orderDate: -1 });
    
    // Report indexes
    await Report.collection.createIndex({ title: 'text', description: 'text' });
    await Report.collection.createIndex({ type: 1 });
    await Report.collection.createIndex({ createdBy: 1 });
    await Report.collection.createIndex({ createdAt: -1 });
    
    // Notification indexes
    await Notification.collection.createIndex({ recipient: 1, read: 1 });
    await Notification.collection.createIndex({ type: 1 });
    await Notification.collection.createIndex({ createdAt: -1 });
    await Notification.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    // AuditLog indexes
    await AuditLog.collection.createIndex({ user: 1 });
    await AuditLog.collection.createIndex({ action: 1 });
    await AuditLog.collection.createIndex({ entity: 1, entityId: 1 });
    await AuditLog.collection.createIndex({ timestamp: -1 });
    await AuditLog.collection.createIndex({ 'metadata.ip': 1 });
    
    // Session indexes
    await Session.collection.createIndex({ userId: 1 });
    await Session.collection.createIndex({ token: 1 }, { unique: true });
    await Session.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    // File indexes
    await File.collection.createIndex({ filename: 1 });
    await File.collection.createIndex({ uploadedBy: 1 });
    await File.collection.createIndex({ entityType: 1, entityId: 1 });
    await File.collection.createIndex({ createdAt: -1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

/**
 * Initialize system data
 */
async function initializeSystemData() {
  try {
    // Initialize default roles
    const defaultRoles = [
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access',
        isSystem: true
      },
      {
        name: 'manager',
        displayName: 'Manager',
        description: 'Management level access',
        isSystem: true
      },
      {
        name: 'user',
        displayName: 'User',
        description: 'Standard user access',
        isSystem: true
      },
      {
        name: 'viewer',
        displayName: 'Viewer',
        description: 'Read-only access',
        isSystem: true
      }
    ];
    
    for (const roleData of defaultRoles) {
      await Role.findOneAndUpdate(
        { name: roleData.name },
        roleData,
        { upsert: true, new: true }
      );
    }
    
    // Initialize system settings
    const defaultSettings = [
      {
        key: 'system.initialized',
        value: true,
        category: 'system',
        isPublic: false
      },
      {
        key: 'system.version',
        value: process.env.APP_VERSION || '1.0.0',
        category: 'system',
        isPublic: true
      },
      {
        key: 'auth.sessionTimeout',
        value: 24 * 60 * 60 * 1000, // 24 hours
        category: 'auth',
        isPublic: false
      },
      {
        key: 'auth.maxLoginAttempts',
        value: 5,
        category: 'auth',
        isPublic: false
      },
      {
        key: 'notifications.emailEnabled',
        value: true,
        category: 'notifications',
        isPublic: false
      }
    ];
    
    for (const setting of defaultSettings) {
      await Setting.findOneAndUpdate(
        { key: setting.key },
        setting,
        { upsert: true, new: true }
      );
    }
    
    // Initialize email templates
    const emailTemplates = [
      {
        name: 'welcome',
        subject: 'Welcome to AeroSuite',
        category: 'auth',
        isActive: true
      },
      {
        name: 'passwordReset',
        subject: 'Reset Your Password',
        category: 'auth',
        isActive: true
      },
      {
        name: 'inspectionScheduled',
        subject: 'Inspection Scheduled',
        category: 'inspection',
        isActive: true
      },
      {
        name: 'reportGenerated',
        subject: 'Report Generated',
        category: 'report',
        isActive: true
      }
    ];
    
    for (const template of emailTemplates) {
      await EmailTemplate.findOneAndUpdate(
        { name: template.name },
        template,
        { upsert: true, new: true }
      );
    }
    
    console.log('✅ System data initialized successfully');
  } catch (error) {
    console.error('Error initializing system data:', error);
  }
}

/**
 * Database utilities
 */
const dbUtils = {
  /**
   * Transaction wrapper
   */
  async withTransaction(callback) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
  
  /**
   * Bulk operations wrapper
   */
  async bulkOperation(Model, operations) {
    const bulkOps = operations.map(op => {
      switch (op.type) {
        case 'insert':
          return { insertOne: { document: op.document } };
        case 'update':
          return {
            updateOne: {
              filter: op.filter,
              update: op.update,
              upsert: op.upsert || false
            }
          };
        case 'delete':
          return { deleteOne: { filter: op.filter } };
        default:
          throw new Error(`Unknown operation type: ${op.type}`);
      }
    });
    
    return await Model.bulkWrite(bulkOps);
  },
  
  /**
   * Paginate query results
   */
  async paginate(Model, query = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
      populate = '',
      select = ''
    } = options;
    
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      Model.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .populate(populate)
        .select(select)
        .lean(),
      Model.countDocuments(query)
    ]);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  },
  
  /**
   * Soft delete support
   */
  async softDelete(Model, id) {
    return await Model.findByIdAndUpdate(
      id,
      {
        deletedAt: new Date(),
        isDeleted: true
      },
      { new: true }
    );
  },
  
  /**
   * Restore soft deleted document
   */
  async restore(Model, id) {
    return await Model.findByIdAndUpdate(
      id,
      {
        $unset: { deletedAt: 1 },
        isDeleted: false
      },
      { new: true }
    );
  }
};

/**
 * Register all models with Mongoose
 * This ensures models are available for testing and application use
 */
function registerModels() {
  // Register all models to ensure they're available
  const models = {
    User,
    Customer,
    Supplier,
    Inspection,
    Product,
    Order,
    Invoice,
    Report,
    Dashboard,
    Widget,
    Notification,
    AuditLog,
    Setting,
    Permission,
    Role,
    Token,
    Session,
    File,
    Task,
    Workflow,
    Integration,
    ApiKey,
    Webhook,
    EmailTemplate,
    SystemConfig
  };

  // Register each model with Mongoose
  Object.entries(models).forEach(([name, model]) => {
    if (!mongoose.models[name]) {
      mongoose.model(name, model.schema);
    }
  });

  console.log('✅ All models registered with Mongoose');
}

// Register models immediately
registerModels();

// Export models and utilities
module.exports = {
  // Models
  User,
  Customer,
  Supplier,
  Inspection,
  Product,
  Order,
  Invoice,
  Report,
  Dashboard,
  Widget,
  Notification,
  AuditLog,
  Setting,
  Permission,
  Role,
  Token,
  Session,
  File,
  Task,
  Workflow,
  Integration,
  ApiKey,
  Webhook,
  EmailTemplate,
  SystemConfig,
  
  // Database functions
  connectDB,
  createIndexes,
  initializeSystemData,
  
  // Utilities
  dbUtils,
  
  // Mongoose instance
  mongoose,
  registerModels
}; 