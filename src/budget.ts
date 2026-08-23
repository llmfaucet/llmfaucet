import type { Env } from './types';

const ANONYMOUS_LIMIT = 20;
const REGISTERED_LIMIT = 50;
const DAY = 86400000;

async function ipIdentity(request: Request): Promise<string> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export async function consumeBudget(request: Request, env: Env): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const token = request.headers.get('authorization')?.slice(7);
  const registered = Boolean(token && env.DB && (await env.DB.prepare('SELECT token FROM tokens WHERE token = ?').bind(token).first()));
  const id = registered ? token! : await ipIdentity(request);
  const reset = Math.ceil(Date.now() / DAY) * DAY;
  const key = `budget:${id}:${new Date(reset).toISOString().slice(0, 10)}`;
  const limit = registered ? REGISTERED_LIMIT : ANONYMOUS_LIMIT;
  if (env.DB) {
    await env.DB.prepare('INSERT INTO budgets (key, used) VALUES (?, 0) ON CONFLICT(key) DO NOTHING').bind(key).run();
    const row = await env.DB.prepare('UPDATE budgets SET used = used + 1 WHERE key = ? AND used < ? RETURNING used').bind(key, limit).first<{ used: number }>();
    const used = row?.used ?? limit;
    return { allowed: Boolean(row), remaining: row ? limit - used : 0, reset };
  }
  const used = Number(await env.BUDGETS.get(key) ?? 0);
  if (used >= limit) return { allowed: false, remaining: 0, reset };
  await env.BUDGETS.put(key, String(used + 1), { expirationTtl: 172800 });
  return { allowed: true, remaining: limit - used - 1, reset };
}
