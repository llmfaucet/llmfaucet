import type { Env } from './types';

const ANONYMOUS_LIMIT = 20;
const REGISTERED_LIMIT = 50;
const DAY = 86400000;

async function ipIdentity(request: Request, env: Env): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const secret = env.BUDGET_HASH_SECRET;
  if (secret) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
    return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  // ponytail: deterministic fallback for local/dev bindings; configure the HMAC secret in production.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

async function opaqueIdentity(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function bearer(request: Request): string | undefined {
  const value = request.headers.get('authorization') ?? '';
  return /^Bearer\s+(.+)$/i.exec(value)?.[1];
}

export async function consumeBudget(request: Request, env: Env): Promise<{ allowed: boolean; remaining: number; reset: number; registered: boolean; priority: number; invalidKey: boolean }> {
  const token = bearer(request);
  let registered = false;
  let limit = ANONYMOUS_LIMIT;
  let priority = 0;
  let invalidKey = Boolean(token && token !== 'free');
  if (token && env.DB) {
    const apiKeysTable = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'api_keys'").first<{ name: string }>();
    if (apiKeysTable) {
      const keyHash = await opaqueIdentity(token);
      const sponsor = await env.DB.prepare('SELECT k.id, COALESCE(s.requests_per_day, 50) AS requests_per_day, COALESCE(s.queue_priority, 10) AS queue_priority FROM api_keys k JOIN users u ON u.id = k.user_id LEFT JOIN sponsor_entitlements s ON s.github_id = u.github_id AND s.status = \'active\' WHERE k.key_hash = ? AND k.status = \'active\'').bind(keyHash).first<{ requests_per_day: number; queue_priority: number }>();
      if (sponsor) { registered = true; invalidKey = false; limit = sponsor.requests_per_day; priority = sponsor.queue_priority; }
    }
    if (!registered && (await env.DB.prepare('SELECT token FROM tokens WHERE token = ?').bind(token).first())) { registered = true; limit = REGISTERED_LIMIT; priority = 10; }
    if (registered) invalidKey = false;
  }
  const reset = Math.ceil(Date.now() / DAY) * DAY;
  if (invalidKey) return { allowed: false, remaining: 0, reset, registered: false, priority: 0, invalidKey: true };
  const id = registered ? await opaqueIdentity(`token:${token}`) : await ipIdentity(request, env);
  const key = `budget:${id}:${new Date(reset).toISOString().slice(0, 10)}`;
  if (env.DB) {
    await env.DB.prepare('INSERT INTO budgets (key, used) VALUES (?, 0) ON CONFLICT(key) DO NOTHING').bind(key).run();
    const row = await env.DB.prepare('UPDATE budgets SET used = used + 1 WHERE key = ? AND used < ? RETURNING used').bind(key, limit).first<{ used: number }>();
    const used = row?.used ?? limit;
    return { allowed: Boolean(row), remaining: row ? limit - used : 0, reset, registered, priority, invalidKey };
  }
  const used = Number(await env.BUDGETS.get(key) ?? 0);
  if (used >= limit) return { allowed: false, remaining: 0, reset, registered, priority, invalidKey };
  await env.BUDGETS.put(key, String(used + 1), { expirationTtl: 172800 });
  return { allowed: true, remaining: limit - used - 1, reset, registered, priority, invalidKey };
}
