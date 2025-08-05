import { runCursorCommand } from '../utils/cursorApi';

export async function runBugAgent(module: string) {
  const testResult = await runCursorCommand(`npm test -- ${module}`);
  const fuzzResult = await runCursorCommand(`npm run fuzz -- ${module}`);
  const crashResult = await runCursorCommand(`npm run check-crash -- ${module}`);
  const passed = testResult.success && fuzzResult.success && crashResult.success;
  const details = `Tests: ${testResult.output}\nFuzz: ${fuzzResult.output}\nCrash: ${crashResult.output}`;
  return { passed, details };
} 