import { runCursorCommand } from '../utils/cursorApi';

export async function runPerformanceAgent(module: string) {
  const loadTest = await runCursorCommand(`npx k6 run loadtest.js --module ${module}`);
  const profile = await runCursorCommand(`npm run profile -- ${module}`);
  const gpuProfile = await runCursorCommand('nvidia-smi --query-gpu=utilization.gpu --format=csv');
  const passed = loadTest.success && profile.success && gpuProfile.success;
  const details = `Load: ${loadTest.output}\nProfile: ${profile.output}\nGPU: ${gpuProfile.output}`;
  return { passed, details };
} 