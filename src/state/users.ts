import type { Env } from '../types';
import { entitlementFor } from '../sponsors/entitlements';

export async function upsertUser(env: Env, user: { githubId: string; login: string; avatarUrl?: string }): Promise<string> {
  if (!env.DB) throw new Error('D1 is required for accounts');
  const id = `github:${user.githubId}`;
  await env.DB.prepare('INSERT INTO users (id, github_id, github_login, avatar_url) VALUES (?, ?, ?, ?) ON CONFLICT(github_id) DO UPDATE SET github_login = excluded.github_login, avatar_url = excluded.avatar_url, updated_at = CURRENT_TIMESTAMP').bind(id, user.githubId, user.login, user.avatarUrl ?? null).run();
  return id;
}
export async function saveEntitlement(env: Env, sponsor: { githubId: string; login: string; tierId: string; tierName: string; active: boolean }): Promise<void> {
  if (!env.DB) throw new Error('D1 is required for accounts');
  const tier = entitlementFor(sponsor.tierName.toLowerCase());
  await env.DB.prepare('INSERT INTO sponsor_entitlements (github_id, github_login, tier_id, tier_name, status, requests_per_day, queue_priority, sponsorship_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(github_id) DO UPDATE SET github_login = excluded.github_login, tier_id = excluded.tier_id, tier_name = excluded.tier_name, status = excluded.status, requests_per_day = excluded.requests_per_day, queue_priority = excluded.queue_priority, sponsorship_updated_at = excluded.sponsorship_updated_at, updated_at = CURRENT_TIMESTAMP').bind(sponsor.githubId, sponsor.login, sponsor.tierId, sponsor.tierName, sponsor.active ? 'active' : 'registered', tier.requestsPerDay, tier.queuePriority, new Date().toISOString()).run();
}
