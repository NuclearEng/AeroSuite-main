import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runSystemsAgent() {
  const previous = await loadMemory('systems', 'all');
  const lint = await runCursorCommand(`npm run lint`);
  const test = await runCursorCommand(`npm run test`);
  const coverage = await runCursorCommand(`npm run test:coverage`);
  const security = await runCursorCommand(`npm run security-scan`);
  const infra = await runCursorCommand(`ls k8s/base | grep .yaml || echo 'No k8s manifests found'`);
  const passed = lint.success && test.success && coverage.success && security.success && infra.success;
  const summary = `Lint: ${lint.output}\nTest: ${test.output}\nCoverage: ${coverage.output}\nSecurity: ${security.output}\nInfra: ${infra.output}`;
  await saveMemory('systems', 'all', summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 