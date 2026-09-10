import type { LlmFaucetClient } from '../client';
import type { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk } from '../types/chat';

export class ChatResource {
  constructor(private readonly client: LlmFaucetClient) {}
  create(request: ChatCompletionRequest) {
    return this.client.request<ChatCompletionResponse>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ ...request, stream: false }),
      retry: false,
    });
  }
  stream(request: ChatCompletionRequest, options: RequestInit = {}) {
    return this.client.stream<ChatCompletionChunk>('/chat/completions', {
      ...options,
      method: 'POST',
      body: JSON.stringify({ ...request, stream: true }),
    });
  }
}
