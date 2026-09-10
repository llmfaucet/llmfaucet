export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}
export interface LlmFaucetConfig extends RetryOptions {
  baseURL?: string;
  apiKey?: string;
  timeout?: number;
  fetch?: typeof globalThis.fetch;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  onAuthRequired?: () => Promise<string>;
}
export interface RequestOptions extends RequestInit {
  retry?: boolean;
}
