import type { Env } from '../types';
import { PLAN_LIMITS, effectiveDailyLimit, planLimits, type Plan } from '../config';
import { hmacSha256, parseTimestamp, sha256, utcDay } from '../lib/crypto';
import { entitlementFor, planForTier } from '../sponsors/entitlements';
import { API_KEY_PATTERN } from './api-keys';
export interface AccessContext { subject: string; userId: string | null; keyId: string | null; plan: Plan; requestsPerDay: number; queuePriority: number; isAnonymous: boolean; expiresAt?: string | null; sponsorExpiresAt?: string | null; }
export async function resolveAnonymousSubject(request: Request, secret: string, now = new Date()): Promise<string> { const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'; return `anonymous:${await hmacSha256(secret, ip === 'unknown' ? `unknown:${utcDay(now)}` : `anonymous-ip:v1:${utcDay(now)}:${ip}`)}`; }
const token = (request: Request): string | undefined => /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') ?? '')?.[1];
export async function resolveAccessContext(request: Request, env: Env, now = new Date()): Promise<AccessContext> {
  const raw = token(request);
  if (!raw || raw === 'free') {
    const secret = env.IP_HASH_SECRET ?? (env.ENVIRONMENT === 'development' ? env.BUDGET_HASH_SECRET ?? 'development-only-ip-secret' : undefined);
    if (!secret) throw new Error('ip_hash_secret_missing');
    const subject = await resolveAnonymousSubject(request, secret, now);
    const limits = planLimits(env as unknown as Record<string, string | undefined>, 'anonymous');
    return { subject, userId: null, keyId: null, plan: 'anonymous', requestsPerDay: limits.daily, queuePriority: limits.priority, isAnonymous: true };
  }
  if (!API_KEY_PATTERN.test(raw)) throw new Error('invalid_api_key');
  const hash = await sha256(raw); const cacheKey = `auth:key:${hash}`;
  const cached = await env.BUDGETS.get<AccessContext>(cacheKey, 'json');
  const cachedExpired = cached && ((cached.plan === 'early_tester' && (!Number.isFinite(parseTimestamp(cached.expiresAt)) || parseTimestamp(cached.expiresAt) <= now.getTime())) || ((cached.plan === 'supporter' || cached.plan === 'pro') && Number.isFinite(parseTimestamp(cached.sponsorExpiresAt)) && parseTimestamp(cached.sponsorExpiresAt) <= now.getTime()));
  if (cached && PLAN_LIMITS[cached.plan] && !cachedExpired) return { ...cached, requestsPerDay: effectiveDailyLimit(env as unknown as Record<string, string | undefined>, cached.plan, cached.requestsPerDay) };
  if (!env.DB) throw new Error('authentication_unavailable');
  const row = await env.DB.prepare("SELECT k.id AS key_id,k.user_id,u.status AS user_status,u.github_id,COALESCE(e.plan,'registered') AS plan,COALESCE(e.requests_per_day,50) AS requests_per_day,COALESCE(e.queue_priority,10) AS queue_priority,e.expires_at,se.status AS sponsor_status,se.expires_at AS sponsor_expires_at,se.updated_at AS sponsor_updated_at,se.tier_id AS sponsor_tier_id,se.tier_name AS sponsor_tier_name FROM api_keys k JOIN users u ON u.id=k.user_id LEFT JOIN entitlements e ON e.user_id=k.user_id LEFT JOIN sponsor_entitlements se ON se.github_id=u.github_id WHERE k.key_hash=? AND k.status='active'").bind(hash).first<{ key_id: string; user_id: string; user_status: string; github_id: string; plan: Plan; requests_per_day: number; queue_priority: number; expires_at: string | null; sponsor_status?: string | null; sponsor_expires_at?: string | null; sponsor_updated_at?: string | null; sponsor_tier_id?: string | null; sponsor_tier_name?: string | null }>();
  if (!row || row.user_status !== 'active' || !PLAN_LIMITS[row.plan]) throw new Error(row?.user_status === 'suspended' ? 'account_suspended' : 'invalid_api_key');
  const expiresAt = parseTimestamp(row.expires_at);
  const sponsorUpdatedAt = parseTimestamp(row.sponsor_updated_at);
  const sponsorExpiresAt = parseTimestamp(row.sponsor_expires_at);
  const sponsorFresh = row.sponsor_status === 'active' && ((Number.isFinite(sponsorExpiresAt) && sponsorExpiresAt > now.getTime()) || (!Number.isFinite(sponsorExpiresAt) && Number.isFinite(sponsorUpdatedAt) && sponsorUpdatedAt + 86400000 > now.getTime()));
  const sponsorPlan = sponsorFresh ? planForTier(row.sponsor_tier_name, row.sponsor_tier_id, env) : 'registered';
  if ((row.plan === 'early_tester' && (!Number.isFinite(expiresAt) || expiresAt <= now.getTime())) || ((row.plan === 'supporter' || row.plan === 'pro') && !sponsorFresh)) {
    const restored = row.plan === 'early_tester' ? sponsorPlan : 'registered';
    const restoredLimits = entitlementFor(restored);
    await env.DB.prepare("UPDATE entitlements SET plan=?, requests_per_day=?, queue_priority=?, sponsorship_status=?, expires_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(restored, restoredLimits.requestsPerDay, restoredLimits.queuePriority, restored === 'registered' ? 'none' : 'active', row.user_id).run();
    row.plan = restored; row.requests_per_day = restoredLimits.requestsPerDay; row.queue_priority = restoredLimits.queuePriority;
  }
  const context: AccessContext = { subject: `user:${row.user_id}`, userId: row.user_id, keyId: row.key_id, plan: row.plan, requestsPerDay: effectiveDailyLimit(env as unknown as Record<string, string | undefined>, row.plan, row.requests_per_day), queuePriority: row.queue_priority, isAnonymous: false, expiresAt: row.expires_at, sponsorExpiresAt: row.sponsor_expires_at };
  const hashes = await env.BUDGETS.get<string[]>(`user:key-hashes:${row.user_id}`, 'json') ?? [];
  if (!hashes.includes(hash)) await env.BUDGETS.put(`user:key-hashes:${row.user_id}`, JSON.stringify([...hashes, hash]), { expirationTtl: 900 });
  await env.BUDGETS.put(cacheKey, JSON.stringify(context), { expirationTtl: 600 });
  void env.DB.prepare('UPDATE api_keys SET last_used_at=CURRENT_TIMESTAMP WHERE id=?').bind(row.key_id).run().catch(() => undefined);
  return context;
}
export async function invalidateUserKeyCaches(env: Env, userId: string): Promise<void> { const index = await env.BUDGETS.get<string[]>(`user:key-hashes:${userId}`, 'json') ?? []; await Promise.all(index.map((hash) => env.BUDGETS.delete(`auth:key:${hash}`))); await env.BUDGETS.delete(`user:key-hashes:${userId}`); }
