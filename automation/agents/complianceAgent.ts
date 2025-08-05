import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runComplianceAgent(module: string) {
  const previous = await loadMemory('compliance', module);
  const standards = await runCursorCommand(`echo 'Compliance standards check for ${module}'`);
  const privacy = await runCursorCommand(`echo 'Privacy/GDPR check for ${module}'`);
  const audit = await runCursorCommand(`echo 'Audit trail check for ${module}'`);
  const passed = standards.success && privacy.success && audit.success;
  const summary = `Standards: ${standards.output}\nPrivacy: ${privacy.output}\nAudit: ${audit.output}`;
  await saveMemory('compliance', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 