import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runProductLogicAgent(module: string) {
  const previous = await loadMemory('productLogic', module);
  const flows = await runCursorCommand(`npm run lint -- client/src/pages/${module.toLowerCase()}`);
  const rules = await runCursorCommand(`npm run test -- client/src/pages/${module.toLowerCase()}`);
  const edge = await runCursorCommand(`npm run test:coverage -- client/src/pages/${module.toLowerCase()}`);
  const passed = flows.success && rules.success && edge.success;
  const summary = `Flows: ${flows.output}\nRules: ${rules.output}\nEdge: ${edge.output}`;
  await saveMemory('productLogic', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 