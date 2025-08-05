/**
 * InspectionService.test.js
 * 
 * Unit tests for the inspection service
 * Implements RF023 - Add comprehensive unit tests for services
 */

const InspectionService = require('../../../../domains/inspection/services/InspectionService');
const InspectionServiceInterface = require('../../../../domains/inspection/interfaces/InspectionServiceInterface');
const Inspection = require('../../../../domains/inspection/models/Inspection');
const { DomainError, ValidationError } = require('../../../../core/errors');

// Mock the repositories and dependencies
jest.mock('../../../../domains/inspection/repositories/InspectionRepository', () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  exists: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
}));

jest.mock('../../../../domains/customer/repositories/CustomerRepository', () => ({
  exists: jest.fn()
}));

jest.mock('../../../../domains/supplier/repositories/SupplierRepository', () => ({
  exists: jest.fn()
}));

// Mock the EventEmitter
jest.mock('../../../../core/EventEmitter', () => ({
  getInstance: jest.fn().mockReturnValue({
    emit: jest.fn(),
    on: jest.fn()
  })
}));

// Mock the Inspection model
jest.mock('../../../../domains/inspection/models/Inspection', () => ({
  create: jest.fn(),
}));

describe('InspectionService', () => {
  let inspectionService;
  let mockInspectionRepository;
  let mockCustomerRepository;
  let mockSupplierRepository;
  let mockEventEmitter;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get the mocked repositories
    mockInspectionRepository = require('../../../../domains/inspection/repositories/InspectionRepository');
    mockCustomerRepository = require('../../../../domains/customer/repositories/CustomerRepository');
    mockSupplierRepository = require('../../../../domains/supplier/repositories/SupplierRepository');
    
    // Get the mocked event emitter
    mockEventEmitter = require('../../../../core/EventEmitter').getInstance();
    
    // Get the service instance
    inspectionService = InspectionService;
  });
  
  describe('Service Interface', () => {
    it('should register with the inspection service interface', () => {
      // The service should be registered with the interface
      const inspectionServiceInterface = InspectionServiceInterface.getInstance();
      expect(inspectionServiceInterface.getImplementation()).toBe(inspectionService);
    });
    
    it('should implement all required methods of the interface', () => {
      // Get the interface
      const inspectionServiceInterface = InspectionServiceInterface.getInstance();
      
      // Check if the implementation is valid
      expect(inspectionServiceInterface.isValidImplementation(inspectionService)).toBe(true);
    });
  });
  
  describe('findById', () => {
    it('should throw an error if id is not provided', async () => {
      // Arrange
      const id = null;
      
      // Act & Assert
      await expect(inspectionService.findById(id)).rejects.toThrow(ValidationError);
      expect(mockInspectionRepository.findById).not.toHaveBeenCalled();
    });
    
    it('should return the inspection if found', async () => {
      // Arrange
      const id = '123';
      const mockInspection = { id: '123', type: 'quality-audit' };
      mockInspectionRepository.findById.mockResolvedValue(mockInspection);
      
      // Act
      const result = await inspectionService.findById(id);
      
      // Assert
      expect(result).toBe(mockInspection);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(id);
    });
    
    it('should return null if inspection is not found', async () => {
      // Arrange
      const id = '123';
      mockInspectionRepository.findById.mockResolvedValue(null);
      
      // Act
      const result = await inspectionService.findById(id);
      
      // Assert
      expect(result).toBeNull();
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(id);
    });
  });
  
  describe('findAll', () => {
    it('should return inspections and total count', async () => {
      // Arrange
      const options = { filter: { type: 'quality-audit' }, page: 2, limit: 10, sort: 'scheduledDate' };
      const mockInspections = [{ id: '1', type: 'quality-audit' }, { id: '2', type: 'quality-audit' }];
      const mockTotal = 20;
      
      mockInspectionRepository.findAll.mockResolvedValue(mockInspections);
      mockInspectionRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await inspectionService.findAll(options);
      
      // Assert
      expect(result).toEqual({
        data: mockInspections,
        total: mockTotal,
        page: 2,
        limit: 10,
        totalPages: 2
      });
      
      expect(mockInspectionRepository.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          skip: 10,
          limit: 10,
          sort: { scheduledDate: 1 }
        })
      );
      
      expect(mockInspectionRepository.count).toHaveBeenCalled();
    });
    
    it('should handle descending sort order', async () => {
      // Arrange
      const options = { sort: '-scheduledDate' };
      const mockInspections = [{ id: '1', type: 'quality-audit' }];
      const mockTotal = 1;
      
      mockInspectionRepository.findAll.mockResolvedValue(mockInspections);
      mockInspectionRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await inspectionService.findAll(options);
      
      // Assert
      expect(mockInspectionRepository.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          sort: { scheduledDate: -1 }
        })
      );
    });
    
    it('should use default values if options are not provided', async () => {
      // Arrange
      const mockInspections = [{ id: '1', type: 'quality-audit' }];
      const mockTotal = 1;
      
      mockInspectionRepository.findAll.mockResolvedValue(mockInspections);
      mockInspectionRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await inspectionService.findAll({});
      
      // Assert
      expect(mockInspectionRepository.findAll).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          skip: 0,
          limit: 10,
          sort: { scheduledDate: 1 }
        })
      );
    });
  });
  
  describe('create', () => {
    it('should throw an error if type is not provided', async () => {
      // Arrange
      const inspectionData = { 
        scheduledDate: new Date(),
        customerId: '123'
      };
      
      // Act & Assert
      await expect(inspectionService.create(inspectionData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.exists).not.toHaveBeenCalled();
      expect(Inspection.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if scheduledDate is not provided', async () => {
      // Arrange
      const inspectionData = { 
        type: 'quality-audit',
        customerId: '123'
      };
      
      // Act & Assert
      await expect(inspectionService.create(inspectionData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.exists).not.toHaveBeenCalled();
      expect(Inspection.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if customerId is not provided', async () => {
      // Arrange
      const inspectionData = { 
        type: 'quality-audit',
        scheduledDate: new Date()
      };
      
      // Act & Assert
      await expect(inspectionService.create(inspectionData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.exists).not.toHaveBeenCalled();
      expect(Inspection.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if customer does not exist', async () => {
      // Arrange
      const inspectionData = { 
        type: 'quality-audit',
        scheduledDate: new Date(),
        customerId: '123'
      };
      
      mockCustomerRepository.exists.mockResolvedValue(false);
      
      // Act & Assert
      await expect(inspectionService.create(inspectionData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.exists).toHaveBeenCalledWith({ _id: '123' });
      expect(Inspection.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if supplier does not exist', async () => {
      // Arrange
      const inspectionData = { 
        type: 'quality-audit',
        scheduledDate: new Date(),
        customerId: '123',
        supplierId: '456'
      };
      
      mockCustomerRepository.exists.mockResolvedValue(true);
      mockSupplierRepository.exists.mockResolvedValue(false);
      
      // Act & Assert
      await expect(inspectionService.create(inspectionData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.exists).toHaveBeenCalledWith({ _id: '123' });
      expect(mockSupplierRepository.exists).toHaveBeenCalledWith({ _id: '456' });
      expect(Inspection.create).not.toHaveBeenCalled();
    });
    
    it('should create an inspection if data is valid', async () => {
      // Arrange
      const inspectionData = { 
        type: 'quality-audit',
        scheduledDate: new Date(),
        customerId: '123',
        supplierId: '456'
      };
      
      const mockInspection = {
        id: '789',
        type: 'quality-audit',
        scheduledDate: inspectionData.scheduledDate,
        customerId: '123',
        supplierId: '456',
        toObject: jest.fn().mockReturnValue({ 
          id: '789', 
          type: 'quality-audit',
          scheduledDate: inspectionData.scheduledDate,
          customerId: '123',
          supplierId: '456'
        })
      };
      
      mockCustomerRepository.exists.mockResolvedValue(true);
      mockSupplierRepository.exists.mockResolvedValue(true);
      Inspection.create.mockReturnValue(mockInspection);
      mockInspectionRepository.save.mockResolvedValue(mockInspection);
      
      // Act
      const result = await inspectionService.create(inspectionData);
      
      // Assert
      expect(result).toBe(mockInspection);
      expect(mockCustomerRepository.exists).toHaveBeenCalledWith({ _id: '123' });
      expect(mockSupplierRepository.exists).toHaveBeenCalledWith({ _id: '456' });
      expect(Inspection.create).toHaveBeenCalledWith(inspectionData);
      expect(mockInspectionRepository.save).toHaveBeenCalledWith(mockInspection);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.created',
        expect.objectContaining({ inspection: expect.any(Object) })
      );
    });
    
    it('should create an inspection without supplier if not provided', async () => {
      // Arrange
      const inspectionData = { 
        type: 'quality-audit',
        scheduledDate: new Date(),
        customerId: '123'
      };
      
      const mockInspection = {
        id: '789',
        type: 'quality-audit',
        scheduledDate: inspectionData.scheduledDate,
        customerId: '123',
        toObject: jest.fn().mockReturnValue({ 
          id: '789', 
          type: 'quality-audit',
          scheduledDate: inspectionData.scheduledDate,
          customerId: '123'
        })
      };
      
      mockCustomerRepository.exists.mockResolvedValue(true);
      Inspection.create.mockReturnValue(mockInspection);
      mockInspectionRepository.save.mockResolvedValue(mockInspection);
      
      // Act
      const result = await inspectionService.create(inspectionData);
      
      // Assert
      expect(result).toBe(mockInspection);
      expect(mockCustomerRepository.exists).toHaveBeenCalledWith({ _id: '123' });
      expect(mockSupplierRepository.exists).not.toHaveBeenCalled();
      expect(Inspection.create).toHaveBeenCalledWith(inspectionData);
      expect(mockInspectionRepository.save).toHaveBeenCalledWith(mockInspection);
    });
  });
  
  describe('schedule', () => {
    it('should throw an error if inspection is not found', async () => {
      // Arrange
      const id = '123';
      const scheduledDate = new Date();
      mockInspectionRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(inspectionService.schedule(id, scheduledDate)).rejects.toThrow(ValidationError);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(id);
      expect(mockInspectionRepository.save).not.toHaveBeenCalled();
    });
    
    it('should schedule the inspection if found', async () => {
      // Arrange
      const id = '123';
      const scheduledDate = new Date();
      const mockInspection = {
        id: '123',
        type: 'quality-audit',
        schedule: jest.fn(),
        toObject: jest.fn().mockReturnValue({
          id: '123',
          type: 'quality-audit',
          scheduledDate
        })
      };
      
      mockInspectionRepository.findById.mockResolvedValue(mockInspection);
      mockInspectionRepository.save.mockResolvedValue(mockInspection);
      
      // Act
      const result = await inspectionService.schedule(id, scheduledDate);
      
      // Assert
      expect(result).toBe(mockInspection);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(id);
      expect(mockInspection.schedule).toHaveBeenCalledWith(scheduledDate);
      expect(mockInspectionRepository.save).toHaveBeenCalledWith(mockInspection);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.scheduled',
        expect.objectContaining({
          inspection: expect.any(Object),
          scheduledDate
        })
      );
    });
  });
  
  describe('start', () => {
    it('should throw an error if inspection is not found', async () => {
      // Arrange
      const id = '123';
      mockInspectionRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(inspectionService.start(id)).rejects.toThrow(ValidationError);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(id);
      expect(mockInspectionRepository.save).not.toHaveBeenCalled();
    });
    
    it('should start the inspection if found', async () => {
      // Arrange
      const id = '123';
      const mockInspection = {
        id: '123',
        type: 'quality-audit',
        start: jest.fn(),
        toObject: jest.fn().mockReturnValue({
          id: '123',
          type: 'quality-audit',
          status: 'in-progress'
        })
      };
      
      mockInspectionRepository.findById.mockResolvedValue(mockInspection);
      mockInspectionRepository.save.mockResolvedValue(mockInspection);
      
      // Act
      const result = await inspectionService.start(id);
      
      // Assert
      expect(result).toBe(mockInspection);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(id);
      expect(mockInspection.start).toHaveBeenCalled();
      expect(mockInspectionRepository.save).toHaveBeenCalledWith(mockInspection);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.started',
        expect.objectContaining({
          inspection: expect.any(Object)
        })
      );
    });
  });
  
  describe('complete', () => {
    it('should throw an error if inspection is not found', async () => {
      // Arrange
      const id = '123';
      const completionDetails = { notes: 'Completed successfully' };
      mockInspectionRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(inspectionService.complete(id, completionDetails)).rejects.toThrow(ValidationError);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(id);
      expect(mockInspectionRepository.save).not.toHaveBeenCalled();
    });
    
    it('should complete the inspection if found', async () => {
      // Arrange
      const id = '123';
      const completionDetails = { notes: 'Completed successfully' };
      const mockInspection = {
        id: '123',
        type: 'quality-audit',
        complete: jest.fn(),
        toObject: jest.fn().mockReturnValue({
          id: '123',
          type: 'quality-audit',
          status: 'completed',
          completionDetails
        })
      };
      
      mockInspectionRepository.findById.mockResolvedValue(mockInspection);
      mockInspectionRepository.save.mockResolvedValue(mockInspection);
      
      // Act
      const result = await inspectionService.complete(id, completionDetails);
      
      // Assert
      expect(result).toBe(mockInspection);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(id);
      expect(mockInspection.complete).toHaveBeenCalledWith(completionDetails);
      expect(mockInspectionRepository.save).toHaveBeenCalledWith(mockInspection);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.completed',
        expect.objectContaining({
          inspection: expect.any(Object),
          completionDetails
        })
      );
    });
  });
  
  describe('cancel', () => {
    it('should throw an error if inspection is not found', async () => {
      // Arrange
      const id = '123';
      const reason = 'Customer request';
      mockInspectionRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(inspectionService.cancel(id, reason)).rejects.toThrow(ValidationError);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(id);
      expect(mockInspectionRepository.save).not.toHaveBeenCalled();
    });
    
    it('should cancel the inspection if found', async () => {
      // Arrange
      const id = '123';
      const reason = 'Customer request';
      const mockInspection = {
        id: '123',
        type: 'quality-audit',
        cancel: jest.fn(),
        toObject: jest.fn().mockReturnValue({
          id: '123',
          type: 'quality-audit',
          status: 'cancelled',
          cancellationReason: reason
        })
      };
      
      mockInspectionRepository.findById.mockResolvedValue(mockInspection);
      mockInspectionRepository.save.mockResolvedValue(mockInspection);
      
      // Act
      const result = await inspectionService.cancel(id, reason);
      
      // Assert
      expect(result).toBe(mockInspection);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(id);
      expect(mockInspection.cancel).toHaveBeenCalledWith(reason);
      expect(mockInspectionRepository.save).toHaveBeenCalledWith(mockInspection);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.cancelled',
        expect.objectContaining({
          inspection: expect.any(Object),
          reason
        })
      );
    });
  });
  
  describe('addFinding', () => {
    it('should throw an error if inspection is not found', async () => {
      // Arrange
      const inspectionId = '123';
      const findingData = { description: 'Finding 1', severity: 'high' };
      mockInspectionRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(inspectionService.addFinding(inspectionId, findingData)).rejects.toThrow(ValidationError);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(inspectionId);
      expect(mockInspectionRepository.save).not.toHaveBeenCalled();
    });
    
    it('should throw an error if finding description is not provided', async () => {
      // Arrange
      const inspectionId = '123';
      const findingData = { severity: 'high' };
      const mockInspection = {
        id: '123',
        type: 'quality-audit',
        addFinding: jest.fn()
      };
      
      mockInspectionRepository.findById.mockResolvedValue(mockInspection);
      
      // Act & Assert
      await expect(inspectionService.addFinding(inspectionId, findingData)).rejects.toThrow(ValidationError);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(inspectionId);
      expect(mockInspection.addFinding).not.toHaveBeenCalled();
      expect(mockInspectionRepository.save).not.toHaveBeenCalled();
    });
    
    it('should throw an error if finding severity is not provided', async () => {
      // Arrange
      const inspectionId = '123';
      const findingData = { description: 'Finding 1' };
      const mockInspection = {
        id: '123',
        type: 'quality-audit',
        addFinding: jest.fn()
      };
      
      mockInspectionRepository.findById.mockResolvedValue(mockInspection);
      
      // Act & Assert
      await expect(inspectionService.addFinding(inspectionId, findingData)).rejects.toThrow(ValidationError);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(inspectionId);
      expect(mockInspection.addFinding).not.toHaveBeenCalled();
      expect(mockInspectionRepository.save).not.toHaveBeenCalled();
    });
    
    it('should add finding if data is valid', async () => {
      // Arrange
      const inspectionId = '123';
      const findingData = { description: 'Finding 1', severity: 'high' };
      const mockFinding = { id: 'f1', description: 'Finding 1', severity: 'high' };
      const mockInspection = {
        id: '123',
        type: 'quality-audit',
        addFinding: jest.fn().mockReturnValue(mockFinding)
      };
      
      mockInspectionRepository.findById.mockResolvedValue(mockInspection);
      
      // Act
      const result = await inspectionService.addFinding(inspectionId, findingData);
      
      // Assert
      expect(result).toBe(mockFinding);
      expect(mockInspectionRepository.findById).toHaveBeenCalledWith(inspectionId);
      expect(mockInspection.addFinding).toHaveBeenCalledWith(findingData);
      expect(mockInspectionRepository.save).toHaveBeenCalledWith(mockInspection);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inspection.finding.added',
        expect.objectContaining({
          inspectionId,
          finding: mockFinding
        })
      );
    });
  });
  
  // Tests for getByCustomer
  describe('getByCustomer', () => {
    it('should get inspections by customer', async () => {
      // Arrange
      const customerId = '123';
      const options = { page: 1, limit: 10, sort: 'scheduledDate' };
      const mockInspections = [{ id: '1', type: 'quality-audit', customerId: '123' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      inspectionService.findAll = jest.fn().mockResolvedValue({
        data: mockInspections,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await inspectionService.getByCustomer(customerId, options);
      
      // Assert
      expect(result).toEqual({
        data: mockInspections,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(inspectionService.findAll).toHaveBeenCalledWith({
        filter: { customerId },
        page: 1,
        limit: 10,
        sort: 'scheduledDate'
      });
    });
  });
  
  // Tests for getBySupplier
  describe('getBySupplier', () => {
    it('should get inspections by supplier', async () => {
      // Arrange
      const supplierId = '456';
      const options = { page: 1, limit: 10, sort: 'scheduledDate' };
      const mockInspections = [{ id: '1', type: 'quality-audit', supplierId: '456' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      inspectionService.findAll = jest.fn().mockResolvedValue({
        data: mockInspections,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await inspectionService.getBySupplier(supplierId, options);
      
      // Assert
      expect(result).toEqual({
        data: mockInspections,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(inspectionService.findAll).toHaveBeenCalledWith({
        filter: { supplierId },
        page: 1,
        limit: 10,
        sort: 'scheduledDate'
      });
    });
  });
  
  // Tests for getByStatus
  describe('getByStatus', () => {
    it('should get inspections by status', async () => {
      // Arrange
      const status = 'scheduled';
      const options = { page: 1, limit: 10, sort: 'scheduledDate' };
      const mockInspections = [{ id: '1', type: 'quality-audit', status: 'scheduled' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      inspectionService.findAll = jest.fn().mockResolvedValue({
        data: mockInspections,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await inspectionService.getByStatus(status, options);
      
      // Assert
      expect(result).toEqual({
        data: mockInspections,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(inspectionService.findAll).toHaveBeenCalledWith({
        filter: { status },
        page: 1,
        limit: 10,
        sort: 'scheduledDate'
      });
    });
  });
  
  // Tests for getByDateRange
  describe('getByDateRange', () => {
    it('should get inspections by date range', async () => {
      // Arrange
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const options = { page: 1, limit: 10, sort: 'scheduledDate' };
      const mockInspections = [{ id: '1', type: 'quality-audit', scheduledDate: new Date('2023-01-15') }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      inspectionService.findAll = jest.fn().mockResolvedValue({
        data: mockInspections,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await inspectionService.getByDateRange(startDate, endDate, options);
      
      // Assert
      expect(result).toEqual({
        data: mockInspections,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(inspectionService.findAll).toHaveBeenCalledWith({
        filter: { dateFrom: startDate, dateTo: endDate },
        page: 1,
        limit: 10,
        sort: 'scheduledDate'
      });
    });
  });
});
