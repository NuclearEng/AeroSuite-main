# Service Interfaces

This document describes the service interfaces implemented in the AeroSuite application.

## Overview

Service interfaces provide a contract between service consumers and service implementations. They
define the methods that a service must implement, allowing for:

- __Loose coupling__: Consumers depend on interfaces, not implementations
- __Dependency injection__: Services can be easily replaced or mocked for testing
- __Standardization__: All services follow the same patterns and conventions
- __Documentation__: Interfaces clearly define the contract for services

## Interface Structure

Each service interface follows a similar structure:

1. __Singleton Pattern__: Each interface is a singleton that can be accessed via `getInstance()`
2. __Implementation Management__: The interface manages a reference to the implementation
3. __Method Validation__: The interface validates that implementations provide all required methods
4. __Proxy Methods__: The interface proxies method calls to the implementation
5. __Registration__: The interface registers itself and its implementation with the service registry

## Service Registry

The `ServiceRegistry` is a central registry for all service interfaces and implementations. It
provides:

- Registration of interfaces and implementations
- Validation that implementations satisfy their interfaces
- Retrieval of service implementations by name

## Service Provider

The `ServiceProvider` provides convenient access to services:

- Static methods for accessing common services
- Methods for checking if a service is registered
- Methods for listing all registered services

## Available Service Interfaces

### SupplierServiceInterface

Interface for supplier services.

__Required Methods:__
- `findById(id)`: Find a supplier by ID
- `findAll(options)`: Find all suppliers matching the query
- `create(supplierData)`: Create a new supplier
- `update(id, supplierData)`: Update a supplier
- `delete(id)`: Delete a supplier
- `addContact(supplierId, contactData)`: Add a contact to a supplier
- `updateContact(supplierId, contactId, contactData)`: Update a supplier contact
- `removeContact(supplierId, contactId)`: Remove a contact from a supplier
- `addQualification(supplierId, qualificationData)`: Add a qualification to a supplier
- `updateQualification(supplierId, qualificationId, qualificationData)`: Update a supplier
qualification
- `removeQualification(supplierId, qualificationId)`: Remove a qualification from a supplier
- `search(query, options)`: Search suppliers by name, code, or tags
- `getByQualification(qualificationType, options)`: Get suppliers by qualification type
- `getByStatus(status, options)`: Get suppliers by status

### CustomerServiceInterface

Interface for customer services.

__Required Methods:__
- `findById(id)`: Find a customer by ID
- `findAll(options)`: Find all customers matching the query
- `create(customerData)`: Create a new customer
- `update(id, customerData)`: Update a customer
- `delete(id)`: Delete a customer
- `addContact(customerId, contactData)`: Add a contact to a customer
- `updateContact(customerId, contactId, contactData)`: Update a customer contact
- `removeContact(customerId, contactId)`: Remove a contact from a customer
- `search(query, options)`: Search customers by name, email, or phone
- `getByIndustry(industry, options)`: Get customers by industry
- `getByType(type, options)`: Get customers by type
- `getByStatus(status, options)`: Get customers by status

### InspectionServiceInterface

Interface for inspection services.

__Required Methods:__
- `findById(id)`: Find an inspection by ID
- `findAll(options)`: Find all inspections matching the query
- `create(inspectionData)`: Create a new inspection
- `update(id, inspectionData)`: Update an inspection
- `delete(id)`: Delete an inspection
- `schedule(id, scheduledDate)`: Schedule an inspection
- `start(id)`: Start an inspection
- `complete(id, completionDetails)`: Complete an inspection
- `cancel(id, reason)`: Cancel an inspection
- `addFinding(inspectionId, findingData)`: Add a finding to an inspection
- `updateFinding(inspectionId, findingId, findingData)`: Update a finding in an inspection
- `removeFinding(inspectionId, findingId)`: Remove a finding from an inspection
- `getByCustomer(customerId, options)`: Get inspections by customer
- `getBySupplier(supplierId, options)`: Get inspections by supplier
- `getByInspector(inspectorId, options)`: Get inspections by inspector
- `getByStatus(status, options)`: Get inspections by status
- `getByDateRange(startDate, endDate, options)`: Get inspections by date range

### ComponentServiceInterface

Interface for component services.

__Required Methods:__
- `findById(id)`: Find a component by ID
- `findAll(options)`: Find all components matching the query
- `create(componentData)`: Create a new component
- `update(id, componentData)`: Update a component
- `delete(id)`: Delete a component
- `addStock(id, quantity, reason)`: Add stock to a component
- `removeStock(id, quantity, reason)`: Remove stock from a component
- `addDocument(id, documentData)`: Add a document to a component
- `updateDocument(id, documentId, documentData)`: Update a document on a component
- `removeDocument(id, documentId)`: Remove a document from a component
- `search(query, options)`: Search components by name, part number, or description
- `getBySupplier(supplierId, options)`: Get components by supplier
- `getByCategory(category, options)`: Get components by category
- `getByStatus(status, options)`: Get components by status
- `getLowStock(threshold, options)`: Get components with low stock

## Using Service Interfaces

### Basic Usage

```javascript
// Import the service provider
const ServiceProvider = require('../core/interfaces/ServiceProvider');

// Get services
const supplierService = ServiceProvider.getSupplierService();
const customerService = ServiceProvider.getCustomerService();

// Use the services
const suppliers = await supplierService.findAll({ limit: 10 });
const customers = await customerService.findAll({ limit: 10 });
```bash

### Using Interfaces Directly

```javascript
// Import the interface
const SupplierServiceInterface = require('../domains/supplier/interfaces/SupplierServiceInterface');

// Get the interface
const supplierService = SupplierServiceInterface.getInstance();

// Use the service
const activeSuppliers = await supplierService.getByStatus('active', { limit: 10 });
```bash

### Dependency Injection

```javascript
class SupplierController {
  constructor(supplierService) {
    this.supplierService = supplierService;
  }

  async getSuppliers(req, res) {
    const suppliers = await this.supplierService.findAll(req.query);
    res.json(suppliers);
  }
}

// Create controller with injected service
const controller = new SupplierController(ServiceProvider.getSupplierService());
```bash

## Best Practices

1. __Use the Service Provider__: For most cases, use the `ServiceProvider` to get services
2. __Inject Dependencies__: Pass services as dependencies rather than importing them directly
3. __Depend on Interfaces__: Depend on interfaces, not implementations
4. __Test with Mocks__: Use the interface to create mock implementations for testing
5. __Validate Implementations__: Ensure that implementations satisfy their interfaces
6. __Document Interfaces__: Clearly document the contract for each interface
7. __Follow Patterns__: Follow the established patterns for creating and using interfaces

## Testing with Service Interfaces

Service interfaces make it easy to mock services for testing:

```javascript
// Create a mock supplier service
const mockSupplierService = {
  findById: jest.fn().mockResolvedValue({ id: '123', name: 'Test Supplier' }),
  findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
  // ... other required methods
};

// Get the interface
const supplierServiceInterface = SupplierServiceInterface.getInstance();

// Set the mock implementation
supplierServiceInterface.setImplementation(mockSupplierService);

// Now all code that uses the supplier service will use the mock
const result = await supplierServiceInterface.findById('123');
// result = { id: '123', name: 'Test Supplier' }
```bash

## Creating New Service Interfaces

To create a new service interface:

1. Create a new interface file that extends `ServiceInterface`
2. Define the required methods for the interface
3. Implement the `isValidImplementation` method to validate implementations
4. Add proxy methods for each required method
5. Register the interface with the `ServiceRegistry`
6. Update the `ServiceProvider` to provide access to the new service
