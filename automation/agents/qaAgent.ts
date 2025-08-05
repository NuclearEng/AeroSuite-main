import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runQaAgent(module: string) {
  // Load previous findings for context
  const previous = await loadMemory('qa', module);
  const manual = await runCursorCommand(`npm run test -- client/src/pages/${module.toLowerCase()}`);
  const exploratory = await runCursorCommand(`npm run lint -- client/src/pages/${module.toLowerCase()}`);
  const regression = await runCursorCommand(`npm run test:coverage -- client/src/pages/${module.toLowerCase()}`);
  const passed = manual.success && exploratory.success && regression.success;
  const summary = `Manual: ${manual.output}\nExploratory: ${exploratory.output}\nRegression: ${regression.output}`;
  // Save current findings to memory
  await saveMemory('qa', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 