const SupplierService = require('../SupplierService');

describe('SupplierService Integration', () => {
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

  test('end-to-end: create, find, update, delete supplier', async () => {
    // Create
    const supplier = { name: 'Integration Supplier' };
    mockRepo.save.mockResolvedValueOnce({ id: 'int1', ...supplier });
    const created = await service.createSupplier(supplier);
    expect(created).toHaveProperty('id', 'int1');

    // Find
    mockRepo.findById.mockResolvedValueOnce(created);
    const found = await service.getSupplier('int1');
    expect(found).toEqual(created);

    // Update
    const updatedSupplier = { ...created, name: 'Updated Integration Supplier' };
    mockRepo.save.mockResolvedValueOnce(updatedSupplier);
    const updated = await service.updateSupplier(updatedSupplier);
    expect(updated.name).toBe('Updated Integration Supplier');

    // Delete
    mockRepo.delete.mockResolvedValueOnce(true);
    const deleted = await service.deleteSupplier('int1');
    expect(deleted).toBe(true);
  });

  // Add more integration scenarios as needed (e.g., error propagation, business rule enforcement)
}); 