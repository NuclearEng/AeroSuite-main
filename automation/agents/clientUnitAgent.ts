import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

/**
 * Runs all client unit tests (Jest) in CI-friendly mode.
 * Executes from the monorepo root using the workspace flag.
 */
export async function runClientUnitAgent(_module: string) {
  const memoryKey = 'clientUnit';
  const previous = await loadMemory(memoryKey, 'GLOBAL');

  const jestCmd = `npm test -w client -- --watchAll=false --runInBand`;
  const result = await runCursorCommand(jestCmd);

  const summary = `Command: ${jestCmd}\n${result.output}`;
  await saveMemory(memoryKey, 'GLOBAL', summary);

  return { passed: result.success, details: `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)` };
}


