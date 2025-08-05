import { runCursorCommand } from '../utils/cursorApi';

export async function runAIModelAgent(module: string) {
  const evalResult = await runCursorCommand(`npm run model-eval -- ${module}`);
  const driftResult = await runCursorCommand(`npm run model-drift -- ${module}`);
  const gpuResult = await runCursorCommand('nvidia-smi --query-gpu=utilization.gpu --format=csv');
  const passed = evalResult.success && driftResult.success && gpuResult.success;
  const details = `Eval: ${evalResult.output}\nDrift: ${driftResult.output}\nGPU: ${gpuResult.output}`;
  return { passed, details };
} 