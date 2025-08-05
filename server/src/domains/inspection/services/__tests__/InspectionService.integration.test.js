const InspectionService = require('../InspectionService');

describe('InspectionService Integration', () => {
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

  test('end-to-end: create, find, update, delete inspection', async () => {
    // Create
    const inspection = { name: 'Integration Inspection' };
    mockRepo.save.mockResolvedValueOnce({ id: 'int1', ...inspection });
    const created = await service.createInspection(inspection);
    expect(created).toHaveProperty('id', 'int1');

    // Find
    mockRepo.findById.mockResolvedValueOnce(created);
    const found = await service.getInspection('int1');
    expect(found).toEqual(created);

    // Update
    const updatedInspection = { ...created, name: 'Updated Integration Inspection' };
    mockRepo.save.mockResolvedValueOnce(updatedInspection);
    const updated = await service.updateInspection(updatedInspection);
    expect(updated.name).toBe('Updated Integration Inspection');

    // Delete
    mockRepo.delete.mockResolvedValueOnce(true);
    const deleted = await service.deleteInspection('int1');
    expect(deleted).toBe(true);
  });

  // Add more integration scenarios as needed (e.g., error propagation, business rule enforcement)
}); 