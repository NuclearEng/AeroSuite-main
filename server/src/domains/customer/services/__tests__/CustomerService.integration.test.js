const CustomerService = require('../CustomerService');

describe('CustomerService Integration', () => {
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

  test('end-to-end: create, find, update, delete customer', async () => {
    // Create
    const customer = { name: 'Integration Customer' };
    mockRepo.save.mockResolvedValueOnce({ id: 'int1', ...customer });
    const created = await service.createCustomer(customer);
    expect(created).toHaveProperty('id', 'int1');

    // Find
    mockRepo.findById.mockResolvedValueOnce(created);
    const found = await service.getCustomer('int1');
    expect(found).toEqual(created);

    // Update
    const updatedCustomer = { ...created, name: 'Updated Integration Customer' };
    mockRepo.save.mockResolvedValueOnce(updatedCustomer);
    const updated = await service.updateCustomer(updatedCustomer);
    expect(updated.name).toBe('Updated Integration Customer');

    // Delete
    mockRepo.delete.mockResolvedValueOnce(true);
    const deleted = await service.deleteCustomer('int1');
    expect(deleted).toBe(true);
  });

  // Add more integration scenarios as needed (e.g., error propagation, business rule enforcement)
}); 