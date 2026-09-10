import { BaseAdapter } from './base';
import type { AgentConfig, AgentConfigOptions } from '../types/agent';
export class GenericAdapter extends BaseAdapter {
  readonly id = 'generic';
  readonly displayName = 'OpenAI-compatible client';
  generateConfig(o: AgentConfigOptions): AgentConfig {
    return {
      agent: this.id,
      displayName: this.displayName,
      path: 'llmfaucet.config.json',
      format: 'json',
      content: this.json({ baseURL: o.baseURL, apiKey: o.apiKey, model: o.defaultModel, ...this.options(o) }),
    };
  }
}
