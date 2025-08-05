import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runCustomerAgent(module: string) {
  const previous = await loadMemory('customer', module);
  const lint = await runCursorCommand(`npm run lint -- server/src/domains/customer`);
  const test = await runCursorCommand(`npm run test -- server/src/domains/customer`);
  const coverage = await runCursorCommand(`npm run test:coverage -- server/src/domains/customer`);
  const passed = lint.success && test.success && coverage.success;
  const summary = `Lint: ${lint.output}\nTest: ${test.output}\nCoverage: ${coverage.output}`;
  await saveMemory('customer', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 