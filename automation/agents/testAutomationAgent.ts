import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runTestAutomationAgent(module: string) {
  const previous = await loadMemory('testAutomation', module);
  const coverage = await runCursorCommand(`npx jest client/src/pages/${module.toLowerCase()} --coverage --passWithNoTests`);
  const e2e = await runCursorCommand(`npm run test -- client/src/pages/${module.toLowerCase()}`);
  const mocks = await runCursorCommand(`npm run lint -- client/src/pages/${module.toLowerCase()}`);
  const passed = coverage.success && e2e.success && mocks.success;
  const summary = `Coverage: ${coverage.output}\nE2E: ${e2e.output}\nMocks: ${mocks.output}`;
  await saveMemory('testAutomation', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 