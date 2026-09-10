import { describe, expect, it } from 'vitest';
import { generateConfig } from '../src/adapters';
describe('adapters', () => {
  it('generates valid agent config output', () => {
    const config = generateConfig('claude-code', {
      baseURL: 'https://api.example/v1',
      apiKey: 'secret',
      defaultModel: 'auto:coding',
    });
    expect(config.path).toBe('.claude/settings.local.json');
    expect(config.content).toContain('ANTHROPIC_AUTH_TOKEN');
  });
  it('writes Codex responses configuration', () => {
    expect(
      generateConfig('codex', { baseURL: 'https://api.example/v1', defaultModel: 'auto:coding' }).content,
    ).toContain('wire_api = "responses"');
  });
});
