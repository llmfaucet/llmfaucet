import type { Env } from '../types';
import { parseTimestamp } from './crypto';

export interface MetricValue { value: number | null; source: 'github' | 'npm' | 'd1' | 'status' | 'unavailable'; updatedAt: string | null; isPublic: boolean; }

function healthTimestamp(value: { checked_at?: number | string } | null): number {
  return parseTimestamp(value?.checked_at);
}
export interface PublicMetrics { githubStars: number | null; totalUsers: number | null; totalRequests: number | null; sdkWeeklyDownloads: number | null; cliWeeklyDownloads: number | null; healthyUpstreams: number | null; availableModelRoutes: number | null; status: 'operational' | 'degraded' | 'unavailable'; updatedAt: string; stale?: boolean; metricValues: Record<'githubStars' | 'totalUsers' | 'totalRequests' | 'sdkWeeklyDownloads' | 'cliWeeklyDownloads' | 'healthyUpstreams' | 'availableModelRoutes', MetricValue>; }
export interface GithubRepositoryMetrics { stars: number | null; forks: number | null; openIssues: number | null; updatedAt: string | null; source: 'github' | 'unavailable'; stale?: boolean; }

const repoName = (env: Env) => env.GITHUB_PUBLIC_REPOSITORY ?? 'llmfaucet/llmfaucet';
const githubHeaders = (env: Env): HeadersInit => ({ accept: 'application/vnd.github+json', 'user-agent': 'llmfaucet-public-metrics', ...(env.GITHUB_PUBLIC_READ_TOKEN ? { authorization: `Bearer ${env.GITHUB_PUBLIC_READ_TOKEN}` } : {}) });

export async function githubRepository(env: Env): Promise<GithubRepositoryMetrics> {
  const key = 'public:github:repository';
  const cached = await env.BUDGETS.get<GithubRepositoryMetrics>(key, 'json');
  if (cached && Number.isFinite(parseTimestamp(cached.updatedAt)) && Date.now() - parseTimestamp(cached.updatedAt) < 3600000) return cached;
  try {
    const response = await fetch(`https://api.github.com/repos/${repoName(env)}`, { headers: githubHeaders(env) });
    if (!response.ok) throw new Error(`github:${response.status}`);
    const body = await response.json() as { stargazers_count?: number; forks_count?: number; open_issues_count?: number };
    const value: GithubRepositoryMetrics = { stars: body.stargazers_count ?? null, forks: body.forks_count ?? null, openIssues: body.open_issues_count ?? null, updatedAt: new Date().toISOString(), source: 'github' };
    await env.BUDGETS.put(key, JSON.stringify(value), { expirationTtl: 3600 });
    return value;
  } catch {
    return cached ? { ...cached, stale: true } : { stars: null, forks: null, openIssues: null, updatedAt: null, source: 'unavailable' };
  }
}

