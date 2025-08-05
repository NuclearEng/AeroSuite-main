import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runSecurityAgent(module: string) {
  const previous = await loadMemory('security', module);
  const audit = await runCursorCommand(`npm audit --json`);
  const deps = await runCursorCommand(`npm run security-scan`);
  const vulns = await runCursorCommand(`npm run owasp:audit`);
  const passed = audit.success && deps.success && vulns.success;
  const summary = `Audit: ${audit.output}\nDeps: ${deps.output}\nVulns: ${vulns.output}`;
  await saveMemory('security', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 