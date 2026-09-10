import type { LlmFaucetClient } from '../client';
import type { UsageResponse } from '../types/usage';
export class UsageResource {
  constructor(private readonly client: LlmFaucetClient) {}
  get() {
    return this.client.requestAccount<UsageResponse>('/account/usage');
  }
}
