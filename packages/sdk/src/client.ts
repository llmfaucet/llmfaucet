import type { LlmFaucetConfig, RequestOptions } from './types/client';
import { LlmFaucetError } from './errors';
import { request } from './lib/fetch';
import { parseSse } from './lib/stream';
import { ChatResource } from './resources/chat';
import { ModelsResource } from './resources/models';
import { UsageResource } from './resources/usage';
import { EmbeddingsResource } from './resources/embeddings';
import { KeysResource } from './resources/keys';
import { AgentsResource } from './resources/agents';

export class LlmFaucetClient {
  public readonly chat: ChatResource;
  public readonly models: ModelsResource;
  public readonly usage: UsageResource;
  public readonly embeddings: EmbeddingsResource;
  public readonly keys: KeysResource;
  public readonly agents: AgentsResource;
  public readonly baseURL: string;
  private readonly config: Required<Pick<LlmFaucetConfig, 'baseURL' | 'timeout' | 'maxRetries' | 'baseDelayMs'>> &
    LlmFaucetConfig;

  constructor(config: LlmFaucetConfig = {}) {
    this.config = {
      ...config,
      baseURL: config.baseURL ?? 'https://api.llmfaucet.dev/v1',
      timeout: config.timeout ?? 30_000,
      maxRetries: config.maxRetries ?? 2,
      baseDelayMs: config.baseDelayMs ?? 250,
    };
    this.baseURL = this.config.baseURL;
    this.chat = new ChatResource(this);
    this.models = new ModelsResource(this);
    this.usage = new UsageResource(this);
    this.embeddings = new EmbeddingsResource(this);
    this.keys = new KeysResource(this);
    this.agents = new AgentsResource(this);
  }

  request<T>(path: string, options: RequestOptions = {}) {
    return request<T>(this.config, path, options);
  }

  requestAccount<T>(path: string, options: RequestOptions = {}) {
    return request<T>({ ...this.config, baseURL: this.baseURL.replace(/\/v1\/?$/, '') }, path, options);
  }
  async *stream<T>(path: string, options: RequestInit = {}): AsyncGenerator<T> {
    const fetcher = this.config.fetch ?? globalThis.fetch;
    if (!fetcher) throw new LlmFaucetError({ message: 'Fetch is not available in this runtime' });
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => controller.abort(),
      this.config.timeout,
    );
    const abort = () => controller.abort(options.signal?.reason);
    if (options.signal) {
      if (options.signal.aborted) abort();
      else options.signal.addEventListener('abort', abort, { once: true });
    }
    try {
      const headers = new Headers(this.config.headers);
      headers.set('Accept', 'text/event-stream');
      headers.set('Content-Type', 'application/json');
      if (this.config.apiKey) headers.set('Authorization', `Bearer ${this.config.apiKey}`);
      new Headers(options.headers).forEach((value, key) => headers.set(key, value));
      const response = await fetcher(`${this.baseURL.replace(/\/$/, '')}${path}`, {
        ...options,
        credentials: options.credentials ?? this.config.credentials,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      timeoutId = undefined;
      yield* parseSse<T>(response);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', abort);
    }
  }
}
