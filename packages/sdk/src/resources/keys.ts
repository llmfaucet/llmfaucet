import type { LlmFaucetClient } from '../client';
import type { ApiKey, ApiKeyCreated } from '../types/usage';
export class KeysResource {
  constructor(private readonly client: LlmFaucetClient) {}
  list() {
    return this.client.requestAccount<{ keys: ApiKey[] }>('/account/keys');
  }
  create(label?: string) {
    return this.client.requestAccount<ApiKeyCreated>('/account/keys', {
      method: 'POST',
      body: JSON.stringify(label ? { label } : {}),
      retry: false,
    });
  }
  revoke(id: string) {
    return this.client.requestAccount<void>(`/account/keys/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      retry: false,
    });
  }
}
