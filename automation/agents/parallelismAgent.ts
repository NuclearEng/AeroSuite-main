import { runCursorCommand } from '../utils/cursorApi';

export async function runParallelismAgent(module: string) {
  const staticResult = await runCursorCommand(`npm run thread-safety -- ${module}`);
  const dynamicResult = await runCursorCommand(`npm run concurrency-test -- ${module}`);
  const gpuResult = await runCursorCommand('nvidia-smi --query-gpu=utilization.gpu --format=csv');
  const passed = staticResult.success && dynamicResult.success && gpuResult.success;
  const details = `Static: ${staticResult.output}\nDynamic: ${dynamicResult.output}\nGPU: ${gpuResult.output}`;
  return { passed, details };
} 