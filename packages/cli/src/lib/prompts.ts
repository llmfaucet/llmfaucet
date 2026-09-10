import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout } from 'node:process';
export async function askApiKey() {
  if (!input.isTTY) return undefined;
  const rl = createInterface({ input, output: stdout });
  try {
    const answer = await rl.question('API key (optional): ');
    return answer.trim() || undefined;
  } finally {
    rl.close();
  }
}
