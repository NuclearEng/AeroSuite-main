import { exec } from 'child_process';

export function runCursorCommand(cmd: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, output: stderr || error.message });
      } else {
        resolve({ success: true, output: stdout });
      }
    });
  });
} 