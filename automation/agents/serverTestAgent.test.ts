jest.mock('../utils/cursorApi', () => ({
  runCursorCommand: jest.fn(async () => ({ success: true, output: 'Server Jest tests passed' }))
}));
jest.mock('./memoryAgent', () => ({
  saveMemory: jest.fn(async () => undefined),
  loadMemory: jest.fn(async () => null)
}));

import { runServerTestAgent } from './serverTestAgent';
import { runCursorCommand } from '../utils/cursorApi';

describe('serverTestAgent', () => {
  it('runs server tests and reports success', async () => {
    const result = await runServerTestAgent('GLOBAL');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('Server Jest tests passed');
    expect(runCursorCommand).toHaveBeenCalled();
  });
});


