import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runSupplierAgent(module: string) {
  const previous = await loadMemory('supplier', module);
  const lint = await runCursorCommand(`npm run lint -- server/src/domains/supplier`);
  const test = await runCursorCommand(`npm run test -- server/src/domains/supplier`);
  const coverage = await runCursorCommand(`npm run test:coverage -- server/src/domains/supplier`);
  const passed = lint.success && test.success && coverage.success;
  const summary = `Lint: ${lint.output}\nTest: ${test.output}\nCoverage: ${coverage.output}`;
  await saveMemory('supplier', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 