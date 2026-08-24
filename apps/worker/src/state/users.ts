import type { Env } from '../types';
import { entitlementFor, planForTier } from '../sponsors/entitlements';
import { parseTimestamp } from '../lib/crypto';

async function invalidateUserKeys(env: Env, userId: string): Promise<void> { if (!env.BUDGETS) return; const hashes = await env.BUDGETS.get<string[]>(`user:key-hashes:${userId}`, 'json') ?? []; await Promise.all(hashes.map((hash) => env.BUDGETS.delete(`auth:key:${hash}`))); await env.BUDGETS.delete(`user:key-hashes:${userId}`); }

export async function upsertUser(env: Env, user: { githubId: string; login: string; avatarUrl?: string }): Promise<string> {
  if (!env.DB) throw new Error('D1 is required for accounts');
  const id = `github:${user.githubId}`;
  await env.DB.prepare('INSERT INTO users (id, github_id, github_login, avatar_url) VALUES (?, ?, ?, ?) ON CONFLICT(github_id) DO UPDATE SET github_login = excluded.github_login, avatar_url = excluded.avatar_url, updated_at = CURRENT_TIMESTAMP').bind(id, user.githubId, user.login, user.avatarUrl ?? null).run();
  await env.DB.prepare("INSERT INTO entitlements (user_id, plan, requests_per_day, queue_priority, sponsorship_status) VALUES (?, 'registered', 50, 10, 'none') ON CONFLICT(user_id) DO NOTHING").bind(id).run();
  const storedSponsor = await env.DB.prepare('SELECT tier_id, tier_name, status, expires_at FROM sponsor_entitlements WHERE github_id = ?').bind(user.githubId).first<{ tier_id?: string; tier_name?: string; status?: string; expires_at?: string | null }>();
  if (storedSponsor?.status === 'active' && Number.isFinite(parseTimestamp(storedSponsor.expires_at)) && parseTimestamp(storedSponsor.expires_at) > Date.now()) {
    const plan = planForTier(storedSponsor.tier_name, storedSponsor.tier_id, env); const limits = entitlementFor(plan);
    await env.DB.prepare("UPDATE entitlements SET plan=?, requests_per_day=?, queue_priority=?, sponsorship_status='active', github_tier_id=?, github_tier_name=?, expires_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND plan='registered'").bind(plan, limits.requestsPerDay, limits.queuePriority, storedSponsor.tier_id ?? null, storedSponsor.tier_name ?? null, id).run();
  }
  return id;
}
export async function saveEntitlement(env: Env, sponsor: { githubId: string; login: string; tierId: string; tierName: string; active: boolean }): Promise<void> {
  if (!env.DB) throw new Error('D1 is required for accounts');
  const userId = `github:${sponsor.githubId}`;
  const existing = await env.DB.prepare('SELECT plan, expires_at FROM entitlements WHERE user_id = ?').bind(userId).first<{ plan?: string; expires_at?: string | null }>();
  const earlyTesterActive = existing?.plan === 'early_tester' && Number.isFinite(parseTimestamp(existing.expires_at)) && parseTimestamp(existing.expires_at) > Date.now();
  const sponsorPlan = sponsor.active ? planForTier(sponsor.tierName, sponsor.tierId, env) : 'registered';
  const plan = earlyTesterActive ? 'early_tester' : sponsorPlan;
  const sponsorLimits = entitlementFor(sponsorPlan);
  const limits = entitlementFor(plan);
  const sponsorExpiresAt = sponsor.active ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;
  await env.DB.prepare('INSERT INTO sponsor_entitlements (github_id, github_login, tier_id, tier_name, status, requests_per_day, queue_priority, sponsorship_updated_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(github_id) DO UPDATE SET github_login = excluded.github_login, tier_id = excluded.tier_id, tier_name = excluded.tier_name, status = excluded.status, requests_per_day = excluded.requests_per_day, queue_priority = excluded.queue_priority, sponsorship_updated_at = excluded.sponsorship_updated_at, expires_at = excluded.expires_at, updated_at = CURRENT_TIMESTAMP').bind(sponsor.githubId, sponsor.login, sponsor.tierId, sponsor.tierName, sponsor.active ? 'active' : 'registered', sponsorLimits.requestsPerDay, sponsorLimits.queuePriority, new Date().toISOString(), sponsorExpiresAt).run();
  if (!existing) return;
  await env.DB.prepare('INSERT INTO entitlements (user_id, plan, requests_per_day, queue_priority, sponsorable_login, github_tier_id, github_tier_name, sponsorship_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET plan = excluded.plan, requests_per_day = excluded.requests_per_day, queue_priority = excluded.queue_priority, sponsorable_login = excluded.sponsorable_login, github_tier_id = excluded.github_tier_id, github_tier_name = excluded.github_tier_name, sponsorship_status = excluded.sponsorship_status, updated_at = CURRENT_TIMESTAMP').bind(userId, plan, limits.requestsPerDay, limits.queuePriority, env.GITHUB_SPONSORABLE_LOGIN ?? env.GITHUB_SPONSOR_LOGIN ?? 'justinedevs', sponsor.tierId, sponsor.tierName, sponsor.active ? 'active' : 'none').run();
  await invalidateUserKeys(env, userId);
}
