import { access } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentInfo, AgentName } from '../types';
const definitions: Array<[AgentName, string, string[]]> = [
  ['aider', 'Aider', ['.aider.conf.yml']],
  ['claude-code', 'Claude Code', ['.claude/settings.json', '.claude/settings.local.json']],
  ['cline', 'Cline', ['.vscode/settings.json', '.cline/llmfaucet.json']],
  ['codex', 'Codex CLI', ['.codex/config.toml']],
  ['continue', 'Continue', ['.continue/config.yaml', '.continue/config.json']],
  ['roo-code', 'Roo Code', ['.roo/llmfaucet.json']],
];
export async function detectAgents(cwd = process.cwd()): Promise<AgentInfo[]> {
  const found: AgentInfo[] = [];
  for (const [name, displayName, paths] of definitions)
    for (const path of paths)
      if (
        await access(join(cwd, path)).then(
          () => true,
          () => false,
        )
      ) {
        found.push({ name, displayName, path });
        break;
      }
  return found;
}
export async function detectAgent(cwd = process.cwd()) {
  return (await detectAgents(cwd))[0] ?? null;
}
