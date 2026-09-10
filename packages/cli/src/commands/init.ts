import { Command } from 'commander';
import { readConfig, writeConfigFile } from '../lib/config-files';
import { output } from '../lib/output';
export const initCommand = new Command('init').description('Create a local environment template').action(async () => {
  if (await readConfig('.env.example')) return output.info('.env.example already exists');
  await writeConfigFile(
    '.env.example',
    'LLMFAUCET_API_KEY=\nLLMFAUCET_BASE_URL=https://api.llmfaucet.dev/v1\nLLMFAUCET_MODEL=auto:coding',
  );
  output.success('Created .env.example');
});
