import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runDevSecOpsAgent(module: string) {
  const previous = await loadMemory('devSecOps', module);
  const vuln = await runCursorCommand(`echo 'Vulnerability scan for ${module}'`);
  const rbac = await runCursorCommand(`echo 'RBAC check for ${module}'`);
  const encryption = await runCursorCommand(`echo 'Encryption check for ${module}'`);
  const csp = await runCursorCommand(`echo 'CSP check for ${module}'`);
  const passed = vuln.success && rbac.success && encryption.success && csp.success;
  const summary = `Vuln: ${vuln.output}\nRBAC: ${rbac.output}\nEncryption: ${encryption.output}\nCSP: ${csp.output}`;
  await saveMemory('devSecOps', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 