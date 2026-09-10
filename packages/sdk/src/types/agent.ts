export type ConfigFormat = 'json' | 'yaml' | 'toml' | 'env';

export interface AgentConfig {
  agent: string;
  displayName: string;
  path: string;
  content: string;
  format: ConfigFormat;
  instructions?: string[];
  warnings?: string[];
  docs?: string[];
}

export interface AgentConfigOptions {
  baseURL: string;
  apiKey: string;
  defaultModel: string;
  customSettings?: Record<string, unknown>;
  environmentName?: string;
}

export interface AgentAdapter {
  id: string;
  displayName: string;
  detect(): Promise<boolean>;
  generateConfig(options: AgentConfigOptions): AgentConfig;
  validateConfig?(config: string): boolean;
  supportedFormats?: ConfigFormat[];
}
