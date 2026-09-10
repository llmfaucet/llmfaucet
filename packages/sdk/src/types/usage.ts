export interface UsageResponse {
  plan?: string;
  limit?: number;
  remaining?: number;
  resetAt?: string;
  used?: number;
  [key: string]: unknown;
}
export interface ApiKey {
  id: string;
  prefix: string;
  label: string;
  status: string;
  createdAt: string;
  lastUsedAt?: string | null;
}
export interface ApiKeyCreated extends ApiKey {
  key: string;
  warning?: string;
}
