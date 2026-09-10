import type { LlmFaucetClient } from '../client';
import type { EmbeddingRequest, EmbeddingResponse } from '../types/embeddings';
export class EmbeddingsResource {
  constructor(private readonly client: LlmFaucetClient) {}
  create(request: EmbeddingRequest) {
    return this.client.request<EmbeddingResponse>('/embeddings', {
      method: 'POST',
      body: JSON.stringify(request),
      retry: false,
    });
  }
}
