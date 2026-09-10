import type { LlmFaucetClient } from '../client';
import type { ModelList } from '../types/models';
export class ModelsResource {
  constructor(private readonly client: LlmFaucetClient) {}
  list() {
    return this.client.request<ModelList>('/models');
  }
}
