jest.mock('../utils/cursorApi', () => ({
  runCursorCommand: jest.fn(async (cmd: string) => ({ success: true, output: `OK: ${cmd}` }))
}));
jest.mock('./memoryAgent', () => ({
  saveMemory: jest.fn(async () => undefined),
  loadMemory: jest.fn(async () => null)
}));

import { runScriptTestAgent } from './scriptTestAgent';
import { runCursorCommand } from '../utils/cursorApi';

describe('scriptTestAgent', () => {
  it('runs script-based tests and aggregates results', async () => {
    const result = await runScriptTestAgent('GLOBAL');
    expect(result.passed).toBe(true);
    expect(result.details).toContain('test:markdown');
    expect(result.details).toContain('test:typescript:best-practices');
    expect(result.details).toContain('test:jsx');
    expect(runCursorCommand).toHaveBeenCalled();
  });
});


