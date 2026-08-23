import type { Env } from '../types';
import { constantTimeEqual, hmac } from './crypto';

type Session = { userId: string; githubLogin: string; exp: number };
export async function sessionCookie(session: Session, secret: string): Promise<string> { const payload = btoa(JSON.stringify(session)).replace(/=+$/g, ''); return `${payload}.${await hmac(secret, payload)}`; }
export async function readSession(request: Request, env: Env): Promise<Session | null> {
  if (!env.GITHUB_SESSION_SECRET) return null;
  const raw = request.headers.get('cookie')?.match(/(?:^|;\s*)llmfaucet_session=([^;]+)/)?.[1];
  if (!raw) return null;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature || !(await constantTimeEqual(signature, await hmac(env.GITHUB_SESSION_SECRET, payload)))) return null;
  try { const value = JSON.parse(atob(payload)) as Session; return value.exp > Date.now() ? value : null; } catch { return null; }
}
export function setSessionCookie(value: string, secure = true): string { return `llmfaucet_session=${value}; Max-Age=86400; Path=/; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax`; }
