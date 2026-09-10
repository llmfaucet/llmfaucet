export type AgentName = 'aider' | 'claude-code' | 'cline' | 'codex' | 'continue' | 'roo-code';
export interface AgentInfo {
  name: AgentName;
  displayName: string;
  path: string;
}
export interface AgentConfig {
  agent: AgentName;
  path: string;
  content: string;
  format: 'json' | 'yaml' | 'toml' | 'text';
}
export interface AgentOptions {
  baseURL: string;
  apiKey?: string;
  defaultModel: string;
  cwd?: string;
}
