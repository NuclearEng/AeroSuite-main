// MongoDB initialization script
db = db.getSiblingDB('aerosuite');

// Create collections
db.createCollection('suppliers');
db.createCollection('customers');
db.createCollection('inspections');
db.createCollection('users');

// Create indexes for better performance
db.suppliers.createIndex({ name: 1 });
db.suppliers.createIndex({ code: 1 }, { unique: true });
db.suppliers.createIndex({ status: 1 });
db.suppliers.createIndex({ type: 1 });

db.customers.createIndex({ name: 1 });
db.customers.createIndex({ status: 1 });

db.inspections.createIndex({ supplierId: 1 });
db.inspections.createIndex({ status: 1 });
db.inspections.createIndex({ scheduledDate: 1 });

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });

// Create admin user
db.users.insertOne({
  username: 'admin',
  email: 'admin@example.com',
  password: '$2a$10$XHmVkl4mGDEYBfsLGQFXyuGbJnFUZ6KFDpD6W1XJvTzlamLY1xhMK', // hashed 'admin123'
  role: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Insert sample suppliers
db.suppliers.insertMany([
  {
    name: 'Aerospace Components Inc.',
    code: 'ACI-001',
    type: 'Manufacturer',
    status: 'active',
    website: 'https://aerospace-components.example.com',
    description: 'Leading manufacturer of precision aerospace components with over 25 years of industry experience.',
    address: {
      street: '123 Aviation Way',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      country: 'USA'
    },
    contacts: [
      {
        name: 'John Smith',
        title: 'CEO',
        email: 'john.smith@aerospace-components.example.com',
        phone: '+1 (206) 555-1234',
        isPrimary: true
      },
      {
        name: 'Sarah Johnson',
        title: 'Sales Manager',
        email: 'sarah.johnson@aerospace-components.example.com',
        phone: '+1 (206) 555-5678',
        isPrimary: false
      }
    ],
    qualifications: [
      {
        name: 'AS9100D',
        status: 'active',
        expiryDate: new Date('2024-06-30'),
        issueDate: new Date('2021-06-30'),
        documentUrl: 'https://example.com/certifications/as9100d.pdf'
      },
      {
        name: 'ISO 9001:2015',
        status: 'active',
        expiryDate: new Date('2025-03-15'),
        issueDate: new Date('2022-03-15'),
        documentUrl: 'https://example.com/certifications/iso9001.pdf'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Global Aviation Parts',
    code: 'GAP-002',
    type: 'Distributor',
    status: 'active',
    website: 'https://global-aviation-parts.example.com',
    description: 'Worldwide distributor of aircraft parts and components for commercial and military applications.',
    address: {
      street: '456 Flight Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90045',
      country: 'USA'
    },
    contacts: [
      {
        name: 'Robert Chen',
        title: 'President',
        email: 'robert.chen@gap.example.com',
        phone: '+1 (310) 555-8765',
        isPrimary: true
      }
    ],
    qualifications: [
      {
        name: 'ASA-100',
        status: 'active',
        expiryDate: new Date('2024-09-22'),
        issueDate: new Date('2021-09-22'),
        documentUrl: 'https://example.com/certifications/asa100.pdf'
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Insert sample customers
db.customers.insertMany([
  { 
    name: 'Global Airlines Inc.', 
    industry: 'Commercial Aviation', 
    status: 'active',
    location: 'New York, NY',
    contactPerson: 'Michael Johnson',
    email: 'mjohnson@globalairlines.example',
    createdAt: new Date('2023-01-10')
  },
  { 
    name: 'Defense Systems Ltd.', 
    industry: 'Military & Defense', 
    status: 'active',
    location: 'Washington, DC',
    contactPerson: 'Sarah Williams',
    email: 'swilliams@defensesystems.example',
    createdAt: new Date('2023-02-15')
  }
]);

print('MongoDB initialization completed successfully!'); 