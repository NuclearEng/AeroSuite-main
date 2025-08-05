// MongoDB initialization script
db = db.getSiblingDB('aerosuite');

// Create collections if they don't exist
db.createCollection('users');
db.createCollection('customers');
db.createCollection('suppliers');
db.createCollection('inspections');
db.createCollection('reports');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.customers.createIndex({ email: 1 });
db.suppliers.createIndex({ name: 1 });
db.inspections.createIndex({ scheduledDate: 1 });
db.inspections.createIndex({ status: 1 });

// Create default admin user (only if doesn't exist)
const adminExists = db.users.findOne({ email: 'admin@aerosuite.com' });
if (!adminExists) {
  db.users.insertOne({
    name: 'Admin User',
    email: 'admin@aerosuite.com',
    password: '$2a$10$XQk8yJjK5c5X5X5X5X5X5uQwerty123456', // password: admin123
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('Created default admin user');
}

print('MongoDB initialization complete');
