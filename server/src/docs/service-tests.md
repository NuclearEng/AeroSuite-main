# Service Unit Tests

This document describes the unit testing approach for domain services in the AeroSuite application.

## Overview

Unit tests for domain services ensure that business logic is correctly implemented and that services properly interact with repositories and other dependencies. The testing approach follows these principles:

- **Isolation**: Tests run in isolation using mocks for repositories and other dependencies
- **Coverage**: Tests cover all public methods and edge cases
- **Consistency**: Tests follow a consistent structure across all domain services
- **Readability**: Tests use descriptive names and clear assertions

## Test Structure

Each service test file follows a similar structure:

1. **Setup**: Mock repositories, event emitter, and models
2. **Interface Tests**: Verify the service implements its interface correctly
3. **Method Tests**: Test each public method with various inputs and edge cases
4. **Specialized Tests**: Test domain-specific functionality

## Mocking Strategy

The tests use Jest's mocking capabilities to isolate the service from its dependencies:

```javascript
// Mock the repositories and dependencies
jest.mock('../../../../domains/supplier/repositories/SupplierRepository', () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  exists: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
}));

// Mock the EventEmitter
jest.mock('../../../../core/EventEmitter', () => ({
  getInstance: jest.fn().mockReturnValue({
    emit: jest.fn(),
    on: jest.fn()
  })
}));

// Mock the model
jest.mock('../../../../domains/supplier/models/Supplier', () => ({
  create: jest.fn(),
}));
```

## Test Cases

Each method is tested with the following cases:

1. **Validation**: Test input validation and error handling
2. **Success Path**: Test the happy path with valid inputs
3. **Edge Cases**: Test boundary conditions and special cases
4. **Error Handling**: Test error conditions and recovery

## Example Test Pattern

```javascript
describe('methodName', () => {
  it('should throw an error if required parameter is not provided', async () => {
    // Arrange
    const invalidInput = { /* missing required field */ };
    
    // Act & Assert
    await expect(service.methodName(invalidInput)).rejects.toThrow(ValidationError);
    expect(mockRepository.method).not.toHaveBeenCalled();
  });
  
  it('should perform expected action if input is valid', async () => {
    // Arrange
    const validInput = { /* valid data */ };
    const mockResult = { /* expected result */ };
    mockRepository.method.mockResolvedValue(mockResult);
    
    // Act
    const result = await service.methodName(validInput);
    
    // Assert
    expect(result).toBe(mockResult);
    expect(mockRepository.method).toHaveBeenCalledWith(validInput);
    expect(mockEventEmitter.emit).toHaveBeenCalledWith(
      'event.name',
      expect.objectContaining({ /* expected event data */ })
    );
  });
});
```

## Running Tests

Tests can be run using the Jest test runner:

```bash
# Run all service tests
npm test -- --testPathPattern=domains/.*/services

# Run tests for a specific domain service
npm test -- --testPathPattern=domains/supplier/services

# Run a specific test file
npm test -- server/src/__tests__/domains/supplier/services/SupplierService.test.js
```

## Test Coverage

The tests aim for high coverage of service methods, focusing on:

1. **Line Coverage**: Ensuring all code paths are executed
2. **Branch Coverage**: Testing all conditional branches
3. **Function Coverage**: Testing all public methods
4. **Statement Coverage**: Testing all statements

## Implemented Tests

The following service tests have been implemented:

1. **SupplierService.test.js**: Tests for supplier domain service
2. **CustomerService.test.js**: Tests for customer domain service
3. **InspectionService.test.js**: Tests for inspection domain service
4. **ComponentService.test.js**: Tests for component domain service

Each test file contains comprehensive tests for all public methods of the corresponding service.

## Best Practices

When writing service tests, follow these best practices:

1. **Arrange-Act-Assert**: Structure tests with clear arrangement, action, and assertion sections
2. **Clear Naming**: Use descriptive test names that explain the expected behavior
3. **Minimal Mocking**: Mock only what's necessary for the test
4. **Reset Mocks**: Clear mock state between tests to ensure isolation
5. **Test Edge Cases**: Include tests for boundary conditions and error cases
6. **Verify Events**: Check that appropriate events are emitted with correct data
7. **Avoid Test Interdependence**: Each test should be able to run independently 