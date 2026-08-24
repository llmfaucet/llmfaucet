import type { AccountResponse, ApiError, ModelRecord, Preferences, PublicGithub, PublicMetrics, PublicSponsors, StatusResponse, UsageResponse } from './api-types';
import type { WaitlistApplication } from '@llmfaucet/types';
import { PREVIEW_ENDPOINT } from '@llmfaucet/config';

export const apiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8787' : '');
export const publicApiEndpoint = apiBase || 'https://api.llmfaucet.dev';
export const previewApiEndpoint = process.env.NEXT_PUBLIC_PREVIEW_API_BASE_URL || PREVIEW_ENDPOINT;
export const authUrl = apiBase ? `${apiBase}/auth/github` : '/login?error=api-endpoint-not-configured';

export const isPreviewApiConfigured = Boolean(apiBase) && apiBase === previewApiEndpoint.replace(/\/v1$/, '');

function normalizeAccount(raw: Record<string, unknown>): AccountResponse {
  const user = (raw.user ?? {}) as Record<string, unknown>;
  const entitlement = (raw.entitlement ?? {}) as Record<string, unknown>;
  const keys = Array.isArray(raw.keys) ? raw.keys : [];
  return {
    user: {
      githubLogin: String(user.githubLogin ?? user.github_login ?? ''),
      avatarUrl: (user.avatarUrl ?? user.avatar_url ?? null) as string | null,
      createdAt: (user.createdAt ?? user.created_at) as string | undefined,
    },
    entitlement: {
      plan: (entitlement.plan ?? 'registered') as AccountResponse['entitlement']['plan'],
      requestsPerDay: Number(entitlement.requestsPerDay ?? entitlement.requests_per_day ?? 50),
      queuePriority: Number(entitlement.queuePriority ?? entitlement.queue_priority ?? 10),
      sponsorshipStatus: String(entitlement.sponsorshipStatus ?? entitlement.status ?? 'none'),
    },
    keys: keys.map((value) => {
      const key = value as Record<string, unknown>;
      return {
        id: String(key.id ?? ''),
        prefix: String(key.prefix ?? key.key_prefix ?? ''),
        label: String(key.label ?? 'default'),
        status: String(key.status ?? 'active'),
        createdAt: String(key.createdAt ?? key.created_at ?? ''),
        lastUsedAt: (key.lastUsedAt ?? key.last_used_at ?? null) as string | null,
      };
    }),
  };
}

function normalizeStatus(raw: Record<string, unknown>): StatusResponse {
  const providers = Array.isArray(raw.providers) ? raw.providers : [];
  return {
    status: typeof raw.status === 'string' ? raw.status : undefined,
    checkedAt: typeof raw.checkedAt === 'string' ? raw.checkedAt : undefined,
    providers: providers.map((value) => typeof value === 'string'
      ? { provider: value, status: 'Unavailable' }
      : value as NonNullable<StatusResponse['providers']>[number]),
  };
}
function normalizeWaitlist(value: Record<string, unknown>): WaitlistApplication {
  return { id: String(value.id ?? ''), status: value.status as WaitlistApplication['status'], githubLogin: String(value.githubLogin ?? value.github_login ?? ''), primaryTool: String(value.primaryTool ?? value.primary_tool ?? ''), primaryUseCase: String(value.primaryUseCase ?? value.primary_use_case ?? ''), expectedRequestVolume: value.expectedRequestVolume as string | null ?? value.expected_request_volume as string | null, operatingSystems: (value.operatingSystems ?? value.operating_systems ?? []) as string[], bugReportReadiness: value.bugReportReadiness as string ?? value.bug_report_readiness as string, testerGoal: value.testerGoal as string ?? value.tester_goal as string, createdAt: String(value.createdAt ?? value.created_at ?? ''), updatedAt: String(value.updatedAt ?? value.updated_at ?? ''), previewAccessExpiresAt: value.previewAccessExpiresAt as string | null ?? value.preview_access_expires_at as string | null };
}

