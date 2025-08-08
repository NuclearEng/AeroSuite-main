import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

/**
 * Runs server unit and integration tests via the server workspace.
 */
export async function runServerTestAgent(_module: string) {
  const memoryKey = 'serverTests';
  const previous = await loadMemory(memoryKey, 'GLOBAL');

  const unitIntegrationCmd = `npm test -w server -- --runInBand`;
  const result = await runCursorCommand(unitIntegrationCmd);

  const summary = `Command: ${unitIntegrationCmd}\n${result.output}`;
  await saveMemory(memoryKey, 'GLOBAL', summary);

  return { passed: result.success, details: `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)` };
}


