const SupplierService = require('../SupplierService');

describe('SupplierService', () => {
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
    service = new SupplierService(mockRepo);
  });

  test('getSupplier returns supplier for valid ID', async () => {
    mockRepo.findById.mockResolvedValue({ id: '123', name: 'Test Supplier' });
    const result = await service.getSupplier('123');
    expect(result).toEqual({ id: '123', name: 'Test Supplier' });
    expect(mockRepo.findById).toHaveBeenCalledWith('123');
  });

  test('getSupplier throws for missing supplier', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.getSupplier('notfound')).rejects.toThrow();
  });

  test('createSupplier saves and returns new supplier', async () => {
    const supplier = { name: 'New Supplier' };
    mockRepo.save.mockResolvedValue({ id: 'abc', ...supplier });
    const result = await service.createSupplier(supplier);
    expect(result).toHaveProperty('id');
    expect(mockRepo.save).toHaveBeenCalledWith(supplier);
  });

  test('updateSupplier updates and returns supplier', async () => {
    const supplier = { id: '123', name: 'Updated' };
    mockRepo.save.mockResolvedValue(supplier);
    const result = await service.updateSupplier(supplier);
    expect(result).toEqual(supplier);
    expect(mockRepo.save).toHaveBeenCalledWith(supplier);
  });

  test('deleteSupplier deletes supplier', async () => {
    mockRepo.delete.mockResolvedValue(true);
    const result = await service.deleteSupplier('123');
    expect(result).toBe(true);
    expect(mockRepo.delete).toHaveBeenCalledWith('123');
  });

  test('findSuppliers returns array', async () => {
    mockRepo.findAll.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const result = await service.findSuppliers();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  // Add more business logic, edge case, and error handling tests as needed
}); 