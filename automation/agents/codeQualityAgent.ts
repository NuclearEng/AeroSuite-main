import { runCursorCommand } from '../utils/cursorApi';

export async function runCodeQualityAgent(module: string) {
  const lintResult = await runCursorCommand(`npm run lint -- ${module}`);
  const formatResult = await runCursorCommand(`npm run format -- ${module}`);
  const docsResult = await runCursorCommand(`npm run check-docs -- ${module}`);
  const passed = lintResult.success && formatResult.success && docsResult.success;
  const details = `Lint: ${lintResult.output}\nFormat: ${formatResult.output}\nDocs: ${docsResult.output}`;
  return { passed, details };
} 