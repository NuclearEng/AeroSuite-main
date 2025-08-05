const InspectionService = require('../InspectionService');

describe('InspectionService', () => {
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
    service = new InspectionService(mockRepo);
  });

  test('getInspection returns inspection for valid ID', async () => {
    mockRepo.findById.mockResolvedValue({ id: '123', name: 'Test Inspection' });
    const result = await service.getInspection('123');
    expect(result).toEqual({ id: '123', name: 'Test Inspection' });
    expect(mockRepo.findById).toHaveBeenCalledWith('123');
  });

  test('getInspection throws for missing inspection', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.getInspection('notfound')).rejects.toThrow();
  });

  test('createInspection saves and returns new inspection', async () => {
    const inspection = { name: 'New Inspection' };
    mockRepo.save.mockResolvedValue({ id: 'abc', ...inspection });
    const result = await service.createInspection(inspection);
    expect(result).toHaveProperty('id');
    expect(mockRepo.save).toHaveBeenCalledWith(inspection);
  });

  test('updateInspection updates and returns inspection', async () => {
    const inspection = { id: '123', name: 'Updated' };
    mockRepo.save.mockResolvedValue(inspection);
    const result = await service.updateInspection(inspection);
    expect(result).toEqual(inspection);
    expect(mockRepo.save).toHaveBeenCalledWith(inspection);
  });

  test('deleteInspection deletes inspection', async () => {
    mockRepo.delete.mockResolvedValue(true);
    const result = await service.deleteInspection('123');
    expect(result).toBe(true);
    expect(mockRepo.delete).toHaveBeenCalledWith('123');
  });

  test('findInspections returns array', async () => {
    mockRepo.findAll.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const result = await service.findInspections();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
  });

  // Add more business logic, edge case, and error handling tests as needed
}); 