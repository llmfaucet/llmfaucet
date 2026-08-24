import type { ModelSelector } from '@llmfaucet/types';

export interface LlmFaucetClientOptions {
  baseURL?: string;
  apiKey?: string;
  fetch?: typeof fetch;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: ModelSelector | string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
}

export class LlmFaucetError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'LlmFaucetError';
  }
}

export class LlmFaucetClient {
  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly requestFetch: typeof fetch;

  constructor(options: LlmFaucetClientOptions = {}) {
    this.baseURL = (options.baseURL ?? 'https://api.llmfaucet.dev/v1').replace(/\/$/, '');
    this.apiKey = options.apiKey ?? 'free';
    this.requestFetch = options.fetch ?? fetch;
  }

  async chatCompletions(request: ChatCompletionRequest): Promise<unknown | ReadableStream<Uint8Array> | null> {
    const response = await this.requestFetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new LlmFaucetError(response.status, await response.text());
    if (request.stream) return response.body;
    return response.json();
  }
}

export { LlmFaucetClient as LLMFaucet };
