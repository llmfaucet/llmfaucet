import { BaseAdapter } from './base';
import type { AgentConfig, AgentConfigOptions } from '../types/agent';
export class ContinueAdapter extends BaseAdapter {
  readonly id = 'continue';
  readonly displayName = 'Continue';
  protected detectionPaths() {
    return ['.continue/config.json', '.continue/config.yaml'];
  }
  generateConfig(o: AgentConfigOptions): AgentConfig {
    return {
      agent: this.id,
      displayName: this.displayName,
      path: '.continue/config.json',
      format: 'json',
      content: this.json({
        models: [
          { name: 'llmfaucet', provider: 'openai', model: o.defaultModel, apiBase: o.baseURL, apiKey: o.apiKey },
        ],
        ...this.options(o),
      }),
      instructions: ['Merge this model entry into your Continue configuration.'],
    };
  }
}
