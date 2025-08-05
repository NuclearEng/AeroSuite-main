import fs from 'fs/promises';
import path from 'path';

const MEMORY_DIR = path.resolve(__dirname, '../../agent-memory');

export async function saveMemory(agent: string, module: string, data: string) {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
    const file = path.join(MEMORY_DIR, `${agent}-${module}.txt`);
    await fs.writeFile(file, data, 'utf8');
  } catch (err) {
    console.error('Error saving memory:', err);
  }
}

export async function loadMemory(agent: string, module: string): Promise<string | null> {
  try {
    const file = path.join(MEMORY_DIR, `${agent}-${module}.txt`);
    return await fs.readFile(file, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    console.error('Error loading memory:', err);
    return null;
  }
}

export async function listMemories(agent: string): Promise<string[]> {
  try {
    const files = await fs.readdir(MEMORY_DIR);
    return files
      .filter((f: string) => f.startsWith(agent + '-') && f.endsWith('.txt'))
      .map((f: string) => f.replace(`${agent}-`, '').replace('.txt', ''));
  } catch (err) {
    return [];
  }
} 