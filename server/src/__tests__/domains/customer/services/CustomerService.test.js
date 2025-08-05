/**
 * CustomerService.test.js
 * 
 * Unit tests for the customer service
 * Implements RF023 - Add comprehensive unit tests for services
 */

const CustomerService = require('../../../../domains/customer/services/CustomerService');
const CustomerServiceInterface = require('../../../../domains/customer/interfaces/CustomerServiceInterface');
const Customer = require('../../../../domains/customer/models/Customer');
const { DomainError, ValidationError } = require('../../../../core/errors');

// Mock the repositories and dependencies
jest.mock('../../../../domains/customer/repositories/CustomerRepository', () => ({
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

// Mock the Customer model
jest.mock('../../../../domains/customer/models/Customer', () => ({
  create: jest.fn(),
}));

describe('CustomerService', () => {
  let customerService;
  let mockCustomerRepository;
  let mockEventEmitter;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Get the mocked repository
    mockCustomerRepository = require('../../../../domains/customer/repositories/CustomerRepository');
    
    // Get the mocked event emitter
    mockEventEmitter = require('../../../../core/EventEmitter').getInstance();
    
    // Get the service instance
    customerService = CustomerService;
  });
  
  describe('Service Interface', () => {
    it('should register with the customer service interface', () => {
      // The service should be registered with the interface
      const customerServiceInterface = CustomerServiceInterface.getInstance();
      expect(customerServiceInterface.getImplementation()).toBe(customerService);
    });
    
    it('should implement all required methods of the interface', () => {
      // Get the interface
      const customerServiceInterface = CustomerServiceInterface.getInstance();
      
      // Check if the implementation is valid
      expect(customerServiceInterface.isValidImplementation(customerService)).toBe(true);
    });
  });
  
  describe('findById', () => {
    it('should throw an error if id is not provided', async () => {
      // Arrange
      const id = null;
      
      // Act & Assert
      await expect(customerService.findById(id)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.findById).not.toHaveBeenCalled();
    });
    
    it('should return the customer if found', async () => {
      // Arrange
      const id = '123';
      const mockCustomer = { id: '123', name: 'Test Customer' };
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      
      // Act
      const result = await customerService.findById(id);
      
      // Assert
      expect(result).toBe(mockCustomer);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(id);
    });
    
    it('should return null if customer is not found', async () => {
      // Arrange
      const id = '123';
      mockCustomerRepository.findById.mockResolvedValue(null);
      
      // Act
      const result = await customerService.findById(id);
      
      // Assert
      expect(result).toBeNull();
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(id);
    });
  });
  
  describe('findAll', () => {
    it('should return customers and total count', async () => {
      // Arrange
      const options = { filter: { name: 'Test' }, page: 2, limit: 10, sort: 'name' };
      const mockCustomers = [{ id: '1', name: 'Test 1' }, { id: '2', name: 'Test 2' }];
      const mockTotal = 20;
      
      mockCustomerRepository.findAll.mockResolvedValue(mockCustomers);
      mockCustomerRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await customerService.findAll(options);
      
      // Assert
      expect(result).toEqual({
        data: mockCustomers,
        total: mockTotal,
        page: 2,
        limit: 10,
        totalPages: 2
      });
      
      expect(mockCustomerRepository.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          skip: 10,
          limit: 10,
          sort: { name: 1 }
        })
      );
      
      expect(mockCustomerRepository.count).toHaveBeenCalled();
    });
    
    it('should handle descending sort order', async () => {
      // Arrange
      const options = { sort: '-name' };
      const mockCustomers = [{ id: '1', name: 'Test 1' }];
      const mockTotal = 1;
      
      mockCustomerRepository.findAll.mockResolvedValue(mockCustomers);
      mockCustomerRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await customerService.findAll(options);
      
      // Assert
      expect(mockCustomerRepository.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          sort: { name: -1 }
        })
      );
    });
    
    it('should use default values if options are not provided', async () => {
      // Arrange
      const mockCustomers = [{ id: '1', name: 'Test 1' }];
      const mockTotal = 1;
      
      mockCustomerRepository.findAll.mockResolvedValue(mockCustomers);
      mockCustomerRepository.count.mockResolvedValue(mockTotal);
      
      // Act
      const result = await customerService.findAll({});
      
      // Assert
      expect(mockCustomerRepository.findAll).toHaveBeenCalledWith(
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
      const customerData = { email: 'test@example.com' };
      
      // Act & Assert
      await expect(customerService.create(customerData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.exists).not.toHaveBeenCalled();
      expect(Customer.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if email is not provided', async () => {
      // Arrange
      const customerData = { name: 'Test Customer' };
      
      // Act & Assert
      await expect(customerService.create(customerData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.exists).not.toHaveBeenCalled();
      expect(Customer.create).not.toHaveBeenCalled();
    });
    
    it('should throw an error if email already exists', async () => {
      // Arrange
      const customerData = { name: 'Test Customer', email: 'test@example.com' };
      mockCustomerRepository.exists.mockResolvedValue(true);
      
      // Act & Assert
      await expect(customerService.create(customerData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.exists).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(Customer.create).not.toHaveBeenCalled();
    });
    
    it('should create a customer if data is valid', async () => {
      // Arrange
      const customerData = { name: 'Test Customer', email: 'test@example.com' };
      const mockCustomer = {
        id: '456',
        name: 'Test Customer',
        email: 'test@example.com',
        toObject: jest.fn().mockReturnValue({ id: '456', name: 'Test Customer', email: 'test@example.com' })
      };
      
      mockCustomerRepository.exists.mockResolvedValue(false);
      Customer.create.mockReturnValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue(mockCustomer);
      
      // Act
      const result = await customerService.create(customerData);
      
      // Assert
      expect(result).toBe(mockCustomer);
      expect(mockCustomerRepository.exists).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(Customer.create).toHaveBeenCalledWith(customerData);
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(mockCustomer);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'customer.created',
        expect.objectContaining({ customer: expect.any(Object) })
      );
    });
  });
  
  describe('update', () => {
    it('should throw an error if customer is not found', async () => {
      // Arrange
      const id = '123';
      const customerData = { name: 'Updated Customer' };
      mockCustomerRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(customerService.update(id, customerData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(id);
      expect(mockCustomerRepository.save).not.toHaveBeenCalled();
    });
    
    it('should throw an error if email is being changed to an existing email', async () => {
      // Arrange
      const id = '123';
      const customerData = { email: 'new@example.com' };
      const mockCustomer = {
        id: '123',
        name: 'Test Customer',
        email: 'old@example.com',
        updateDetails: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Customer', email: 'new@example.com' })
      };
      
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.exists.mockResolvedValue(true);
      
      // Act & Assert
      await expect(customerService.update(id, customerData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(id);
      expect(mockCustomerRepository.exists).toHaveBeenCalledWith({
        email: 'new@example.com',
        _id: { $ne: id }
      });
      expect(mockCustomer.updateDetails).not.toHaveBeenCalled();
      expect(mockCustomerRepository.save).not.toHaveBeenCalled();
    });
    
    it('should update customer details if data is valid', async () => {
      // Arrange
      const id = '123';
      const customerData = { name: 'Updated Customer', phone: '123-456-7890' };
      const mockCustomer = {
        id: '123',
        name: 'Test Customer',
        email: 'test@example.com',
        updateDetails: jest.fn(),
        updateAddress: jest.fn(),
        activate: jest.fn(),
        deactivate: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Updated Customer', email: 'test@example.com' })
      };
      
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue(mockCustomer);
      
      // Act
      const result = await customerService.update(id, customerData);
      
      // Assert
      expect(result).toBe(mockCustomer);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(id);
      expect(mockCustomer.updateDetails).toHaveBeenCalledWith(customerData);
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(mockCustomer);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'customer.updated',
        expect.objectContaining({
          customer: expect.any(Object),
          updatedFields: expect.arrayContaining(['name', 'phone'])
        })
      );
    });
    
    it('should update customer address if address is provided', async () => {
      // Arrange
      const id = '123';
      const customerData = {
        address: {
          street: '123 Main St',
          city: 'Test City',
          country: 'Test Country'
        }
      };
      const mockCustomer = {
        id: '123',
        name: 'Test Customer',
        email: 'test@example.com',
        updateDetails: jest.fn(),
        updateAddress: jest.fn(),
        activate: jest.fn(),
        deactivate: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Customer', email: 'test@example.com' })
      };
      
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue(mockCustomer);
      
      // Act
      const result = await customerService.update(id, customerData);
      
      // Assert
      expect(mockCustomer.updateAddress).toHaveBeenCalledWith(customerData.address);
    });
    
    it('should update customer status if status is provided', async () => {
      // Arrange
      const id = '123';
      const customerData = { status: 'active' };
      const mockCustomer = {
        id: '123',
        name: 'Test Customer',
        email: 'test@example.com',
        updateDetails: jest.fn(),
        updateAddress: jest.fn(),
        activate: jest.fn(),
        deactivate: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Customer', email: 'test@example.com' })
      };
      
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue(mockCustomer);
      
      // Act
      const result = await customerService.update(id, customerData);
      
      // Assert
      expect(mockCustomer.activate).toHaveBeenCalled();
      expect(mockCustomer.deactivate).not.toHaveBeenCalled();
    });
    
    it('should deactivate customer if status is inactive', async () => {
      // Arrange
      const id = '123';
      const customerData = { status: 'inactive' };
      const mockCustomer = {
        id: '123',
        name: 'Test Customer',
        email: 'test@example.com',
        updateDetails: jest.fn(),
        updateAddress: jest.fn(),
        activate: jest.fn(),
        deactivate: jest.fn(),
        toObject: jest.fn().mockReturnValue({ id: '123', name: 'Test Customer', email: 'test@example.com' })
      };
      
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue(mockCustomer);
      
      // Act
      const result = await customerService.update(id, customerData);
      
      // Assert
      expect(mockCustomer.activate).not.toHaveBeenCalled();
      expect(mockCustomer.deactivate).toHaveBeenCalled();
    });
  });
  
  describe('delete', () => {
    it('should throw an error if customer is not found', async () => {
      // Arrange
      const id = '123';
      mockCustomerRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(customerService.delete(id)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(id);
      expect(mockCustomerRepository.delete).not.toHaveBeenCalled();
    });
    
    it('should delete the customer if found', async () => {
      // Arrange
      const id = '123';
      const mockCustomer = { id: '123', name: 'Test Customer' };
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.delete.mockResolvedValue(true);
      
      // Act
      const result = await customerService.delete(id);
      
      // Assert
      expect(result).toBe(true);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(id);
      expect(mockCustomerRepository.delete).toHaveBeenCalledWith(id);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'customer.deleted',
        expect.objectContaining({ customerId: id })
      );
    });
    
    it('should not emit event if delete fails', async () => {
      // Arrange
      const id = '123';
      const mockCustomer = { id: '123', name: 'Test Customer' };
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      mockCustomerRepository.delete.mockResolvedValue(false);
      
      // Act
      const result = await customerService.delete(id);
      
      // Assert
      expect(result).toBe(false);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(id);
      expect(mockCustomerRepository.delete).toHaveBeenCalledWith(id);
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });
  
  // Additional tests for contact management
  describe('addContact', () => {
    it('should throw an error if customer is not found', async () => {
      // Arrange
      const customerId = '123';
      const contactData = { name: 'John Doe', email: 'john@example.com' };
      mockCustomerRepository.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(customerService.addContact(customerId, contactData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(customerId);
      expect(mockCustomerRepository.save).not.toHaveBeenCalled();
    });
    
    it('should throw an error if contact name is not provided', async () => {
      // Arrange
      const customerId = '123';
      const contactData = { email: 'john@example.com' };
      const mockCustomer = {
        id: '123',
        name: 'Test Customer',
        addContact: jest.fn()
      };
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      
      // Act & Assert
      await expect(customerService.addContact(customerId, contactData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(customerId);
      expect(mockCustomer.addContact).not.toHaveBeenCalled();
      expect(mockCustomerRepository.save).not.toHaveBeenCalled();
    });
    
    it('should throw an error if neither email nor phone is provided', async () => {
      // Arrange
      const customerId = '123';
      const contactData = { name: 'John Doe' };
      const mockCustomer = {
        id: '123',
        name: 'Test Customer',
        addContact: jest.fn()
      };
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      
      // Act & Assert
      await expect(customerService.addContact(customerId, contactData)).rejects.toThrow(ValidationError);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(customerId);
      expect(mockCustomer.addContact).not.toHaveBeenCalled();
      expect(mockCustomerRepository.save).not.toHaveBeenCalled();
    });
    
    it('should add contact if data is valid', async () => {
      // Arrange
      const customerId = '123';
      const contactData = { name: 'John Doe', email: 'john@example.com', phone: '123456789' };
      const mockContact = { id: 'c1', name: 'John Doe', email: 'john@example.com', phone: '123456789' };
      const mockCustomer = {
        id: '123',
        name: 'Test Customer',
        addContact: jest.fn().mockReturnValue(mockContact)
      };
      mockCustomerRepository.findById.mockResolvedValue(mockCustomer);
      
      // Act
      const result = await customerService.addContact(customerId, contactData);
      
      // Assert
      expect(result).toBe(mockContact);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith(customerId);
      expect(mockCustomer.addContact).toHaveBeenCalledWith(contactData);
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(mockCustomer);
    });
  });
  
  // Tests for search functionality
  describe('search', () => {
    it('should search customers by query', async () => {
      // Arrange
      const query = 'test';
      const options = { page: 1, limit: 10 };
      const mockCustomers = [{ id: '1', name: 'Test 1' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      customerService.findAll = jest.fn().mockResolvedValue({
        data: mockCustomers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await customerService.search(query, options);
      
      // Assert
      expect(result).toEqual({
        data: mockCustomers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(customerService.findAll).toHaveBeenCalledWith({
        filter: {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { phone: { $regex: query, $options: 'i' } }
          ]
        },
        page: 1,
        limit: 10
      });
    });
    
    it('should use default options if not provided', async () => {
      // Arrange
      const query = 'test';
      const mockCustomers = [{ id: '1', name: 'Test 1' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      customerService.findAll = jest.fn().mockResolvedValue({
        data: mockCustomers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await customerService.search(query);
      
      // Assert
      expect(customerService.findAll).toHaveBeenCalledWith({
        filter: expect.any(Object),
        page: 1,
        limit: 10
      });
    });
  });
  
  // Tests for getByIndustry
  describe('getByIndustry', () => {
    it('should get customers by industry', async () => {
      // Arrange
      const industry = 'manufacturing';
      const options = { page: 1, limit: 10, sort: 'name' };
      const mockCustomers = [{ id: '1', name: 'Test 1', industry: 'manufacturing' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      customerService.findAll = jest.fn().mockResolvedValue({
        data: mockCustomers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await customerService.getByIndustry(industry, options);
      
      // Assert
      expect(result).toEqual({
        data: mockCustomers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(customerService.findAll).toHaveBeenCalledWith({
        filter: { industry },
        page: 1,
        limit: 10,
        sort: 'name'
      });
    });
  });
  
  // Tests for getByType
  describe('getByType', () => {
    it('should get customers by type', async () => {
      // Arrange
      const type = 'enterprise';
      const options = { page: 1, limit: 10, sort: 'name' };
      const mockCustomers = [{ id: '1', name: 'Test 1', type: 'enterprise' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      customerService.findAll = jest.fn().mockResolvedValue({
        data: mockCustomers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await customerService.getByType(type, options);
      
      // Assert
      expect(result).toEqual({
        data: mockCustomers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(customerService.findAll).toHaveBeenCalledWith({
        filter: { type },
        page: 1,
        limit: 10,
        sort: 'name'
      });
    });
  });
  
  // Tests for getByStatus
  describe('getByStatus', () => {
    it('should get customers by status', async () => {
      // Arrange
      const status = 'active';
      const options = { page: 1, limit: 10, sort: 'name' };
      const mockCustomers = [{ id: '1', name: 'Test 1', status: 'active' }];
      const mockTotal = 1;
      
      // Mock the findAll method to return the expected result
      customerService.findAll = jest.fn().mockResolvedValue({
        data: mockCustomers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      // Act
      const result = await customerService.getByStatus(status, options);
      
      // Assert
      expect(result).toEqual({
        data: mockCustomers,
        total: mockTotal,
        page: 1,
        limit: 10,
        totalPages: 1
      });
      
      expect(customerService.findAll).toHaveBeenCalledWith({
        filter: { status },
        page: 1,
        limit: 10,
        sort: 'name'
      });
    });
  });
}); 