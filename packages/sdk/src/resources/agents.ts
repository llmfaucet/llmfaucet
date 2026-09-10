import type { LlmFaucetClient } from '../client';
import type { AgentConfig, AgentConfigOptions, AgentAdapter } from '../types/agent';
import { AiderAdapter } from '../agents/aider';
import { ClineAdapter } from '../agents/cline';
import { ClaudeCodeAdapter } from '../agents/claude-code';
import { ContinueAdapter } from '../agents/continue';
import { CodexAdapter } from '../agents/codex';
import { RooCodeAdapter } from '../agents/roo-code';
import { GenericAdapter } from '../agents/generic';
export class AgentsResource {
  private readonly adapters: AgentAdapter[] = [
    new AiderAdapter(),
    new ClineAdapter(),
    new ClaudeCodeAdapter(),
    new ContinueAdapter(),
    new CodexAdapter(),
    new RooCodeAdapter(),
    new GenericAdapter(),
  ];
  constructor(private readonly _client: LlmFaucetClient) {}
  getSupportedAgents() {
    return this.adapters.map(({ id, displayName }) => ({ id, name: displayName }));
  }
  generateConfig(agentId: string, options: AgentConfigOptions): AgentConfig {
    const adapter = this.adapters.find((item) => item.id === agentId);
    if (!adapter) throw new Error(`Unknown agent: ${agentId}`);
    return adapter.generateConfig(options);
  }
  generateAllConfigs(options: AgentConfigOptions) {
    return this.adapters.map((adapter) => adapter.generateConfig(options));
  }
  async detectAgent() {
    for (const adapter of this.adapters)
      if (await adapter.detect()) return { agentId: adapter.id, displayName: adapter.displayName, confidence: 0.9 };
    return { agentId: null, displayName: null, confidence: 0 };
  }
}
