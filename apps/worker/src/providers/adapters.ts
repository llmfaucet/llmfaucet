import type { ProviderHealth } from '@llmfaucet/types';
import type { Env, Model, NormalizedRequest } from '../types';
import { AdapterConfig, fetchWithTimeout, isProviderURLAllowed, ProviderAdapter, ProviderRequest, ProviderResponse, readSecret } from './base';

function modelPath(model: Model): string { return model.id.split('/').slice(1).join('/'); }

export class OpenAICompatibleAdapter implements ProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly baseURL: string;
  private readonly timeoutMs: number;
  private readonly headers: Record<string, string>;

  constructor(protected readonly env: Env, config: AdapterConfig) {
    this.id = config.id;
    this.name = config.name;
    this.baseURL = config.baseURL.replace(/\/$/, '');
    if (!isProviderURLAllowed(this.baseURL, env)) throw new Error(`Provider egress is not allowed for ${config.id}`);
    this.timeoutMs = config.timeoutMs ?? 10000;
    this.headers = { 'content-type': 'application/json', accept: 'application/json' };
    const key = readSecret(env, config.apiKeySecretRef);
    if (config.apiKeyRequired && !key) throw new Error(`Missing secret for provider ${config.id}`);
    if (key) {
      const header = config.apiKeyHeader ?? 'authorization';
      this.headers[header.toLowerCase()] = header.toLowerCase() === 'authorization' ? `Bearer ${key}` : key;
    }
  }

  async normalizeRequest(request: NormalizedRequest, model: Model): Promise<ProviderRequest> {
    const body: Record<string, unknown> = request.capability === 'embeddings'
      ? { model: modelPath(model), input: request.raw.input ?? request.raw.prompt }
      : { model: modelPath(model), messages: request.messages, stream: request.stream };
    if (request.capability === 'embeddings') return { url: this.embeddingsURL(), method: 'POST', headers: { ...this.headers, accept: 'application/json' }, body, timeout: this.timeoutMs };
    for (const key of ['max_tokens', 'temperature', 'tools', 'tool_choice', 'response_format']) {
      const value = request[key as keyof NormalizedRequest];
      if (value !== undefined) body[key] = value;
    }
    return { url: this.chatURL(), method: 'POST', headers: { ...this.headers, accept: request.stream ? 'text/event-stream' : 'application/json' }, body, timeout: this.timeoutMs };
  }

  async normalizeResponse(response: ProviderResponse): Promise<ProviderResponse> { return response; }

  async checkHealth(): Promise<ProviderHealth> {
    const started = Date.now();
    try {
      const response = await fetchWithTimeout(this.modelsURL(), { headers: this.headers }, 5000);
      const latencyMs = Date.now() - started;
      return { status: response.ok ? 'healthy' : 'degraded', latencyMs, ...(response.ok ? {} : { errorMessage: `health check returned ${response.status}` }), timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'down', latencyMs: Date.now() - started, errorMessage: error instanceof Error ? error.message : 'health check failed', timestamp: new Date().toISOString() };
    }
  }

  async getModels(): Promise<Model[]> {
    try {
      const response = await fetchWithTimeout(this.modelsURL(), { headers: this.headers }, this.timeoutMs);
      if (!response.ok) throw new Error(`model catalog returned ${response.status}`);
      const data = await response.json() as { data?: Array<Record<string, unknown>> };
      if (!Array.isArray(data.data)) throw new Error('model catalog response missing data array');
      return data.data.filter((item) => typeof item.id === 'string').map((item) => ({ id: String(item.id), provider: this.id, capabilities: Array.isArray(item.capabilities) ? item.capabilities.filter((value): value is 'chat' | 'vision' | 'tools' | 'embeddings' | 'completion' => typeof value === 'string') : ['chat'], quality: Number(item.quality ?? 5), speed: Number(item.speed ?? 5), context: Number(item.context_window ?? item.context ?? 8192), supported_parameters: Array.isArray(item.supported_parameters) ? item.supported_parameters.filter((value): value is string => typeof value === 'string') : ['stream', 'temperature', 'max_tokens'], ...(typeof item.family === 'string' ? { family: item.family } : {}) }));
    } catch (error) { throw error instanceof Error ? error : new Error('model catalog request failed'); }
  }

  protected chatURL(): string {
    if (this.baseURL.endsWith('/chat/completions')) return this.baseURL;
    return `${this.baseURL}${this.baseURL.endsWith('/v1') ? '' : '/v1'}/chat/completions`;
  }
  protected modelsURL(): string { return this.chatURL().replace(/\/chat\/completions$/, '/models'); }
  protected embeddingsURL(): string { return this.chatURL().replace(/\/chat\/completions$/, '/embeddings'); }
}

export class PollinationsAdapter extends OpenAICompatibleAdapter {
  protected chatURL(): string { return this.baseURL.endsWith('/openai') ? this.baseURL : super.chatURL(); }
  protected modelsURL(): string { return this.baseURL.endsWith('/openai') ? `${this.baseURL.replace(/\/openai$/, '')}/models` : super.modelsURL(); }
}
export class LLM7Adapter extends OpenAICompatibleAdapter {}
export class OVHAdapter extends OpenAICompatibleAdapter {}
export class OpenCodeZenAdapter extends OpenAICompatibleAdapter {}

export class AIHordeAdapter extends OpenAICompatibleAdapter {
  protected chatURL(): string { return `${this.baseURL.replace(/\/generate\/async$/, '')}/generate/async`; }
  protected modelsURL(): string { return `${this.baseURL.replace(/\/generate\/async$/, '')}/status/heartbeat`; }
}
