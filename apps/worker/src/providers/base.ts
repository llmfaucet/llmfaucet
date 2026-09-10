import type { ProviderHealth } from '@llmfaucet/types';
import type { Env, Model, NormalizedRequest } from '../types';

export interface ProviderRequest {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: unknown;
  timeout: number;
}

export interface ProviderResponse {
  response: Response;
  model?: Model;
  provider: string;
}

export interface ProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly baseURL: string;
  normalizeRequest(request: NormalizedRequest, model: Model): Promise<ProviderRequest>;
  normalizeResponse(response: ProviderResponse): Promise<ProviderResponse>;
  checkHealth(): Promise<ProviderHealth>;
  getModels(): Promise<Model[]>;
}

export interface AdapterConfig {
  id: string;
  name: string;
  baseURL: string;
  timeoutMs?: number;
  apiKeyRequired?: boolean;
  apiKeyHeader?: string | null;
  apiKeySecretRef?: string | null;
}

const BUILTIN_PROVIDER_ORIGINS = new Set([
  'https://text.pollinations.ai',
  'https://api.llm7.io',
  'https://opencode.ai',
  'https://oai.endpoints.kepler.ai.cloud.ovh.net',
  'https://aihorde.net',
]);

export function isProviderSecretRef(ref: string | null | undefined): boolean {
  return typeof ref === 'string' && /^PROVIDER_[A-Z0-9_]{1,96}$/.test(ref);
}

export function isProviderURLAllowed(value: string, env: Env): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname.includes('..')) return false;
    const allowed = new Set(BUILTIN_PROVIDER_ORIGINS);
    for (const origin of (env.PROVIDER_EGRESS_ALLOWLIST ?? '').split(',')) {
      const trimmed = origin.trim().replace(/\/$/, '');
      if (trimmed) allowed.add(trimmed);
    }
    return allowed.has(url.origin);
  } catch { return false; }
}

export function readSecret(env: Env, ref?: string | null): string | undefined {
  if (!ref || !isProviderSecretRef(ref)) return undefined;
  const value = (env as unknown as Record<string, unknown>)[ref];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, redirect: 'error', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
