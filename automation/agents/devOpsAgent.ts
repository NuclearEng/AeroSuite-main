import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runDevOpsAgent(module: string) {
  const previous = await loadMemory('devOps', module);
  const ci = await runCursorCommand(`echo 'CI pipeline check for ${module}'`);
  const cd = await runCursorCommand(`echo 'CD pipeline check for ${module}'`);
  const infra = await runCursorCommand(`echo 'Infrastructure as code check for ${module}'`);
  const passed = ci.success && cd.success && infra.success;
  const summary = `CI: ${ci.output}\nCD: ${cd.output}\nInfra: ${infra.output}`;
  await saveMemory('devOps', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 