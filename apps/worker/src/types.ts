export type Capability = 'chat' | 'vision' | 'tools' | 'embeddings' | 'completion';

export interface Env {
  BUDGETS: KVNamespace;
  DB?: D1Database;
  QUOTA_LIMITER?: DurableObjectNamespace;
  EDGE_LIMITER?: RateLimit;
  ENVIRONMENT: string;
  POLLINATIONS_URL?: string;
  LLM7_URL?: string;
  OPENCODE_ZEN_URL?: string;
  OVH_URL?: string;
  AI_HORDE_URL?: string;
  CATALOG_URL?: string;
  BUDGET_HASH_SECRET?: string;
  IP_HASH_SECRET?: string;
  SESSION_HMAC_SECRET?: string;
  OAUTH_STATE_SECRET?: string;
  GITHUB_SPONSORABLE_LOGIN?: string;
  GITHUB_SUPPORTER_TIER_ID?: string;
  GITHUB_PRO_TIER_ID?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_SESSION_SECRET?: string;
  GITHUB_SPONSORS_WEBHOOK_SECRET?: string;
  GITHUB_SPONSOR_LOGIN?: string;
  GITHUB_SPECIAL_SPONSORS?: string;
  PUBLIC_METRICS_INCLUDE_AGGREGATES?: string;
  PUBLIC_BASE_URL?: string;
  PUBLIC_FRONTEND_URL?: string;
  PUBLIC_WEB_ORIGINS?: string;
  ADMIN_GITHUB_LOGINS?: string;
  GITHUB_PUBLIC_READ_TOKEN?: string;
  GITHUB_PUBLIC_REPOSITORY?: string;
  SDK_NPM_PACKAGE?: string;
  CLI_NPM_PACKAGE?: string;
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
