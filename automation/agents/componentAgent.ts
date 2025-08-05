import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runComponentAgent(module: string) {
  const previous = await loadMemory('component', module);
  const lint = await runCursorCommand(`npm run lint -- server/src/domains/component`);
  const test = await runCursorCommand(`npm run test -- server/src/domains/component`);
  const coverage = await runCursorCommand(`npm run test:coverage -- server/src/domains/component`);
  const passed = lint.success && test.success && coverage.success;
  const summary = `Lint: ${lint.output}\nTest: ${test.output}\nCoverage: ${coverage.output}`;
  await saveMemory('component', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 