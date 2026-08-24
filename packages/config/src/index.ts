import type { AccessPlan, ModelSelector } from '@llmfaucet/types';

export const MODEL_SELECTORS: readonly ModelSelector[] = ['auto', 'auto:fast', 'auto:smart', 'auto:coding'];

export const PLAN_LIMITS: Readonly<
  Record<AccessPlan, { requestsPerDay: number; queuePriority: number; concurrentStreams: number }>
> = {
  anonymous: { requestsPerDay: 20, queuePriority: 0, concurrentStreams: 1 },
  registered: { requestsPerDay: 50, queuePriority: 10, concurrentStreams: 2 },
  early_tester: { requestsPerDay: 100, queuePriority: 15, concurrentStreams: 2 },
  supporter: { requestsPerDay: 200, queuePriority: 20, concurrentStreams: 3 },
  pro: { requestsPerDay: 500, queuePriority: 30, concurrentStreams: 5 },
};

export const PREVIEW_ENDPOINT = 'https://api.llmfaucet-preview.dev/v1';
