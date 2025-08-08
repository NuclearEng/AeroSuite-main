import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

/**
 * Runs repository script-based tests (markdown lint, TypeScript checks, etc.).
 * Intended to capture the JS-based tests under scripts/ and markdown checks.
 */
export async function runScriptTestAgent(_module: string) {
  const memoryKey = 'scriptTests';
  const previous = await loadMemory(memoryKey, 'GLOBAL');

  // Aggregate several script-driven test commands
  const commands = [
    'npm run test:markdown',
    'npm run test:typescript:best-practices',
    'npm run test:jsx',
  ];

  const outputs: string[] = [];
  let allPassed = true;
  for (const cmd of commands) {
    const res = await runCursorCommand(cmd);
    outputs.push(`$ ${cmd}\n${res.output}`);
    if (!res.success) allPassed = false;
  }

  const summary = outputs.join('\n\n');
  await saveMemory(memoryKey, 'GLOBAL', summary);

  return { passed: allPassed, details: `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)` };
}


