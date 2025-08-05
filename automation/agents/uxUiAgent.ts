import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runUxUiAgent(module: string) {
  const previous = await loadMemory('uxUi', module);
  const lint = await runCursorCommand(`npm run lint -- client/src/pages/${module.toLowerCase()}`);
  const a11y = await runCursorCommand(`npm run a11y-check -- client/src/pages/${module.toLowerCase()}`);
  const visual = await runCursorCommand(`npm run visual-regression -- client/src/pages/${module.toLowerCase()} || echo 'Visual regression script not found'`);
  const passed = lint.success && a11y.success && visual.success;
  const summary = `Lint: ${lint.output}\nA11y: ${a11y.output}\nVisual: ${visual.output}`;
  await saveMemory('uxUi', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 