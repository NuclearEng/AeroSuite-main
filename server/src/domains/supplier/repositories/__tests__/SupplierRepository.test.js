const SupplierRepository = require('../supplierRepository');

describe('SupplierRepository', () => {
  let repo;
  let mockDb;

  beforeEach(() => {
    // Mock DB/ORM
    mockDb = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
    };
    repo = new SupplierRepository(mockDb);
  });

  test('findById returns supplier for valid ID', async () => {
    mockDb.findOne.mockResolvedValue({ id: '123', name: 'Test Supplier' });
    const result = await repo.findById('123');
    expect(result).toEqual({ id: '123', name: 'Test Supplier' });
    expect(mockDb.findOne).toHaveBeenCalledWith({ id: '123' });
  });

  test('findById returns null for missing supplier', async () => {
    mockDb.findOne.mockResolvedValue(null);
    const result = await repo.findById('notfound');
    expect(result).toBeNull();
  });

  test('create inserts a new supplier', async () => {
    mockDb.insertOne.mockResolvedValue({ insertedId: 'abc' });
    const supplier = { name: 'New Supplier' };
    const result = await repo.create(supplier);
    expect(result).toHaveProperty('id');
    expect(mockDb.insertOne).toHaveBeenCalledWith(supplier);
  });

  test('update updates supplier fields', async () => {
    mockDb.updateOne.mockResolvedValue({ modifiedCount: 1 });
    const result = await repo.update('123', { name: 'Updated' });
    expect(result).toBe(true);
    expect(mockDb.updateOne).toHaveBeenCalledWith({ id: '123' }, { $set: { name: 'Updated' } });
  });

  test('delete removes supplier', async () => {
    mockDb.deleteOne.mockResolvedValue({ deletedCount: 1 });
    const result = await repo.delete('123');
    expect(result).toBe(true);
    expect(mockDb.deleteOne).toHaveBeenCalledWith({ id: '123' });
  });

  test('findAll returns array of suppliers', async () => {
    mockDb.find.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const result = await repo.findAll();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  // Add more edge case and error handling tests as needed
}); 