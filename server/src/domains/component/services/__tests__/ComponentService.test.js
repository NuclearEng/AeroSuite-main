const ComponentService = require('../ComponentService');

describe('ComponentService', () => {
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

  test('getComponent returns component for valid ID', async () => {
    mockRepo.findById.mockResolvedValue({ id: '123', name: 'Test Component' });
    const result = await service.getComponent('123');
    expect(result).toEqual({ id: '123', name: 'Test Component' });
    expect(mockRepo.findById).toHaveBeenCalledWith('123');
  });

  test('getComponent throws for missing component', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.getComponent('notfound')).rejects.toThrow();
  });

  test('createComponent saves and returns new component', async () => {
    const component = { name: 'New Component' };
    mockRepo.save.mockResolvedValue({ id: 'abc', ...component });
    const result = await service.createComponent(component);
    expect(result).toHaveProperty('id');
    expect(mockRepo.save).toHaveBeenCalledWith(component);
  });

  test('updateComponent updates and returns component', async () => {
    const component = { id: '123', name: 'Updated' };
    mockRepo.save.mockResolvedValue(component);
    const result = await service.updateComponent(component);
    expect(result).toEqual(component);
    expect(mockRepo.save).toHaveBeenCalledWith(component);
  });

  test('deleteComponent deletes component', async () => {
    mockRepo.delete.mockResolvedValue(true);
    const result = await service.deleteComponent('123');
    expect(result).toBe(true);
    expect(mockRepo.delete).toHaveBeenCalledWith('123');
  });

  test('findComponents returns array', async () => {
    mockRepo.findAll.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const result = await service.findComponents();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  // Add more business logic, edge case, and error handling tests as needed
}); 