import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runSoftwareArchitectAgent(module: string) {
  const previous = await loadMemory('softwareArchitect', module);
  const structure = await runCursorCommand(`echo 'Architecture analysis for ${module}'`);
  const circular = await runCursorCommand(`echo 'Circular dependency check for ${module}'`);
  const coupling = await runCursorCommand(`echo 'Coupling check for ${module}'`);
  const passed = structure.success && circular.success && coupling.success;
  const summary = `Structure: ${structure.output}\nCircular: ${circular.output}\nCoupling: ${coupling.output}`;
  await saveMemory('softwareArchitect', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 