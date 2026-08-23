export type Capability = 'chat' | 'vision' | 'tools' | 'embeddings' | 'completion';

export interface Env {
  BUDGETS: KVNamespace;
  DB?: D1Database;
  QUEUE?: Queue;
  ENVIRONMENT: string;
  POLLINATIONS_URL?: string;
  LLM7_URL?: string;
  OPENCODE_ZEN_URL?: string;
  OVH_URL?: string;
  AI_HORDE_URL?: string;
  CATALOG_URL?: string;
  BUDGET_HASH_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_SESSION_SECRET?: string;
  GITHUB_SPONSORS_WEBHOOK_SECRET?: string;
  GITHUB_SPONSOR_LOGIN?: string;
  PUBLIC_BASE_URL?: string;
}

export interface Model {
  id: string;
  provider: string;
  capabilities: Capability[];
  quality: number;
  speed: number;
  context: number;
  supported_parameters: string[];
  family?: string;
}

export interface ChatMessage { role: string; content: unknown; name?: string; tool_calls?: unknown[]; }
export interface ChatRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  tools?: unknown[];
  tool_choice?: unknown;
  response_format?: unknown;
  [key: string]: unknown;
}

export interface NormalizedRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  max_tokens?: number;
  temperature?: number;
  tools?: unknown[];
  tool_choice?: unknown;
  response_format?: unknown;
  capability: Capability;
  selector: string;
  raw: Record<string, unknown>;
  wire?: 'openai' | 'anthropic' | 'responses' | 'legacy' | 'embeddings';
}

export interface ProviderResult { response: Response; model: Model; provider: string; }
