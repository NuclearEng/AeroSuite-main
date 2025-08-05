const ComponentService = require('../ComponentService');

describe('ComponentService Integration', () => {
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
    service = new ComponentService(mockRepo);
  });

  test('end-to-end: create, find, update, delete component', async () => {
    // Create
    const component = { name: 'Integration Component' };
    mockRepo.save.mockResolvedValueOnce({ id: 'int1', ...component });
    const created = await service.createComponent(component);
    expect(created).toHaveProperty('id', 'int1');

    // Find
    mockRepo.findById.mockResolvedValueOnce(created);
    const found = await service.getComponent('int1');
    expect(found).toEqual(created);

    // Update
    const updatedComponent = { ...created, name: 'Updated Integration Component' };
    mockRepo.save.mockResolvedValueOnce(updatedComponent);
    const updated = await service.updateComponent(updatedComponent);
    expect(updated.name).toBe('Updated Integration Component');

    // Delete
    mockRepo.delete.mockResolvedValueOnce(true);
    const deleted = await service.deleteComponent('int1');
    expect(deleted).toBe(true);
  });

  // Add more integration scenarios as needed (e.g., error propagation, business rule enforcement)
}); 