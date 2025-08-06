# Test Data Generation

This document describes the test data generation system for the AeroSuite project (Task TS356).

## Overview

The test data generation system provides:

1. __Entity-specific data generation__: Generate realistic data for users, customers, suppliers,
inspections, components, and documents
2. __Relationship preservation__: Maintain proper relationships between generated entities
3. __Configurable volume and complexity__: Generate varying amounts of data based on need
4. __Deterministic or random generation__: Fixed seed for reproducible data or random for variety
5. __Multiple formats__: Output as JSON or JavaScript modules
6. __Environment profiles__: Specific configurations for development, testing, and CI environments
7. __Database seeding__: Direct database population with generated test data
8. __Test factory functions__: Specialized generators for automated tests

## Components

The test data generation system consists of several components:

1. __Test Data Generator Script__ (`scripts/test-data-generator.js`): Command-line tool for
generating test data files
2. __Database Seeder__ (`server/src/utils/databaseSeeder.js`): Utility for seeding the database
with test data
3. __Database Seeder CLI__ (`scripts/seed-database.js`): Command-line interface for the database
seeder
4. __Test Data Generator Class__ (`server/src/utils/testDataGenerator.js`): Core class for
generating entity data
5. __Test Data Generator Functions__ (`server/src/__tests__/utils/testDataGenerator.js`):
Simplified functions for tests
6. __Test Data Factory__ (`server/src/__tests__/utils/testDataFactory.js`): Factory functions for
test data creation

## Installation

To install the required dependencies:

```bash
npm install @faker-js/faker commander chalk nanospinner mongoose
```bash

## Usage

### Command Line Interface for Data Generation

Generate test data files using the command-line tool:

```bash
# Generate data with default settings
npm run test:data

# Generate data with specific environment settings
npm run test:data:dev
npm run test:data:test
npm run test:data:ci
npm run test:data:minimal

# Generate data with custom settings
node scripts/test-data-generator.js generate --users 10 --customers 20 --suppliers 15

# Generate data with a specific output directory
node scripts/test-data-generator.js generate --output ./custom-test-data

# Generate data with a specific seed for reproducible results
node scripts/test-data-generator.js generate --seed 12345

# Import generated data into the database (simulation only)
node scripts/test-data-generator.js import

# Generate data without relationships
node scripts/test-data-generator.js generate --no-relationships

# Include image URLs in generated data
node scripts/test-data-generator.js generate --images
```bash

### Command Line Interface for Database Seeding

Seed the database directly using the database seeder CLI:

```bash
# Seed database with default settings
npm run db:seed

# Seed database with specific environment settings
npm run db:seed:dev
npm run db:seed:test
npm run db:seed:ci
npm run db:seed:minimal

# Seed database with custom settings
node scripts/seed-database.js seed --users 10 --customers 20 --suppliers 15

# Seed database with a specific seed for reproducible results
node scripts/seed-database.js seed --seed my-custom-seed

# Clear the database without seeding
npm run db:clear
```bash

### Programmatic Usage

#### Using the Test Data Generator

```javascript
const { generateTestData } = require('./scripts/test-data-generator');

// Generate test data with custom configuration
const data = generateTestData({
  outputDir: './custom-test-data',
  format: 'json',
  count: {
    users: 10,
    customers: 20,
    suppliers: 15,
    inspections: 50,
    components: 40,
    documents: 30
  },
  relationships: true,
  seed: 12345,
  locale: 'en_US',
  includeImages: false
});

console.log(`Generated ${data.users.length} users`);
```bash

#### Using the Database Seeder

```javascript
const DatabaseSeeder = require('./server/src/utils/databaseSeeder');
const mongoose = require('mongoose');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/aerosuite', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Create seeder with custom configuration
    const seeder = new DatabaseSeeder({
      seed: 'my-custom-seed',
      clearExisting: true,
      counts: {
        users: 10,
        customers: 20,
        suppliers: 15,
        inspections: 30,
        products: 25,
        defects: 40
      }
    });

    // Seed the database
    const generatedIds = await seeder.seedAll();

    console.log('Database seeded successfully!');
    console.log(`Generated ${generatedIds.users.length} users`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
```bash

#### Using the Test Data Factory for Tests

