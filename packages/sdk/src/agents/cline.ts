import { BaseAdapter } from './base';
import type { AgentConfig, AgentConfigOptions } from '../types/agent';
export class ClineAdapter extends BaseAdapter {
  readonly id: string = 'cline';
  readonly displayName: string = 'Cline';
  protected detectionPaths() {
    return ['.vscode/settings.json'];
  }
  generateConfig(o: AgentConfigOptions): AgentConfig {
    return {
      agent: this.id,
      displayName: this.displayName,
      path: '.vscode/llmfaucet.cline.json',
      format: 'json',
      content: this.json({
        provider: 'openai-compatible',
        apiBase: o.baseURL,
        apiKey: o.apiKey,
        modelId: o.defaultModel,
        ...this.options(o),
      }),
      instructions: ['Copy these settings into Cline or Roo Code.'],
    };
  }
}
