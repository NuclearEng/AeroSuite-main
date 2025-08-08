jest.mock('../utils/cursorApi', () => ({
  runCursorCommand: jest.fn(async () => ({ success: true, output: 'Client Jest tests passed' }))
}));
jest.mock('./memoryAgent', () => ({
  saveMemory: jest.fn(async () => undefined),
  loadMemory: jest.fn(async () => null)
}));

import { runClientUnitAgent } from './clientUnitAgent';
import { runCursorCommand } from '../utils/cursorApi';

describe('clientUnitAgent', () => {
  it('runs client unit tests and reports success', async () => {
    const result = await runClientUnitAgent('GLOBAL');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('Client Jest tests passed');
    expect(runCursorCommand).toHaveBeenCalled();
  });
});


