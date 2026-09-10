import { Command } from 'commander';
import { checkAPIConnectivity } from '../lib/api-client';
import { readEnvironment } from '../lib/env';
import { output } from '../lib/output';
export const statusCommand = new Command('status').description('Show gateway status').action(async () => {
  try {
    const result = await checkAPIConnectivity(readEnvironment().baseURL);
    output.success(`${result.status} (${result.endpoint})`);
  } catch (error) {
    output.error(error instanceof Error ? error.message : 'Status unavailable');
    process.exitCode = 1;
  }
});
