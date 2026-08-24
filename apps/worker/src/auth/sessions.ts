import type { Env } from '../types';
import { hmac } from './crypto';
import { secureRandomHex } from '../lib/crypto';
import { parseTimestamp } from '../lib/crypto';

export type Session = { userId: string; githubLogin: string; exp: number; tokenHash?: string };
const rawCookie = (request: Request): string | null => request.headers.get('cookie')?.match(/(?:^|;\s*)llmfaucet_session=([^;]+)/)?.[1] ?? null;
export function setSessionCookie(value: string, secure = true): string { return `llmfaucet_session=${value}; Max-Age=604800; Path=/; HttpOnly;${secure ? ' Secure; SameSite=None' : ' SameSite=Lax'}`; }
export async function createSession(env: Env, userId: string, githubLogin: string): Promise<string> {
  if (!env.DB || !env.SESSION_HMAC_SECRET) throw new Error('Session service is not configured');
  const token = secureRandomHex(32); const tokenHash = await hmac(env.SESSION_HMAC_SECRET, token); const expires = new Date(Date.now() + 604800000).toISOString();
  await env.DB.prepare('INSERT INTO sessions (id, user_id, session_hash, expires_at) VALUES (?, ?, ?, ?)').bind(`session_${secureRandomHex(12)}`, userId, tokenHash, expires).run();
  await env.BUDGETS.put(`session:${tokenHash}`, JSON.stringify({ userId, githubLogin, exp: Date.parse(expires) }), { expirationTtl: 604800 });
  const index = await env.BUDGETS.get<string[]>(`user:session-hashes:${userId}`, 'json') ?? [];
  if (!index.includes(tokenHash)) await env.BUDGETS.put(`user:session-hashes:${userId}`, JSON.stringify([...index, tokenHash]), { expirationTtl: 604800 });
  return token;
}
export async function readSession(request: Request, env: Env): Promise<Session | null> {
  const raw = rawCookie(request); if (!raw) return null;
  const tokenHash = env.SESSION_HMAC_SECRET ? await hmac(env.SESSION_HMAC_SECRET, raw) : null;
  if (!env.DB) return null;
  const row = tokenHash ? await env.DB.prepare("SELECT s.user_id, s.expires_at, u.github_login FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.session_hash = ? AND s.revoked_at IS NULL AND u.status = 'active' LIMIT 1").bind(tokenHash).first<{ user_id: string; expires_at: string; github_login: string }>() : null;
  const expiresAt = parseTimestamp(row?.expires_at);
  if (!row || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  if (!tokenHash) return null;
  const cached = await env.BUDGETS.get<Session>(`session:${tokenHash}`, 'json');
  if (cached && cached.exp > Date.now()) return { ...cached, tokenHash };
  const session = { userId: row.user_id, githubLogin: row.github_login, exp: expiresAt, tokenHash };
  await env.BUDGETS.put(`session:${tokenHash}`, JSON.stringify(session), { expirationTtl: Math.max(1, Math.ceil((session.exp - Date.now()) / 1000)) }); return session;
}
export async function revokeSession(request: Request, env: Env): Promise<void> { const raw = rawCookie(request); if (!raw || !env.SESSION_HMAC_SECRET) return; const tokenHash = await hmac(env.SESSION_HMAC_SECRET, raw); await env.BUDGETS.delete(`session:${tokenHash}`); if (env.DB) await env.DB.prepare('UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE session_hash = ?').bind(tokenHash).run(); }
export async function invalidateUserSessions(env: Env, userId: string): Promise<void> { const hashes = await env.BUDGETS.get<string[]>(`user:session-hashes:${userId}`, 'json') ?? []; await Promise.all(hashes.map((hash) => env.BUDGETS.delete(`session:${hash}`))); await env.BUDGETS.delete(`user:session-hashes:${userId}`); }