async function npmDownloads(env: Env, pkg: string | undefined): Promise<number | null> {
  if (!pkg) return null;
  try { const response = await fetch(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(pkg)}`); if (!response.ok) return null; const body = await response.json() as { downloads?: number }; return typeof body.downloads === 'number' ? body.downloads : null; } catch { return null; }
}

export async function publicMetrics(env: Env, status: { providers?: string[]; models?: Array<{ provider: string }> }): Promise<PublicMetrics> {
  const cached = await env.BUDGETS.get<PublicMetrics>('public:metrics', 'json');
  if (cached && Number.isFinite(parseTimestamp(cached.updatedAt)) && Date.now() - parseTimestamp(cached.updatedAt) < 900000) return cached;
  try {
    const github = await githubRepository(env);
    const aggregates = env.DB && env.PUBLIC_METRICS_INCLUDE_AGGREGATES === 'true' ? await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS count FROM users').first<{ count: number }>(),
      env.DB.prepare('SELECT COUNT(*) AS count FROM request_logs').first<{ count: number }>(),
    ]) : [null, null];
    const totalUsers = aggregates[0]?.count ?? null;
    const totalRequests = aggregates[1]?.count ?? null;
    const [sdkWeeklyDownloads, cliWeeklyDownloads] = await Promise.all([npmDownloads(env, env.SDK_NPM_PACKAGE), npmDownloads(env, env.CLI_NPM_PACKAGE)]);
    const health = await Promise.all((status.providers ?? []).map(async provider => env.BUDGETS.get<{ status?: string; checked_at?: number | string }>(`health:${provider}`, 'json')));
    const healthTimes = health.map(healthTimestamp).filter(Number.isFinite);
    const healthUpdatedAt = healthTimes.length ? new Date(Math.max(...healthTimes)).toISOString() : null;
    const healthStale = (healthTimes.length !== (status.providers ?? []).length) || healthTimes.some(value => value > Date.now() || Date.now() - value > 15 * 60 * 1000);
    const freshHealth = health.map(value => { const timestamp = healthTimestamp(value); return Number.isFinite(timestamp) && timestamp <= Date.now() && Date.now() - timestamp <= 15 * 60 * 1000 ? value : undefined; });
    const healthyUpstreams = status.providers && freshHealth.some(value => value?.status === 'healthy' || value?.status === 'degraded') ? freshHealth.filter(value => value?.status === 'healthy').length : null;
    const knownHealth = freshHealth.filter(value => value?.status === 'healthy' || value?.status === 'degraded').length;
    const availableModelRoutes = Array.isArray(status.models) && knownHealth > 0 ? status.models.filter(model => { const index = (status.providers ?? []).indexOf(model.provider); const healthStatus = index >= 0 ? freshHealth[index]?.status : undefined; return healthStatus === 'healthy' || healthStatus === 'degraded'; }).length : null;
    const values = [github.stars, healthyUpstreams, availableModelRoutes].filter((value): value is number => value !== null);
    const healthStatus = status.providers?.length ? (knownHealth === 0 ? 'unavailable' : knownHealth < status.providers.length || freshHealth.some(value => value?.status === 'degraded') ? 'degraded' : 'operational') : values.length > 0 ? 'operational' : 'unavailable';
    const updatedAt = new Date().toISOString();
    const metric = (value: number | null, source: MetricValue['source'], timestamp: string | null = updatedAt): MetricValue => ({ value, source, updatedAt: timestamp, isPublic: value !== null });
    const result: PublicMetrics = { githubStars: github.stars, totalUsers, totalRequests, sdkWeeklyDownloads, cliWeeklyDownloads, healthyUpstreams, availableModelRoutes, status: healthStatus, updatedAt, stale: github.stale === true || healthStale, metricValues: {
      githubStars: metric(github.stars, github.source, github.updatedAt),
      totalUsers: metric(totalUsers, totalUsers === null ? 'unavailable' : 'd1'),
      totalRequests: metric(totalRequests, totalRequests === null ? 'unavailable' : 'd1'),
      sdkWeeklyDownloads: metric(sdkWeeklyDownloads, sdkWeeklyDownloads === null ? 'unavailable' : 'npm'),
      cliWeeklyDownloads: metric(cliWeeklyDownloads, cliWeeklyDownloads === null ? 'unavailable' : 'npm'),
      healthyUpstreams: metric(healthyUpstreams, status.providers?.length ? 'status' : 'unavailable', healthUpdatedAt),
      availableModelRoutes: metric(availableModelRoutes, status.providers?.length ? 'status' : 'unavailable', healthUpdatedAt),
    } };
    await env.BUDGETS.put('public:metrics', JSON.stringify(result), { expirationTtl: 900 });
    return result;
  } catch { return cached ? { ...cached, stale: true } : { githubStars: null, totalUsers: null, totalRequests: null, sdkWeeklyDownloads: null, cliWeeklyDownloads: null, healthyUpstreams: null, availableModelRoutes: null, status: 'unavailable', updatedAt: new Date().toISOString(), metricValues: {
    githubStars: { value: null, source: 'unavailable', updatedAt: null, isPublic: false },
    totalUsers: { value: null, source: 'unavailable', updatedAt: null, isPublic: false },
    totalRequests: { value: null, source: 'unavailable', updatedAt: null, isPublic: false },
    sdkWeeklyDownloads: { value: null, source: 'unavailable', updatedAt: null, isPublic: false },
    cliWeeklyDownloads: { value: null, source: 'unavailable', updatedAt: null, isPublic: false },
    healthyUpstreams: { value: null, source: 'unavailable', updatedAt: null, isPublic: false },
    availableModelRoutes: { value: null, source: 'unavailable', updatedAt: null, isPublic: false },
  } }; }
}
