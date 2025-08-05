/**
 * Domain Events Integration Tests
 * 
 * Tests for the integration between domains using domain events
 */

const DomainEventBus = require('../../core/DomainEventBus');
const customerEvents = require('../../domains/customer/events');
const inspectionEvents = require('../../domains/inspection/events');

// Mock repositories
jest.mock('../../domains/customer/repositories/customerRepository', () => ({
  findById: jest.fn().mockResolvedValue({
    id: 'customer-1',
    name: 'Test Customer',
    status: 'active'
  })
}));

jest.mock('../../domains/inspection/repositories/inspectionRepository', () => ({
  findByCustomerAndStatus: jest.fn().mockResolvedValue([
    { id: 'inspection-1', title: 'Test Inspection 1' },
    { id: 'inspection-2', title: 'Test Inspection 2' }
  ]),
  findBySupplierAndStatus: jest.fn().mockResolvedValue([
    { id: 'inspection-3', title: 'Test Inspection 3' }
  ]),
  findByComponentId: jest.fn().mockResolvedValue([
    { id: 'inspection-4', title: 'Test Inspection 4' }
  ])
}));

// Mock logger
jest.mock('../../infrastructure/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Domain Events Integration', () => {
  beforeEach(() => {
    // Clear all mocks and subscriptions before each test
    jest.clearAllMocks();
    DomainEventBus.clearSubscriptions();
    
    // Initialize event handlers
    customerEvents.handlers.initializeCustomerEventHandlers();
    inspectionEvents.handlers.initializeInspectionEventHandlers();
  });
  
  describe('Customer to Inspection integration', () => {
    test('CustomerStatusUpdated event should be handled by inspection domain', async () => {
      // Arrange
      const customerRepository = require('../../domains/customer/repositories/customerRepository');
      const inspectionRepository = require('../../domains/inspection/repositories/inspectionRepository');
      const logger = require('../../infrastructure/logger');
      
      // Act
      customerEvents.publishers.publishCustomerStatusUpdated(
        { id: 'customer-1', status: 'inactive', toObject: () => ({ id: 'customer-1', status: 'inactive' }) },
        'active'
      );
      
      // Wait for async event handling
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(inspectionRepository.findByCustomerAndStatus).toHaveBeenCalledWith('customer-1', 'scheduled');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Found 2 scheduled inspections'), expect.anything());
    });
  });
  
  describe('Inspection to Customer integration', () => {
    test('InspectionCompleted event should be handled by customer domain', async () => {
      // Arrange
      const customerRepository = require('../../domains/customer/repositories/customerRepository');
      const logger = require('../../infrastructure/logger');
      
      // Act
      inspectionEvents.publishers.publishInspectionCompleted(
        { 
          id: 'inspection-1', 
          customerId: 'customer-1', 
          supplierId: 'supplier-1',
          defects: [],
          toObject: () => ({ 
            id: 'inspection-1', 
            customerId: 'customer-1', 
            supplierId: 'supplier-1',
            defects: []
          }) 
        },
        'passed'
      );
      
      // Wait for async event handling
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(customerRepository.findById).toHaveBeenCalledWith('customer-1');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Updated customer customer-1 with inspection result: passed'),
        expect.anything()
      );
    });
    
    test('InspectionScheduled event should be handled by customer domain', async () => {
      // Arrange
      const customerRepository = require('../../domains/customer/repositories/customerRepository');
      const logger = require('../../infrastructure/logger');
      
      const scheduledDate = new Date('2023-01-01T10:00:00Z');
      
      // Act
      inspectionEvents.publishers.publishInspectionScheduled(
        { 
          id: 'inspection-1', 
          customerId: 'customer-1', 
          supplierId: 'supplier-1',
          scheduledDate,
          toObject: () => ({ 
            id: 'inspection-1', 
            customerId: 'customer-1', 
            supplierId: 'supplier-1',
            scheduledDate
          }) 
        }
      );
      
      // Wait for async event handling
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(customerRepository.findById).toHaveBeenCalledWith('customer-1');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Updated customer customer-1 with scheduled inspection'),
        expect.anything()
      );
    });
  });
  
  describe('Event validation', () => {
    test('should validate events against schemas', () => {
      // Register schemas
      customerEvents.publishers.initializeCustomerEventPublishers();
      
      // Valid event should not throw
      expect(() => {
        DomainEventBus.publishFromContext('customer', {
          type: 'CustomerCreated',
          payload: {
            customerId: 'customer-1',
            name: 'Test Customer',
            code: 'TEST-001'
          }
        });
      }).not.toThrow();
      
      // Invalid event should throw
      expect(() => {
        DomainEventBus.publishFromContext('customer', {
          type: 'CustomerCreated',
          payload: {
            // Missing required fields
            customerId: 'customer-1'
          }
        });
      }).toThrow();
    });
  });
}); 