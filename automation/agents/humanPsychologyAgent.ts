import { runCursorCommand } from '../utils/cursorApi';
import { saveMemory, loadMemory } from './memoryAgent';

export async function runHumanPsychologyAgent(module: string) {
  const previous = await loadMemory('humanPsychology', module);
  const cognitive = await runCursorCommand(`npm run cognitive-load-check -- client/src/pages/${module.toLowerCase()} || echo 'Cognitive load script not found'`);
  const reward = await runCursorCommand(`npm run reward-center-check -- client/src/pages/${module.toLowerCase()} || echo 'Reward center script not found'`);
  const emotion = await runCursorCommand(`npm run emotional-impact-check -- client/src/pages/${module.toLowerCase()} || echo 'Emotional impact script not found'`);
  const passed = cognitive.success && reward.success && emotion.success;
  const summary = `Cognitive: ${cognitive.output}\nReward: ${reward.output}\nEmotion: ${emotion.output}`;
  await saveMemory('humanPsychology', module, summary);
  const details = `${previous ? `Previous findings:\n${previous}\n---\n` : ''}${summary}\n(Memory updated)`;
  return { passed, details };
} 