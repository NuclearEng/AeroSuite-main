/**
 * ComponentService.test.js
 * 
 * Unit tests for the component service
 * Implements RF023 - Add comprehensive unit tests for services
 */

const ComponentService = require('../../../../domains/component/services/ComponentService');
const ComponentServiceInterface = require('../../../../domains/component/interfaces/ComponentServiceInterface');
const Component = require('../../../../domains/component/models/Component');
const { DomainError, ValidationError } = require('../../../../core/errors');

// Mock the repositories and dependencies
jest.mock('../../../../domains/component/repositories/ComponentRepository', () => ({
  findById: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  exists: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
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

// Mock the Component model
jest.mock('../../../../domains/component/models/Component', () => ({
  create: jest.fn(),
}));

describe('ComponentService', () => {
  let componentService;
  let mockComponentRepository;
  let mockSupplierRepository;
  let mockEventEmitter;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get the mocked repositories
    mockComponentRepository = require('../../../../domains/component/repositories/ComponentRepository');
    mockSupplierRepository = require('../../../../domains/supplier/repositories/SupplierRepository');
    
    // Get the mocked event emitter
    mockEventEmitter = require('../../../../core/EventEmitter').getInstance();
    
    // Get the service instance
    componentService = ComponentService;
  });
  
  describe('Service Interface', () => {
    it('should register with the component service interface', () => {
      // The service should be registered with the interface
      const componentServiceInterface = ComponentServiceInterface.getInstance();
      expect(componentServiceInterface.getImplementation()).toBe(componentService);
    });
    
    it('should implement all required methods of the interface', () => {
      // Get the interface
      const componentServiceInterface = ComponentServiceInterface.getInstance();
      
      // Check if the implementation is valid
      expect(componentServiceInterface.isValidImplementation(componentService)).toBe(true);
    });
  });
  
  describe('findById', () => {
    it('should throw an error if id is not provided', async () => {
      // Arrange
      const id = null;
      
      // Act & Assert
      await expect(componentService.findById(id)).rejects.toThrow(ValidationError);
      expect(mockComponentRepository.findById).not.toHaveBeenCalled();
    });
    
    it('should return the component if found', async () => {
      // Arrange
      const id = '123';
      const mockComponent = { id: '123', name: 'Test Component' };
      mockComponentRepository.findById.mockResolvedValue(mockComponent);
      
      // Act
      const result = await componentService.findById(id);
      
      // Assert
      expect(result).toBe(mockComponent);
      expect(mockComponentRepository.findById).toHaveBeenCalledWith(id);
    });
    
    it('should return null if component is not found', async () => {
      // Arrange
      const id = '123';
      mockComponentRepository.findById.mockResolvedValue(null);
      
      // Act
      const result = await componentService.findById(id);
      
      // Assert
      expect(result).toBeNull();
      expect(mockComponentRepository.findById).toHaveBeenCalledWith(id);
    });
  });
  
  describe('findAll', () => {
    it('should return components and total count', async () => {
      // Arrange
      const options = { filter: { category: 'electronics' }, page: 2, limit: 10, sort: 'name' };
      const mockComponents = [{ id: '1', name: 'Component 1' }, { id: '2', name: 'Component 2' }];
      const mockTotal = 20;
      
      mockComponentRepository.findAll.mockResolvedValue(mockComponents);
      mockComponentRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await componentService.findAll(options);
      
      // Assert
      expect(result).toEqual({
        data: mockComponents,
        total: mockTotal,
        page: 2,
        limit: 10,
        totalPages: 2
      });
      
      expect(mockComponentRepository.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          skip: 10,
          limit: 10,
          sort: { name: 1 }
        })
      );
      
      expect(mockComponentRepository.count).toHaveBeenCalled();
    });
    
    it('should handle descending sort order', async () => {
      // Arrange
      const options = { sort: '-name' };
      const mockComponents = [{ id: '1', name: 'Component 1' }];
      const mockTotal = 1;
      
      mockComponentRepository.findAll.mockResolvedValue(mockComponents);
      mockComponentRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await componentService.findAll(options);
      
      // Assert
      expect(mockComponentRepository.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          sort: { name: -1 }
        })
      );
    });
    
    it('should use default values if options are not provided', async () => {
      // Arrange
      const mockComponents = [{ id: '1', name: 'Component 1' }];
      const mockTotal = 1;
      
      mockComponentRepository.findAll.mockResolvedValue(mockComponents);
      mockComponentRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await componentService.findAll({});
      
      // Assert
      expect(mockComponentRepository.findAll).toHaveBeenCalledWith(
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
      const componentData = { partNumber: 'ABC123' };
      
      // Act & Assert
      await expect(componentService.create(componentData)).rejects.toThrow(ValidationError);
      expect(mockComponentRepository.exists).not.toHaveBeenCalled();
      expect(Component.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if partNumber is not provided', async () => {
      // Arrange
      const componentData = { name: 'Test Component' };
      
      // Act & Assert
      await expect(componentService.create(componentData)).rejects.toThrow(ValidationError);
      expect(mockComponentRepository.exists).not.toHaveBeenCalled();
      expect(Component.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if partNumber already exists', async () => {
      // Arrange
      const componentData = { name: 'Test Component', partNumber: 'ABC123' };
      mockComponentRepository.exists.mockResolvedValue(true);
      
      // Act & Assert
      await expect(componentService.create(componentData)).rejects.toThrow(ValidationError);
      expect(mockComponentRepository.exists).toHaveBeenCalledWith({ partNumber: 'ABC123' });
      expect(Component.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if supplier does not exist', async () => {
      // Arrange
      const componentData = { 
        name: 'Test Component', 
        partNumber: 'ABC123',
        supplierId: '456'
      };
      
      mockComponentRepository.exists.mockResolvedValue(false);
      mockSupplierRepository.exists.mockResolvedValue(false);
      
      // Act & Assert
      await expect(componentService.create(componentData)).rejects.toThrow(ValidationError);
      expect(mockComponentRepository.exists).toHaveBeenCalledWith({ partNumber: 'ABC123' });
      expect(mockSupplierRepository.exists).toHaveBeenCalledWith({ _id: '456' });
      expect(Component.create).not.toHaveBeenCalled();
    });
    
    it('should create a component if data is valid', async () => {
      // Arrange
      const componentData = { 
        name: 'Test Component', 
        partNumber: 'ABC123',
        supplierId: '456',
        category: 'electronics'
      };
      
      const mockComponent = {
        id: '789',
        name: 'Test Component',
        partNumber: 'ABC123',
        supplierId: '456',
        category: 'electronics',
        toObject: jest.fn().mockReturnValue({ 
          id: '789', 
          name: 'Test Component',
          partNumber: 'ABC123',
          supplierId: '456',
          category: 'electronics'
        })
      };
      
      mockComponentRepository.exists.mockResolvedValue(false);
      mockSupplierRepository.exists.mockResolvedValue(true);
      Component.create.mockReturnValue(mockComponent);
      mockComponentRepository.save.mockResolvedValue(mockComponent);
      
      // Act
      const result = await componentService.create(componentData);
      
      // Assert
      expect(result).toBe(mockComponent);
      expect(mockComponentRepository.exists).toHaveBeenCalledWith({ partNumber: 'ABC123' });
      expect(mockSupplierRepository.exists).toHaveBeenCalledWith({ _id: '456' });
      expect(Component.create).toHaveBeenCalledWith(componentData);
      expect(mockComponentRepository.save).toHaveBeenCalledWith(mockComponent);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'component.created',
        expect.objectContaining({ component: expect.any(Object) })
      );
    });
    
    it('should create a component without supplier if not provided', async () => {
      // Arrange
      const componentData = { 
        name: 'Test Component', 
        partNumber: 'ABC123',
        category: 'electronics'
      };
      
      const mockComponent = {
        id: '789',
        name: 'Test Component',
        partNumber: 'ABC123',
        category: 'electronics',
        toObject: jest.fn().mockReturnValue({ 
          id: '789', 
          name: 'Test Component',
          partNumber: 'ABC123',
          category: 'electronics'
        })
      };
      
      mockComponentRepository.exists.mockResolvedValue(false);
      Component.create.mockReturnValue(mockComponent);
      mockComponentRepository.save.mockResolvedValue(mockComponent);
      
      // Act
      const result = await componentService.create(componentData);
      
      // Assert
      expect(result).toBe(mockComponent);
      expect(mockComponentRepository.exists).toHaveBeenCalledWith({ partNumber: 'ABC123' });
      expect(mockSupplierRepository.exists).not.toHaveBeenCalled();
      expect(Component.create).toHaveBeenCalledWith(componentData);
      expect(mockComponentRepository.save).toHaveBeenCalledWith(mockComponent);
    });
  });
  
  describe('update', () => {
    it('should throw an error if component is not found', async () => {
      // Arrange
      const id = '123';
      const componentData = { name: 'Updated Component' };
      mockComponentRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(componentService.update(id, componentData)).rejects.toThrow(ValidationError);
      expect(mockComponentRepository.findById).toHaveBeenCalledWith(id);
      expect(mockComponentRepository.save).not.toHaveBeenCalled();
    });
    
    it('should throw an error if partNumber is being changed to an existing partNumber', async () => {
      // Arrange
      const id = '123';
      const componentData = { partNumber: 'NEW123' };
      const mockComponent = {
        id: '123',
        name: 'Test Component',
        partNumber: 'OLD123',
        updateDetails: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Component', partNumber: 'NEW123' })
      };
      
      mockComponentRepository.findById.mockResolvedValue(mockComponent);
      mockComponentRepository.exists.mockResolvedValue(true);
      
      // Act & Assert
      await expect(componentService.update(id, componentData)).rejects.toThrow(ValidationError);
      expect(mockComponentRepository.findById).toHaveBeenCalledWith(id);
      expect(mockComponentRepository.exists).toHaveBeenCalledWith({
        partNumber: 'NEW123',
        _id: { $ne: id }
      });
      expect(mockComponent.updateDetails).not.toHaveBeenCalled();
      expect(mockComponentRepository.save).not.toHaveBeenCalled();
    });
    
    it('should throw an error if supplier does not exist', async () => {
      // Arrange
      const id = '123';
      const componentData = { supplierId: '456' };
      const mockComponent = {
        id: '123',
        name: 'Test Component',
        partNumber: 'ABC123',
        updateDetails: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Component', partNumber: 'ABC123' })
      };
      
      mockComponentRepository.findById.mockResolvedValue(mockComponent);
      mockSupplierRepository.exists.mockResolvedValue(false);
      
      // Act & Assert
      await expect(componentService.update(id, componentData)).rejects.toThrow(ValidationError);
      expect(mockComponentRepository.findById).toHaveBeenCalledWith(id);
      expect(mockSupplierRepository.exists).toHaveBeenCalledWith({ _id: '456' });
      expect(mockComponent.updateDetails).not.toHaveBeenCalled();
      expect(mockComponentRepository.save).not.toHaveBeenCalled();
    });
    
    it('should update component details if data is valid', async () => {
      // Arrange
      const id = '123';
      const componentData = { name: 'Updated Component', description: 'Updated description' };
      const mockComponent = {
        id: '123',
        name: 'Test Component',
        partNumber: 'ABC123',
        updateDetails: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        discontinue: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Updated Component', partNumber: 'ABC123' })
      };
      
      mockComponentRepository.findById.mockResolvedValue(mockComponent);
      mockComponentRepository.save.mockResolvedValue(mockComponent);
      
      // Act
      const result = await componentService.update(id, componentData);
      
      // Assert
      expect(result).toBe(mockComponent);
      expect(mockComponentRepository.findById).toHaveBeenCalledWith(id);
      expect(mockComponent.updateDetails).toHaveBeenCalledWith(componentData);
      expect(mockComponentRepository.save).toHaveBeenCalledWith(mockComponent);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'component.updated',
        expect.objectContaining({
          component: expect.any(Object),
          updatedFields: expect.arrayContaining(['name', 'description'])
        })
      );
    });
    
    it('should update component status if status is provided', async () => {
      // Arrange
      const id = '123';
      const componentData = { status: 'approved' };
      const mockComponent = {
        id: '123',
        name: 'Test Component',
        partNumber: 'ABC123',
        updateDetails: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        discontinue: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Component', partNumber: 'ABC123' })
      };
      
      mockComponentRepository.findById.mockResolvedValue(mockComponent);
      mockComponentRepository.save.mockResolvedValue(mockComponent);
      
      // Act
      const result = await componentService.update(id, componentData);
      
      // Assert
      expect(mockComponent.approve).toHaveBeenCalled();
      expect(mockComponent.reject).not.toHaveBeenCalled();
      expect(mockComponent.discontinue).not.toHaveBeenCalled();
    });
    
    it('should reject component if status is rejected', async () => {
      // Arrange
      const id = '123';
      const componentData = { status: 'rejected' };
      const mockComponent = {
        id: '123',
        name: 'Test Component',
        partNumber: 'ABC123',
        updateDetails: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        discontinue: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Component', partNumber: 'ABC123' })
      };
      
      mockComponentRepository.findById.mockResolvedValue(mockComponent);
      mockComponentRepository.save.mockResolvedValue(mockComponent);
      
      // Act
      const result = await componentService.update(id, componentData);
      
      // Assert
      expect(mockComponent.approve).not.toHaveBeenCalled();
      expect(mockComponent.reject).toHaveBeenCalled();
      expect(mockComponent.discontinue).not.toHaveBeenCalled();
    });
    
    it('should discontinue component if status is discontinued', async () => {
      // Arrange
      const id = '123';
      const componentData = { status: 'discontinued' };
      const mockComponent = {
        id: '123',
        name: 'Test Component',
        partNumber: 'ABC123',
        updateDetails: jest.fn(),
        approve: jest.fn(),
        reject: jest.fn(),
        discontinue: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Component', partNumber: 'ABC123' })
      };
      
      mockComponentRepository.findById.mockResolvedValue(mockComponent);
      mockComponentRepository.save.mockResolvedValue(mockComponent);
      
      // Act
      const result = await componentService.update(id, componentData);
      
      // Assert
      expect(mockComponent.approve).not.toHaveBeenCalled();
      expect(mockComponent.reject).not.toHaveBeenCalled();
      expect(mockComponent.discontinue).toHaveBeenCalled();
    });
  });
  
  describe('delete', () => {
    it('should throw an error if component is not found', async () => {
      // Arrange
      const id = '123';
      mockComponentRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(componentService.delete(id)).rejects.toThrow(ValidationError);
      expect(mockComponentRepository.findById).toHaveBeenCalledWith(id);
      expect(mockComponentRepository.delete).not.toHaveBeenCalled();
    });
    
    it('should delete the component if found', async () => {
      // Arrange
      const id = '123';
      const mockComponent = { id: '123', name: 'Test Component' };
      mockComponentRepository.findById.mockResolvedValue(mockComponent);
      mockComponentRepository.delete.mockResolvedValue(true);
      
      // Act
      const result = await componentService.delete(id);
      
      // Assert
      expect(result).toBe(true);
      expect(mockComponentRepository.findById).toHaveBeenCalledWith(id);
      expect(mockComponentRepository.delete).toHaveBeenCalledWith(id);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'component.deleted',
        expect.objectContaining({ componentId: id })
      );
    });
    
    it('should not emit event if delete fails', async () => {
      // Arrange
      const id = '123';
      const mockComponent = { id: '123', name: 'Test Component' };
      mockComponentRepository.findById.mockResolvedValue(mockComponent);
      mockComponentRepository.delete.mockResolvedValue(false);
      
      // Act
      const result = await componentService.delete(id);
      
      // Assert
      expect(result).toBe(false);
      expect(mockComponentRepository.findById).toHaveBeenCalledWith(id);
      expect(mockComponentRepository.delete).toHaveBeenCalledWith(id);
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
  
  // Tests for search functionality
  describe('search', () => {
    it('should search components by query', async () => {
      // Arrange
      const query = 'test';
      const options = { page: 1, limit: 10 };
      const mockComponents = [{ id: '1', name: 'Test 1' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      componentService.findAll = jest.fn().mockResolvedValue({
        data: mockComponents,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await componentService.search(query, options);
      
      // Assert
      expect(result).toEqual({
        data: mockComponents,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(componentService.findAll).toHaveBeenCalledWith({
        filter: {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { partNumber: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
          ]
        },
        page: 1,
        limit: 10
      });
    });
  });
  
  // Tests for getByCategory
  describe('getByCategory', () => {
    it('should get components by category', async () => {
      // Arrange
      const category = 'electronics';
      const options = { page: 1, limit: 10, sort: 'name' };
      const mockComponents = [{ id: '1', name: 'Test 1', category: 'electronics' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      componentService.findAll = jest.fn().mockResolvedValue({
        data: mockComponents,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await componentService.getByCategory(category, options);
      
      // Assert
      expect(result).toEqual({
        data: mockComponents,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(componentService.findAll).toHaveBeenCalledWith({
        filter: { category },
        page: 1,
        limit: 10,
        sort: 'name'
      });
    });
  });
  
  // Tests for getBySupplier
  describe('getBySupplier', () => {
    it('should get components by supplier', async () => {
      // Arrange
      const supplierId = '456';
      const options = { page: 1, limit: 10, sort: 'name' };
      const mockComponents = [{ id: '1', name: 'Test 1', supplierId: '456' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      componentService.findAll = jest.fn().mockResolvedValue({
        data: mockComponents,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await componentService.getBySupplier(supplierId, options);
      
      // Assert
      expect(result).toEqual({
        data: mockComponents,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(componentService.findAll).toHaveBeenCalledWith({
        filter: { supplierId },
        page: 1,
        limit: 10,
        sort: 'name'
      });
    });
  });
  
  // Tests for getByStatus
  describe('getByStatus', () => {
    it('should get components by status', async () => {
      // Arrange
      const status = 'approved';
      const options = { page: 1, limit: 10, sort: 'name' };
      const mockComponents = [{ id: '1', name: 'Test 1', status: 'approved' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      componentService.findAll = jest.fn().mockResolvedValue({
        data: mockComponents,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await componentService.getByStatus(status, options);
      
      // Assert
      expect(result).toEqual({
        data: mockComponents,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(componentService.findAll).toHaveBeenCalledWith({
        filter: { status },
        page: 1,
        limit: 10,
        sort: 'name'
      });
    });
  });
});
