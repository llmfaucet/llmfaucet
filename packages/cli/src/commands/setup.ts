import { Command } from 'commander';
import { generateConfig } from '../adapters';
import { detectAgent } from '../lib/detect';
import { readEnvironment } from '../lib/env';
import { askApiKey } from '../lib/prompts';
import { output } from '../lib/output';
import { writeConfigFile } from '../lib/config-files';
import type { AgentName } from '../types';

const isAgentName = (value: string): value is AgentName =>
  ['aider', 'claude-code', 'cline', 'codex', 'continue', 'roo-code'].includes(value);
const redactSecrets = (content: string) =>
  content.replace(
    /((?:api[-_]?key|auth[-_]?token|LLMFAUCET_API_KEY)\s*["']?\s*[:=]\s*["']?)[^\n,}"']+/gi,
    '$1<redacted>',
  );

export const setupCommand = new Command('setup')
  .description('Configure llmfaucet for a coding agent')
  .option('--agent <name>')
  .option('--api-key <key>')
  .option('--base-url <url>')
  .option('--model <model>')
  .option('--dry-run')
  .option('--force', 'replace an existing configuration file')
  .action(
    async (options: {
      agent?: string;
      apiKey?: string;
      baseUrl?: string;
      model?: string;
      dryRun?: boolean;
      force?: boolean;
    }) => {
      const env = readEnvironment();
      const detected = await detectAgent();
      const agent = options.agent ?? detected?.name;
      if (!agent) {
        output.error('No supported agent detected. Use --agent aider|claude-code|cline|codex|continue|roo-code.');
        process.exitCode = 1;
        return;
      }
      if (!isAgentName(agent)) {
        output.error(`Unsupported agent: ${agent}`);
        process.exitCode = 1;
        return;
      }
      if (agent === 'codex' && options.apiKey) {
        output.error('Codex reads LLMFAUCET_API_KEY from the environment; do not pass --api-key for Codex.');
        process.exitCode = 1;
        return;
      }
      const apiKey = agent === 'codex' ? undefined : (options.apiKey ?? env.apiKey ?? (await askApiKey()));
      const config = generateConfig(agent, {
        baseURL: options.baseUrl ?? env.baseURL,
        apiKey,
        defaultModel: options.model ?? env.model,
      });
      if (options.dryRun) {
        output.info(`Would write ${config.path}`);
        console.log(redactSecrets(config.content));
        return;
      }
      try {
        await writeConfigFile(config.path, config.content, { force: options.force });
      } catch (error) {
        output.error(error instanceof Error ? error.message : 'Unable to write configuration');
        process.exitCode = 1;
        return;
      }
      output.success(`Configuration written to ${config.path}`);
    },
  );