```javascript
const testDataFactory = require('./server/src/__tests__/utils/testDataFactory');

// Create a single user
const user = testDataFactory.createUser({ role: 'admin' });

// Create multiple customers
const customers = testDataFactory.createMany('customer', 5);

// Create related data
const relatedData = testDataFactory.createRelatedData({
  userCount: 3,
  customerCount: 2,
  supplierCount: 2,
  inspectionCount: 4
});

// Create a test scenario
const testData = testDataFactory.createTestScenario('basic');
```bash

## Configuration

### Environment Profiles

The test data generation system includes predefined profiles for different environments:

#### Test Data Generator Profiles

```json
{
  "development": {
    "count": {
      "users": 10,
      "customers": 25,
      "suppliers": 15,
      "inspections": 50,
      "components": 40,
      "documents": 30
    },
    "outputDir": "./test-data/dev"
  },
  "testing": {
    "count": {
      "users": 20,
      "customers": 50,
      "suppliers": 30,
      "inspections": 100,
      "components": 80,
      "documents": 60
    },
    "outputDir": "./test-data/test"
  },
  "ci": {
    "count": {
      "users": 5,
      "customers": 10,
      "suppliers": 8,
      "inspections": 20,
      "components": 15,
      "documents": 10
    },
    "outputDir": "./test-data/ci"
  },
  "minimal": {
    "count": {
      "users": 3,
      "customers": 5,
      "suppliers": 5,
      "inspections": 10,
      "components": 8,
      "documents": 5
    },
    "outputDir": "./test-data/minimal"
  }
}
```bash

#### Database Seeder Profiles

```json
{
  "development": {
    "counts": {
      "users": 10,
      "customers": 20,
      "suppliers": 15,
      "inspections": 30,
      "products": 25,
      "defects": 40
    },
    "clearExisting": true
  },
  "testing": {
    "counts": {
      "users": 20,
      "customers": 50,
      "suppliers": 30,
      "inspections": 100,
      "products": 80,
      "defects": 120
    },
    "clearExisting": true
  },
  "ci": {
    "counts": {
      "users": 5,
      "customers": 10,
      "suppliers": 8,
      "inspections": 15,
      "products": 12,
      "defects": 20
    },
    "clearExisting": true
  },
  "minimal": {
    "counts": {
      "users": 3,
      "customers": 5,
      "suppliers": 5,
      "inspections": 10,
      "products": 8,
      "defects": 15
    },
    "clearExisting": true
  }
}
```bash

### Test Scenarios

The test data factory includes predefined test scenarios for different testing needs:

- __empty__: No entities
- __basic__: Small set of related entities (3 users, 2 customers, 2 suppliers, 4 inspections)
- __complex__: Larger set of related entities (5 users, 10 customers, 8 suppliers, 15 inspections)
- __admin-only__: Single admin user, no other entities
- __inspection-heavy__: Focus on inspections with various statuses (20 inspections)

## Generated Data Examples

### Users

```json
{
  "_id": "6123e4567e89b12d3a456426",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "password": "$2a$10$XYZ...",
  "role": "inspector",
  "phoneNumber": "555-123-4567",
  "department": "Quality",
  "jobTitle": "Senior Inspector",
  "isActive": true,
  "createdAt": "2023-02-15T14:22:18.123Z",
  "updatedAt": "2023-09-30T08:12:45.789Z",
  "lastLogin": "2023-09-30T08:12:45.789Z",
  "preferences": {
    "darkMode": true,
    "emailNotifications": true,
    "dashboardLayout": "standard",
    "defaultView": "inspections"
  },
  "profileImage":
"https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1234.jpg"
}
```bash

### Customers

```json
{
  "_id": "6223e4567e89b12d3a456427",
  "name": "Acme Corporation",
  "contactPerson": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@acmecorp.com",
    "phone": "555-987-6543"
  },
  "address": {
    "street": "123 Main Street",
    "city": "Metropolis",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "industry": "Aerospace",
  "notes": "Key customer for aerospace components.",
  "createdAt": "2022-06-10T09:15:32.123Z",
  "updatedAt": "2023-08-15T11:42:18.456Z",
  "website": "https://acmecorp.example.com",
  "status": "active"
}
```bash

### Suppliers

