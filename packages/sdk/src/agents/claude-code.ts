import { BaseAdapter } from './base';
import type { AgentConfig, AgentConfigOptions } from '../types/agent';
export class ClaudeCodeAdapter extends BaseAdapter {
  readonly id = 'claude-code';
  readonly displayName = 'Claude Code';
  protected detectionPaths() {
    return ['.claude/settings.json', '.claude/settings.local.json'];
  }
  generateConfig(o: AgentConfigOptions): AgentConfig {
    return {
      agent: this.id,
      displayName: this.displayName,
      path: '.claude/settings.local.json',
      format: 'json',
      content: this.json({
        env: { ANTHROPIC_BASE_URL: o.baseURL, ANTHROPIC_API_KEY: o.apiKey, ANTHROPIC_MODEL: o.defaultModel },
      }),
      instructions: ['Keep settings.local.json private and out of source control.'],
    };
  }
}