async function request<T>(path: string, init?: RequestInit, redirectUnauthorized = true): Promise<T> {
  const publicRequest = path === '/status' || path === '/v1/models' || path.startsWith('/api/public/');
  const response = await fetch(`${apiBase}${path}`, { ...init, credentials: publicRequest ? 'omit' : 'include', headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    const error = new Error(body.error?.message ?? body.message ?? `Request failed (${response.status})`);
    Object.assign(error, { status: response.status });
    const publicWaitlistContext = typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '/waitlist');
    if (response.status === 401 && redirectUnauthorized && !publicWaitlistContext && typeof window !== 'undefined') window.location.assign('/login?error=unauthorized');
    throw error;
  }
  return response.json() as Promise<T>;
}

export const api = {
  account: () => request<Record<string, unknown>>('/account').then(normalizeAccount),
  keys: () => request<{ keys: unknown[] }>('/account/keys').then(result => normalizeAccount({ keys: result.keys }).keys),
  createKey: (label: string) => request<{ id: string; label: string; key: string; prefix: string; createdAt: string }>('/account/keys', { method: 'POST', body: JSON.stringify({ label }) }),
  revokeKey: (id: string) => request<{ revoked: boolean }>(`/account/keys/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  authUrl,
  syncSponsors: () => request('/account/sync-sponsorship', { method: 'POST' }),
  deleteAccount: () => request<{ deleted: boolean }>('/account', { method: 'DELETE', body: JSON.stringify({ confirm: 'DELETE MY ACCOUNT' }) }),
  usage: () => request<UsageResponse>('/account/usage'),
  models: () => request<{ data: ModelRecord[] }>('/v1/models'),
  status: () => request<Record<string, unknown>>('/status').then(normalizeStatus),
  logout: () => request('/auth/logout', { method: 'POST' }),
  waitlist: () => request<{ application: WaitlistApplication | null }>('/api/waitlist/me'),
  submitWaitlist: (body: unknown) => request<{ application: WaitlistApplication | null }>('/api/waitlist', { method: 'POST', body: JSON.stringify(body) }),
  updateWaitlist: (body: unknown) => request<{ application: WaitlistApplication | null }>('/api/waitlist/me', { method: 'PATCH', body: JSON.stringify(body) }),
  createPreviewKey: () => request<{ key: string; prefix: string; warning: string }>('/api/waitlist/me/key', { method: 'POST' }),
  adminWaitlist: (query = '') => request<{ applications: Record<string, unknown>[]; page: number; pageSize: number }>(`/api/admin/waitlist${query}`).then(result => ({ ...result, applications: result.applications.map(normalizeWaitlist) })),
  adminWaitlistDetail: (id: string) => request<{ application: WaitlistApplication; events: Array<Record<string, unknown>> }>(`/api/admin/waitlist/${encodeURIComponent(id)}`),
  adminUpdateWaitlist: (id: string, body: unknown) => request(`/api/admin/waitlist/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) }),
  approveWaitlist: (id: string) => request(`/api/admin/waitlist/${encodeURIComponent(id)}/approve`, { method: 'POST' }),
  revokeWaitlist: (id: string) => request(`/api/admin/waitlist/${encodeURIComponent(id)}/revoke`, { method: 'POST' }),
  publicGithub: () => request<PublicGithub>('/api/public/github'),
  publicSponsors: () => request<PublicSponsors>('/api/public/sponsors'),
  publicMetrics: () => request<PublicMetrics>('/api/public/metrics'),
  preferences: () => request<{ preferences: Preferences }>('/account/preferences'),
  updatePreferences: (body: Partial<Preferences>) => request<{ preferences: Preferences }>('/account/preferences', { method: 'PATCH', body: JSON.stringify({ theme: body.theme, defaultModelSelector: body.defaultModelSelector, primaryWorkflow: body.primaryWorkflow }) }, false),
  completeOnboarding: () => request<{ preferences: Preferences }>('/account/onboarding/complete', { method: 'POST' }),
  dismissOnboarding: () => request<{ preferences: Preferences }>('/account/onboarding/dismiss', { method: 'POST' }),
  replayOnboarding: () => request<{ preferences: Preferences }>('/account/onboarding/replay', { method: 'POST' }),
};
