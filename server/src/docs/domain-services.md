# Domain Services

This document describes the domain services implemented in the AeroSuite application.

## Overview

Domain services encapsulate business logic that doesn't naturally fit within domain entities. They
typically operate on multiple domain entities and repositories, and implement complex business
rules and workflows.

## Base Domain Service

All domain services extend the `DomainService` base class, which provides common functionality:

- Dependency management
- Event publishing and subscription
- Error handling

## Domain Service Structure

Each domain service follows a similar structure:

1. __Constructor__: Initializes the service with dependencies
2. __Dependency Validation__: Ensures all required dependencies are provided
3. __Repository Access__: Methods to access repositories
4. __Query Methods__: Methods to find entities by ID, query entities, etc.
5. __Command Methods__: Methods to create, update, delete entities
6. __Business Logic Methods__: Methods implementing specific business rules
7. __Event Publishing__: Publishing domain events when entities change

## Available Domain Services

### SupplierService

Manages suppliers and their related entities (contacts, qualifications, etc.).

__Key Features:__
- Supplier lifecycle management (creation, updates, deletion)
- Contact management
- Qualification management
- Supplier search and filtering

__Example Usage:__
```javascript
const supplierService = require('../domains/supplier/services/SupplierService');

// Create a new supplier
const supplier = await supplierService.create({
  name: 'Acme Corp',
  code: 'ACME001',
  type: 'manufacturer',
  address: {
    street: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    country: 'USA',
    postalCode: '62701'
  }
});

// Add a contact to a supplier
const contact = await supplierService.addContact(supplier.id, {
  name: 'John Doe',
  email: 'john.doe@acme.com',
  phone: '555-123-4567',
  role: 'Sales Representative',
  isPrimary: true
});

// Find suppliers by status
const activeSuppliers = await supplierService.getByStatus('active', {
  page: 1,
  limit: 10,
  sort: 'name'
});
```bash

### CustomerService

Manages customers and their related entities.

__Key Features:__
- Customer lifecycle management
- Contact management
- Customer search and filtering
- Industry and type categorization

__Example Usage:__
```javascript
const customerService = require('../domains/customer/services/CustomerService');

// Create a new customer
const customer = await customerService.create({
  name: 'XYZ Corporation',
  email: 'info@xyz.com',
  phone: '555-987-6543',
  type: 'enterprise',
  industry: 'manufacturing',
  address: {
    street: '456 Business Ave',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    postalCode: '60601'
  }
});

// Update a customer
const updatedCustomer = await customerService.update(customer.id, {
  industry: 'aerospace',
  status: 'active'
});

// Search customers
const searchResults = await customerService.search('xyz', {
  page: 1,
  limit: 10
});
```bash

### InspectionService

Manages inspections and their related entities (findings, etc.).

__Key Features:__
- Inspection lifecycle management
- Inspection scheduling
- Finding management
- Status transitions (scheduled → in-progress → completed/cancelled)
- Integration with customers and suppliers

__Example Usage:__
```javascript
const inspectionService = require('../domains/inspection/services/InspectionService');

// Create a new inspection
const inspection = await inspectionService.create({
  type: 'quality-audit',
  scheduledDate: new Date('2023-08-15'),
  customerId: 'customer-123',
  supplierId: 'supplier-456',
  location: {
    address: '789 Factory Rd, Detroit, MI, USA',
    coordinates: {
      latitude: 42.331429,
      longitude: -83.045753
    }
  },
  description: 'Annual quality audit',
  priority: 'high'
});

// Start an inspection
const startedInspection = await inspectionService.start(inspection.id);

// Add a finding to an inspection
const finding = await inspectionService.addFinding(inspection.id, {
  description: 'Non-compliant packaging materials',
  severity: 'major',
  category: 'packaging',
  evidence: 'https://storage.example.com/evidence/img123.jpg'
});

// Complete an inspection
const completedInspection = await inspectionService.complete(inspection.id, {
  summary: 'Inspection completed with 3 findings',
  recommendation: 'Follow-up inspection required in 30 days',
  attachments: ['https://storage.example.com/reports/inspection123.pdf']
});
```bash

### ComponentService

Manages components and their related entities.

__Key Features:__
- Component lifecycle management
- Stock management
- Document management
- Supplier integration
- Component search and categorization

__Example Usage:__
```javascript
const componentService = require('../domains/component/services/ComponentService');

// Create a new component
const component = await componentService.create({
  name: 'High-Pressure Valve',
  partNumber: 'HPV-123',
  category: 'valves',
  supplierId: 'supplier-789',
  description: 'High-pressure valve for aerospace applications',
  specifications: {
    material: 'Titanium',
    pressureRating: '5000 PSI',
    weight: '0.75 kg',
    dimensions: '10cm x 5cm x 5cm'
  },
  stockQuantity: 50,
  tags: ['aerospace', 'high-pressure', 'titanium']
});

// Add stock to a component
const updatedComponent = await componentService.addStock(
  component.id,
  25,
  'Received new shipment from supplier'
);

// Get components with low stock
const lowStockComponents = await componentService.getLowStock(10);

// Add a document to a component
const document = await componentService.addDocument(component.id, {
  name: 'Technical Specifications',
  type: 'pdf',
  url: 'https://storage.example.com/docs/hpv-123-specs.pdf',
  version: '1.0'
});
```bash

## Best Practices

1. __Use Domain Services for Complex Logic__: Place business logic that spans multiple entities in
domain services.
2. __Keep Entities Focused__: Domain entities should focus on their own state and behavior.
3. __Validate Input__: Always validate input data before processing.
4. __Publish Domain Events__: Use domain events to communicate changes to other parts of the system.
5. __Use Dependency Injection__: Pass dependencies to services rather than hard-coding them.
6. __Handle Errors Appropriately__: Use domain-specific errors for business rule violations.
7. __Document Service Methods__: Clearly document the purpose and behavior of each service method.

## Error Handling

Domain services use the following error types:

- `DomainError`: For domain-specific errors
- `ValidationError`: For input validation errors
- `NotFoundError`: For when a requested entity is not found
- `ConflictError`: For conflicts (e.g., duplicate unique values)

Example error handling:

```javascript
try {
  const supplier = await supplierService.create({
    name: 'Acme Corp',
    // Missing required code field
  });
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
    console.error('Validation error:', error.message);
  } else if (error instanceof DomainError) {
    // Handle domain error
    console.error('Domain error:', error.message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```bash

## Event Publishing

Domain services publish events when entities change. These events can be subscribed to by other
parts of the system.

Example event subscription:

```javascript
const supplierService = require('../domains/supplier/services/SupplierService');

// Subscribe to supplier created events
supplierService.subscribeToEvent('supplier.created', (data) => {
  console.log('Supplier created:', data.supplier);
  // Perform additional actions
});
```bash
