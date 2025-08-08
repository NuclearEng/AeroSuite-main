jest.mock('../utils/cursorApi', () => ({
  runCursorCommand: jest.fn(async () => ({ success: true, output: 'Comprehensive Test Runner completed' }))
}));
jest.mock('./memoryAgent', () => ({
  saveMemory: jest.fn(async () => undefined),
  loadMemory: jest.fn(async () => null)
}));

import { runComprehensiveRunnerAgent } from './comprehensiveRunnerAgent';
import { runCursorCommand } from '../utils/cursorApi';

describe('comprehensiveRunnerAgent', () => {
  it('runs the comprehensive runner and reports success', async () => {
    const result = await runComprehensiveRunnerAgent('GLOBAL');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('Comprehensive Test Runner completed');
    expect(runCursorCommand).toHaveBeenCalled();
  });
});


