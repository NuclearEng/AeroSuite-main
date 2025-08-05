import { runCursorCommand } from '../utils/cursorApi';

export async function runA11yAgent(module: string) {
  // Map module to directory
  const dir = `client/src/pages/${module.toLowerCase()}`;
  try {
    const result = await runCursorCommand(`npm run a11y-check -- ${dir}`);
    return { passed: result.success, details: result.output };
  } catch (err) {
    return { passed: false, details: `Error: ${err}` };
  }
} 