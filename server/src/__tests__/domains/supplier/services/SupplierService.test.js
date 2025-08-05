/**
 * SupplierService.test.js
 * 
 * Unit tests for the supplier service
 * Implements RF023 - Add comprehensive unit tests for services
 */

const SupplierService = require('../../../../domains/supplier/services/SupplierService');
const SupplierServiceInterface = require('../../../../domains/supplier/interfaces/SupplierServiceInterface');
const Supplier = require('../../../../domains/supplier/models/Supplier');
const { DomainError, ValidationError } = require('../../../../core/errors');

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

// Mock the Supplier model
jest.mock('../../../../domains/supplier/models/Supplier', () => ({
  create: jest.fn(),
}));

describe('SupplierService', () => {
  let supplierService;
  let mockSupplierRepository;
  let mockEventEmitter;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get the mocked repository
    mockSupplierRepository = require('../../../../domains/supplier/repositories/SupplierRepository');
    
    // Get the mocked event emitter
    mockEventEmitter = require('../../../../core/EventEmitter').getInstance();
    
    // Get the service instance
    supplierService = SupplierService;
  });
  
  describe('Service Interface', () => {
    it('should register with the supplier service interface', () => {
      // The service should be registered with the interface
      const supplierServiceInterface = SupplierServiceInterface.getInstance();
      expect(supplierServiceInterface.getImplementation()).toBe(supplierService);
    });
    
    it('should implement all required methods of the interface', () => {
      // Get the interface
      const supplierServiceInterface = SupplierServiceInterface.getInstance();
      
      // Check if the implementation is valid
      expect(supplierServiceInterface.isValidImplementation(supplierService)).toBe(true);
    });
  });
  
  describe('findById', () => {
    it('should throw an error if id is not provided', async () => {
      // Arrange
      const id = null;
      
      // Act & Assert
      await expect(supplierService.findById(id)).rejects.toThrow(ValidationError);
      expect(mockSupplierRepository.findById).not.toHaveBeenCalled();
    });
    
    it('should return the supplier if found', async () => {
      // Arrange
      const id = '123';
      const mockSupplier = { id: '123', name: 'Test Supplier' };
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      
      // Act
      const result = await supplierService.findById(id);
      
      // Assert
      expect(result).toBe(mockSupplier);
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(id);
    });
    
    it('should return null if supplier is not found', async () => {
      // Arrange
      const id = '123';
      mockSupplierRepository.findById.mockResolvedValue(null);
      
      // Act
      const result = await supplierService.findById(id);
      
      // Assert
      expect(result).toBeNull();
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(id);
    });
  });
  
  describe('findAll', () => {
    it('should return suppliers and total count', async () => {
      // Arrange
      const options = { filter: { name: 'Test' }, page: 2, limit: 10, sort: 'name' };
      const mockSuppliers = [{ id: '1', name: 'Test 1' }, { id: '2', name: 'Test 2' }];
      const mockTotal = 20;
      
      mockSupplierRepository.findAll.mockResolvedValue(mockSuppliers);
      mockSupplierRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await supplierService.findAll(options);
      
      // Assert
      expect(result).toEqual({
        data: mockSuppliers,
        total: mockTotal,
        page: 2,
        limit: 10,
        totalPages: 2
      });
      
      expect(mockSupplierRepository.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          skip: 10,
          limit: 10,
          sort: { name: 1 }
        })
      );
      
      expect(mockSupplierRepository.count).toHaveBeenCalled();
    });
    
    it('should handle descending sort order', async () => {
      // Arrange
      const options = { sort: '-name' };
      const mockSuppliers = [{ id: '1', name: 'Test 1' }];
      const mockTotal = 1;
      
      mockSupplierRepository.findAll.mockResolvedValue(mockSuppliers);
      mockSupplierRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await supplierService.findAll(options);
      
      // Assert
      expect(mockSupplierRepository.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          sort: { name: -1 }
        })
      );
    });
    
    it('should use default values if options are not provided', async () => {
      // Arrange
      const mockSuppliers = [{ id: '1', name: 'Test 1' }];
      const mockTotal = 1;
      
      mockSupplierRepository.findAll.mockResolvedValue(mockSuppliers);
      mockSupplierRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await supplierService.findAll({});
      
      // Assert
      expect(mockSupplierRepository.findAll).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          skip: 0,
          limit: 10,
          sort: { createdAt: 1 }
        })
      );
    });
  });
  
  describe('create', () => {
    it('should throw an error if name is not provided', async () => {
      // Arrange
      const supplierData = { code: '123' };
      
      // Act & Assert
      await expect(supplierService.create(supplierData)).rejects.toThrow(ValidationError);
      expect(mockSupplierRepository.exists).not.toHaveBeenCalled();
      expect(Supplier.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if code is not provided', async () => {
      // Arrange
      const supplierData = { name: 'Test Supplier' };
      
      // Act & Assert
      await expect(supplierService.create(supplierData)).rejects.toThrow(ValidationError);
      expect(mockSupplierRepository.exists).not.toHaveBeenCalled();
      expect(Supplier.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if code already exists', async () => {
      // Arrange
      const supplierData = { name: 'Test Supplier', code: '123' };
      mockSupplierRepository.exists.mockResolvedValue(true);
      
      // Act & Assert
      await expect(supplierService.create(supplierData)).rejects.toThrow(ValidationError);
      expect(mockSupplierRepository.exists).toHaveBeenCalledWith({ code: '123' });
      expect(Supplier.create).not.toHaveBeenCalled();
    });
    
    it('should create a supplier if data is valid', async () => {
      // Arrange
      const supplierData = { name: 'Test Supplier', code: '123' };
      const mockSupplier = {
        id: '456',
        name: 'Test Supplier',
        code: '123',
        toObject: jest.fn().mockReturnValue({ id: '456', name: 'Test Supplier', code: '123' })
      };
      
      mockSupplierRepository.exists.mockResolvedValue(false);
      Supplier.create.mockReturnValue(mockSupplier);
      mockSupplierRepository.save.mockResolvedValue(mockSupplier);
      
      // Act
      const result = await supplierService.create(supplierData);
      
      // Assert
      expect(result).toBe(mockSupplier);
      expect(mockSupplierRepository.exists).toHaveBeenCalledWith({ code: '123' });
      expect(Supplier.create).toHaveBeenCalledWith(supplierData);
      expect(mockSupplierRepository.save).toHaveBeenCalledWith(mockSupplier);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'supplier.created',
        expect.objectContaining({ supplier: expect.any(Object) })
      );
    });
  });
  
  describe('update', () => {
    it('should throw an error if supplier is not found', async () => {
      // Arrange
      const id = '123';
      const supplierData = { name: 'Updated Supplier' };
      mockSupplierRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(supplierService.update(id, supplierData)).rejects.toThrow(ValidationError);
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(id);
      expect(mockSupplierRepository.save).not.toHaveBeenCalled();
    });
    
    it('should throw an error if code is being changed to an existing code', async () => {
      // Arrange
      const id = '123';
      const supplierData = { code: 'NEW123' };
      const mockSupplier = {
        id: '123',
        name: 'Test Supplier',
        code: 'OLD123',
        updateDetails: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Supplier', code: 'NEW123' })
      };
      
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      mockSupplierRepository.exists.mockResolvedValue(true);
      
      // Act & Assert
      await expect(supplierService.update(id, supplierData)).rejects.toThrow(ValidationError);
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(id);
      expect(mockSupplierRepository.exists).toHaveBeenCalledWith({
        code: 'NEW123',
        _id: { $ne: id }
      });
      expect(mockSupplier.updateDetails).not.toHaveBeenCalled();
      expect(mockSupplierRepository.save).not.toHaveBeenCalled();
    });
    
    it('should update supplier details if data is valid', async () => {
      // Arrange
      const id = '123';
      const supplierData = { name: 'Updated Supplier', description: 'Updated description' };
      const mockSupplier = {
        id: '123',
        name: 'Test Supplier',
        code: 'CODE123',
        updateDetails: jest.fn(),
        updateAddress: jest.fn(),
        activate: jest.fn(),
        deactivate: jest.fn(),
        blacklist: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Updated Supplier', code: 'CODE123' })
      };
      
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      mockSupplierRepository.save.mockResolvedValue(mockSupplier);
      
      // Act
      const result = await supplierService.update(id, supplierData);
      
      // Assert
      expect(result).toBe(mockSupplier);
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(id);
      expect(mockSupplier.updateDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Supplier',
          description: 'Updated description'
        })
      );
      expect(mockSupplierRepository.save).toHaveBeenCalledWith(mockSupplier);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'supplier.updated',
        expect.objectContaining({
          supplier: expect.any(Object),
          updatedFields: expect.arrayContaining(['name', 'description'])
        })
      );
    });
    
    it('should update supplier address if address is provided', async () => {
      // Arrange
      const id = '123';
      const supplierData = {
        address: {
          street: '123 Main St',
          city: 'Test City',
          country: 'Test Country'
        }
      };
      const mockSupplier = {
        id: '123',
        name: 'Test Supplier',
        code: 'CODE123',
        updateDetails: jest.fn(),
        updateAddress: jest.fn(),
        activate: jest.fn(),
        deactivate: jest.fn(),
        blacklist: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Supplier', code: 'CODE123' })
      };
      
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      mockSupplierRepository.save.mockResolvedValue(mockSupplier);
      
      // Act
      const result = await supplierService.update(id, supplierData);
      
      // Assert
      expect(mockSupplier.updateAddress).toHaveBeenCalledWith(supplierData.address);
    });
    
    it('should update supplier status if status is provided', async () => {
      // Arrange
      const id = '123';
      const supplierData = { status: 'active' };
      const mockSupplier = {
        id: '123',
        name: 'Test Supplier',
        code: 'CODE123',
        updateDetails: jest.fn(),
        updateAddress: jest.fn(),
        activate: jest.fn(),
        deactivate: jest.fn(),
        blacklist: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Supplier', code: 'CODE123' })
      };
      
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      mockSupplierRepository.save.mockResolvedValue(mockSupplier);
      
      // Act
      const result = await supplierService.update(id, supplierData);
      
      // Assert
      expect(mockSupplier.activate).toHaveBeenCalled();
      expect(mockSupplier.deactivate).not.toHaveBeenCalled();
      expect(mockSupplier.blacklist).not.toHaveBeenCalled();
    });
    
    it('should deactivate supplier if status is inactive', async () => {
      // Arrange
      const id = '123';
      const supplierData = { status: 'inactive' };
      const mockSupplier = {
        id: '123',
        name: 'Test Supplier',
        code: 'CODE123',
        updateDetails: jest.fn(),
        updateAddress: jest.fn(),
        activate: jest.fn(),
        deactivate: jest.fn(),
        blacklist: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Supplier', code: 'CODE123' })
      };
      
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      mockSupplierRepository.save.mockResolvedValue(mockSupplier);
      
      // Act
      const result = await supplierService.update(id, supplierData);
      
      // Assert
      expect(mockSupplier.activate).not.toHaveBeenCalled();
      expect(mockSupplier.deactivate).toHaveBeenCalled();
      expect(mockSupplier.blacklist).not.toHaveBeenCalled();
    });
    
    it('should blacklist supplier if status is blacklisted', async () => {
      // Arrange
      const id = '123';
      const supplierData = { status: 'blacklisted' };
      const mockSupplier = {
        id: '123',
        name: 'Test Supplier',
        code: 'CODE123',
        updateDetails: jest.fn(),
        updateAddress: jest.fn(),
        activate: jest.fn(),
        deactivate: jest.fn(),
        blacklist: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Supplier', code: 'CODE123' })
      };
      
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      mockSupplierRepository.save.mockResolvedValue(mockSupplier);
      
      // Act
      const result = await supplierService.update(id, supplierData);
      
      // Assert
      expect(mockSupplier.activate).not.toHaveBeenCalled();
      expect(mockSupplier.deactivate).not.toHaveBeenCalled();
      expect(mockSupplier.blacklist).toHaveBeenCalled();
    });
  });
  
  describe('delete', () => {
    it('should throw an error if supplier is not found', async () => {
      // Arrange
      const id = '123';
      mockSupplierRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(supplierService.delete(id)).rejects.toThrow(ValidationError);
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(id);
      expect(mockSupplierRepository.delete).not.toHaveBeenCalled();
    });
    
    it('should delete the supplier if found', async () => {
      // Arrange
      const id = '123';
      const mockSupplier = { id: '123', name: 'Test Supplier' };
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      mockSupplierRepository.delete.mockResolvedValue(true);
      
      // Act
      const result = await supplierService.delete(id);
      
      // Assert
      expect(result).toBe(true);
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(id);
      expect(mockSupplierRepository.delete).toHaveBeenCalledWith(id);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'supplier.deleted',
        expect.objectContaining({ supplierId: id })
      );
    });
    
    it('should not emit event if delete fails', async () => {
      // Arrange
      const id = '123';
      const mockSupplier = { id: '123', name: 'Test Supplier' };
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      mockSupplierRepository.delete.mockResolvedValue(false);
      
      // Act
      const result = await supplierService.delete(id);
      
      // Assert
      expect(result).toBe(false);
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(id);
      expect(mockSupplierRepository.delete).toHaveBeenCalledWith(id);
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
  
  // Additional tests for contact management
  describe('addContact', () => {
    it('should throw an error if supplier is not found', async () => {
      // Arrange
      const supplierId = '123';
      const contactData = { name: 'John Doe', email: 'john@example.com' };
      mockSupplierRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(supplierService.addContact(supplierId, contactData)).rejects.toThrow(ValidationError);
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(supplierId);
      expect(mockSupplierRepository.save).not.toHaveBeenCalled();
    });
    
    it('should throw an error if contact name is not provided', async () => {
      // Arrange
      const supplierId = '123';
      const contactData = { email: 'john@example.com' };
      const mockSupplier = {
        id: '123',
        name: 'Test Supplier',
        addContact: jest.fn()
      };
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      
      // Act & Assert
      await expect(supplierService.addContact(supplierId, contactData)).rejects.toThrow(ValidationError);
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(supplierId);
      expect(mockSupplier.addContact).not.toHaveBeenCalled();
      expect(mockSupplierRepository.save).not.toHaveBeenCalled();
    });
    
    it('should throw an error if neither email nor phone is provided', async () => {
      // Arrange
      const supplierId = '123';
      const contactData = { name: 'John Doe' };
      const mockSupplier = {
        id: '123',
        name: 'Test Supplier',
        addContact: jest.fn()
      };
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      
      // Act & Assert
      await expect(supplierService.addContact(supplierId, contactData)).rejects.toThrow(ValidationError);
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(supplierId);
      expect(mockSupplier.addContact).not.toHaveBeenCalled();
      expect(mockSupplierRepository.save).not.toHaveBeenCalled();
    });
    
    it('should add contact if data is valid', async () => {
      // Arrange
      const supplierId = '123';
      const contactData = { name: 'John Doe', email: 'john@example.com', phone: '123456789' };
      const mockContact = { id: 'c1', name: 'John Doe', email: 'john@example.com', phone: '123456789' };
      const mockSupplier = {
        id: '123',
        name: 'Test Supplier',
        addContact: jest.fn().mockReturnValue(mockContact)
      };
      mockSupplierRepository.findById.mockResolvedValue(mockSupplier);
      
      // Act
      const result = await supplierService.addContact(supplierId, contactData);
      
      // Assert
      expect(result).toBe(mockContact);
      expect(mockSupplierRepository.findById).toHaveBeenCalledWith(supplierId);
      expect(mockSupplier.addContact).toHaveBeenCalledWith(contactData);
      expect(mockSupplierRepository.save).toHaveBeenCalledWith(mockSupplier);
    });
  });
  
  // Tests for search functionality
  describe('search', () => {
    it('should search suppliers by query', async () => {
      // Arrange
      const query = 'test';
      const options = { page: 1, limit: 10 };
      const mockSuppliers = [{ id: '1', name: 'Test 1' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      supplierService.findAll = jest.fn().mockResolvedValue({
        data: mockSuppliers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await supplierService.search(query, options);
      
      // Assert
      expect(result).toEqual({
        data: mockSuppliers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(supplierService.findAll).toHaveBeenCalledWith({
        filter: {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { code: { $regex: query, $options: 'i' } },
            { tags: { $in: [query] } }
          ]
        },
        page: 1,
        limit: 10
      });
    });
    
    it('should use default options if not provided', async () => {
      // Arrange
      const query = 'test';
      const mockSuppliers = [{ id: '1', name: 'Test 1' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      supplierService.findAll = jest.fn().mockResolvedValue({
        data: mockSuppliers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await supplierService.search(query);
      
      // Assert
      expect(supplierService.findAll).toHaveBeenCalledWith({
        filter: expect.any(Object),
        page: 1,
        limit: 10
      });
    });
  });
  
  // Tests for getByStatus
  describe('getByStatus', () => {
    it('should get suppliers by status', async () => {
      // Arrange
      const status = 'active';
      const options = { page: 1, limit: 10, sort: 'name' };
      const mockSuppliers = [{ id: '1', name: 'Test 1', status: 'active' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      supplierService.findAll = jest.fn().mockResolvedValue({
        data: mockSuppliers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await supplierService.getByStatus(status, options);
      
      // Assert
      expect(result).toEqual({
        data: mockSuppliers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(supplierService.findAll).toHaveBeenCalledWith({
        filter: { status },
        page: 1,
        limit: 10,
        sort: 'name'
      });
    });
  });
}); 