import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runUXAgent(module: string) {
  const previous = await loadMemory('ux', module);
  const simulate = await runCursorCommand(`npm run lint -- client/src/pages/${module.toLowerCase()}`);
  const validate = await runCursorCommand(`npm run test:coverage -- client/src/pages/${module.toLowerCase()}`);
  const a11y = await runCursorCommand(`npm run a11y-check -- client/src/pages/${module.toLowerCase()}`);
  const passed = simulate.success && validate.success && a11y.success;
  const summary = `Simulate: ${simulate.output}\nValidate: ${validate.output}\nA11y: ${a11y.output}`;
  await saveMemory('ux', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 