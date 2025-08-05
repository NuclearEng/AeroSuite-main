import { runCursorCommand } from '../utils/cursorApi';

export async function runTestCoverageAgent(module: string) {
  const dir = `client/src/pages/${module.toLowerCase()}`;
  try {
    const result = await runCursorCommand(`npm test -- --coverage -- ${dir}`);
    return { passed: result.success, details: result.output };
  } catch (err) {
    return { passed: false, details: `Error: ${err}` };
  }
} 