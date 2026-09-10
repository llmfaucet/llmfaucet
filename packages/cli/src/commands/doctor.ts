import { Command } from 'commander';
import { detectAgent } from '../lib/detect';
import { readEnvironment } from '../lib/env';
import { checkAPIConnectivity } from '../lib/api-client';
import { output } from '../lib/output';
export const doctorCommand = new Command('doctor').description('Check llmfaucet setup').action(async () => {
  const agent = await detectAgent();
  const env = readEnvironment();
  if (agent) output.success(`Agent detected: ${agent.displayName}`);
  else output.warn('No supported agent detected');
  if (env.apiKey) output.success('API key found in environment');
  else output.info('No API key in environment');
  try {
    const status = await checkAPIConnectivity(env.baseURL);
    output.success(`API reachable: ${status.status}`);
  } catch {
    output.error('Cannot reach llmfaucet API');
    process.exitCode = 1;
  }
});
