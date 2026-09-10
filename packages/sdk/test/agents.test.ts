import { describe, expect, it } from 'vitest';
import { AiderAdapter, AgentsResource, LlmFaucetClient } from '../src';

const options = { baseURL: 'https://api.example.test/v1', apiKey: 'test-key', defaultModel: 'auto:coding' };

describe('agent configuration', () => {
  it('generates an Aider configuration with the gateway settings', () => {
    const config = new AiderAdapter().generateConfig(options);
    expect(config.agent).toBe('aider');
    expect(config.content).toContain(options.baseURL);
    expect(config.content).toContain(options.defaultModel);
  });

  it('exposes supported agents through the client', () => {
    const agents = new LlmFaucetClient().agents;
    expect(agents.getSupportedAgents().map((agent) => agent.id)).toEqual([
      'aider',
      'cline',
      'claude-code',
      'continue',
      'codex',
      'roo-code',
      'generic',
    ]);
  });
});
