const CustomerService = require('../CustomerService');

describe('CustomerService', () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByName: jest.fn(),
    };
    service = new CustomerService(mockRepo);
  });

  test('getCustomer returns customer for valid ID', async () => {
    mockRepo.findById.mockResolvedValue({ id: '123', name: 'Test Customer' });
    const result = await service.getCustomer('123');
    expect(result).toEqual({ id: '123', name: 'Test Customer' });
    expect(mockRepo.findById).toHaveBeenCalledWith('123');
  });

  test('getCustomer throws for missing customer', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.getCustomer('notfound')).rejects.toThrow();
  });

  test('createCustomer saves and returns new customer', async () => {
    const customer = { name: 'New Customer' };
    mockRepo.save.mockResolvedValue({ id: 'abc', ...customer });
    const result = await service.createCustomer(customer);
    expect(result).toHaveProperty('id');
    expect(mockRepo.save).toHaveBeenCalledWith(customer);
  });

  test('updateCustomer updates and returns customer', async () => {
    const customer = { id: '123', name: 'Updated' };
    mockRepo.save.mockResolvedValue(customer);
    const result = await service.updateCustomer(customer);
    expect(result).toEqual(customer);
    expect(mockRepo.save).toHaveBeenCalledWith(customer);
  });

  test('deleteCustomer deletes customer', async () => {
    mockRepo.delete.mockResolvedValue(true);
    const result = await service.deleteCustomer('123');
    expect(result).toBe(true);
    expect(mockRepo.delete).toHaveBeenCalledWith('123');
  });

  test('findCustomers returns array', async () => {
    mockRepo.findAll.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const result = await service.findCustomers();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  // Add more business logic, edge case, and error handling tests as needed
}); 