```json
{
  "_id": "6323e4567e89b12d3a456428",
  "name": "Tech Components Inc",
  "contactPerson": {
    "firstName": "Sarah",
    "lastName": "Johnson",
    "email": "sarah.johnson@techcomponents.com",
    "phone": "555-345-6789"
  },
  "address": {
    "street": "456 Tech Boulevard",
    "city": "Silicon Valley",
    "state": "CA",
    "zipCode": "94088",
    "country": "USA"
  },
  "qualifications": ["ISO 9001", "AS9100"],
  "performance": {
    "qualityScore": 92.5,
    "deliveryScore": 88.7,
    "lastAuditDate": "2023-05-20T00:00:00.000Z",
    "auditResult": "passed",
    "ncCount": 2
  },
  "products": [
    {
      "name": "Precision Bearings",
      "category": "Components",
      "leadTime": 14
    },
    {
      "name": "Control Actuators",
      "category": "Assemblies",
      "leadTime": 30
    }
  ],
  "riskLevel": "low",
  "notes": "Reliable supplier of precision components.",
  "createdAt": "2022-01-10T11:25:32.123Z",
  "updatedAt": "2023-07-05T09:18:45.678Z",
  "status": "approved"
}
```bash

### Inspections

```json
{
  "_id": "6423e4567e89b12d3a456429",
  "supplierId": "6323e4567e89b12d3a456428",
  "customerId": "6223e4567e89b12d3a456427",
  "assignedTo": "6123e4567e89b12d3a456426",
  "scheduledDate": "2023-10-15T09:00:00.000Z",
  "type": "incoming",
  "status": "completed",
  "priority": "high",
  "location": "supplier",
  "checklist": [
    {
      "_id": "6523e4567e89b12d3a45642a",
      "title": "Visual inspection of components",
      "description": "Check for visible defects or damage",
      "status": "passed",
      "comment": "No visible defects found",
      "requiresPhoto": true,
      "requiresComment": true
    },
    {
      "_id": "6523e4567e89b12d3a45642b",
      "title": "Dimensional verification",
      "description": "Verify key dimensions are within tolerance",
      "status": "passed",
      "comment": "All dimensions within specification",
      "requiresPhoto": false,
      "requiresComment": true
    }
  ],
  "defects": [],
  "notes": "Inspection completed successfully. All items meet quality requirements.",
  "createdBy": "6123e4567e89b12d3a456430",
  "createdAt": "2023-09-30T08:15:22.123Z",
  "updatedAt": "2023-10-15T14:30:45.678Z",
  "actualStartTime": "2023-10-15T09:05:12.345Z",
  "actualEndTime": "2023-10-15T14:25:18.456Z",
  "outcome": "passed",
  "followUpRequired": false
}
```bash

## Best Practices

1. __Use Deterministic Seeds__: For reproducible tests, use a fixed seed value.
2. __Maintain Relationships__: When generating related data, ensure proper relationships between
entities.
3. __Use Factory Functions__: For unit tests, use the test data factory functions.
4. __Clean Up After Tests__: When using the database seeder in tests, clean up the database after
tests.
5. __Use Environment Profiles__: Use the predefined environment profiles for different environments.
6. __Customize as Needed__: Override specific properties when needed rather than generating
completely custom data.

## Implementation Details

### Test Data Generator

The test data generator uses the `@faker-js/faker` library to generate realistic data. It supports:

- Configurable entity counts
- Relationship preservation
- Multiple output formats
- Deterministic or random data generation
- Environment-specific configurations

### Database Seeder

The database seeder integrates with the test data generator to populate the database with test
data. It supports:

- Clearing existing data
- Seeding specific entity types
- Maintaining relationships between entities
- Configurable entity counts
- Deterministic or random data generation

### Test Data Factory

The test data factory provides simplified functions for creating test data in automated tests. It
supports:

- Creating individual entities
- Creating multiple entities
- Creating related entities
- Predefined test scenarios

## Extending the System

To add support for a new entity type:

1. Add a generator function to `testDataGenerator.js`
2. Add a seeding method to `databaseSeeder.js`
3. Add a factory function to `testDataFactory.js`
4. Update the CLI tools to support the new entity type

## Troubleshooting

### Common Issues

1. __MongoDB Connection Issues__: Ensure MongoDB is running and the connection URI is correct.
2. __Missing Dependencies__: Ensure all required dependencies are installed.
3. __Relationship Errors__: Check that related entities exist before creating dependent entities.
4. __Duplicate Key Errors__: Clear existing data before seeding or use unique identifiers.
5. __Schema Validation Errors__: Ensure generated data matches the schema requirements.
