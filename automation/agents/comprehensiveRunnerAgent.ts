import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

/**
 * Wraps the comprehensive test runner to execute all meta test suites.
 */
export async function runComprehensiveRunnerAgent(_module: string) {
  const memoryKey = 'comprehensiveRunner';
  const previous = await loadMemory(memoryKey, 'GLOBAL');

  const cmd = 'node scripts/comprehensive-test-runner.js';
  const result = await runCursorCommand(cmd);

  const summary = `Command: ${cmd}\n${result.output}`;
  await saveMemory(memoryKey, 'GLOBAL', summary);

  return { passed: result.success, details: `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)` };
}


