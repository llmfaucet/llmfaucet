export type Plan = 'anonymous' | 'registered' | 'early_tester' | 'supporter' | 'pro';

export interface AccountResponse {
  user: { githubLogin: string; avatarUrl: string | null; createdAt?: string };
  entitlement: { plan: Plan; requestsPerDay: number; queuePriority: number; sponsorshipStatus?: string };
  keys: Array<{ id: string; prefix: string; label: string; status: string; createdAt: string; lastUsedAt: string | null }>;
}

export interface ModelRecord {
  id: string;
  name?: string;
  owned_by?: string;
  provider?: string;
  capabilities?: string[];
  context_window?: number;
  status?: string;
  supported_parameters?: string[];
}

export interface StatusResponse {
  status?: string;
  checkedAt?: string;
  providers?: Array<{ provider: string; models?: number; status?: string; latencyMs?: number; checkedAt?: string }>;
}

export interface UsageResponse {
  used: number;
  limit: number;
  resetAt: string;
  days?: Array<{ day: string; requests: number }>;
  routes?: Array<{ provider: string; model: string; requests: number; successRate?: number; medianLatencyMs?: number }>;
}

export interface ApiError { error?: { message?: string; code?: string }; message?: string }
export interface PublicMetrics { githubStars: number | null; totalUsers: number | null; totalRequests: number | null; sdkWeeklyDownloads: number | null; cliWeeklyDownloads: number | null; healthyUpstreams: number | null; availableModelRoutes: number | null; status: 'operational' | 'degraded' | 'unavailable'; updatedAt: string; stale?: boolean; metricValues?: Record<string, { value: number | null; source: 'github' | 'npm' | 'd1' | 'status' | 'unavailable'; updatedAt: string | null; isPublic: boolean }>; }
export interface PublicGithub { stars: number | null; forks: number | null; openIssues: number | null; updatedAt: string | null; source: 'github' | 'unavailable'; }
export interface PublicSponsors { sponsors: string[]; currentSponsors?: string[]; specialSponsors?: string[]; source: 'd1' | 'unavailable'; }
export interface Preferences { theme: 'system' | 'light' | 'dark'; defaultModelSelector: 'auto' | 'auto:fast' | 'auto:smart' | 'auto:coding'; primaryWorkflow: string | null; onboardingCompletedAt: string | null; onboardingDismissedAt: string | null; onboardingVersion: string | null; }
