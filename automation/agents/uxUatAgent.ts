import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runUxUatAgent(module: string) {
  const previous = await loadMemory('uxUat', module);
  const ux = await runCursorCommand(`npm run lint -- client/src/pages/${module.toLowerCase()}`);
  const uat = await runCursorCommand(`npm run test -- client/src/pages/${module.toLowerCase()}`);
  const accessibility = await runCursorCommand(`npm run a11y-check -- client/src/pages/${module.toLowerCase()}`);
  const passed = ux.success && uat.success && accessibility.success;
  const summary = `UX: ${ux.output}\nUAT: ${uat.output}\nAccessibility: ${accessibility.output}`;
  await saveMemory('uxUat', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 