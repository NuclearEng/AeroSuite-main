import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runInspectionAgent(module: string) {
  const previous = await loadMemory('inspection', module);
  const lint = await runCursorCommand(`npm run lint -- server/src/domains/inspection`);
  const test = await runCursorCommand(`npm run test -- server/src/domains/inspection`);
  const coverage = await runCursorCommand(`npm run test:coverage -- server/src/domains/inspection`);
  const passed = lint.success && test.success && coverage.success;
  const summary = `Lint: ${lint.output}\nTest: ${test.output}\nCoverage: ${coverage.output}`;
  await saveMemory('inspection', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 