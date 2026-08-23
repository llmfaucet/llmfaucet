import type { Env } from '../types';
import { randomString } from './crypto';
import { sessionCookie, setSessionCookie } from './sessions';
import { sponsorStatus } from './github-sponsors';
import { saveEntitlement, upsertUser } from '../state/users';

const missing = (env: Env): boolean => !env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_SESSION_SECRET;
const redirectUri = (request: Request, env: Env): string => `${env.PUBLIC_BASE_URL ?? new URL(request.url).origin}/auth/github/callback`;
async function verifierChallenge(verifier: string): Promise<string> { return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); }
export async function startGithub(request: Request, env: Env): Promise<Response> {
  if (missing(env) || !env.BUDGETS) return Response.json({ error: 'GitHub OAuth is not configured.' }, { status: 503 });
  const state = randomString(24); const verifier = randomString(48);
  await env.BUDGETS.put(`oauth:state:${state}`, JSON.stringify({ verifier, createdAt: Date.now() }), { expirationTtl: 600 });
  const params = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID!, redirect_uri: redirectUri(request, env), response_type: 'code', scope: 'read:user', state, code_challenge: await verifierChallenge(verifier), code_challenge_method: 'S256' });
  const secure = new URL(request.url).protocol === 'https:';
  const response = new Response(null, { status: 302, headers: { location: `https://github.com/login/oauth/authorize?${params}`, 'set-cookie': `llmfaucet_oauth_state=${state}; Max-Age=600; Path=/auth; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax` } });
  return response;
}
export async function githubCallback(request: Request, env: Env): Promise<Response> {
  if (missing(env) || !env.BUDGETS || !env.DB) return Response.json({ error: 'GitHub OAuth is not configured.' }, { status: 503 });
  const url = new URL(request.url); const state = url.searchParams.get('state'); const code = url.searchParams.get('code');
  const browserState = request.headers.get('cookie')?.match(/(?:^|;\s*)llmfaucet_oauth_state=([^;]+)/)?.[1];
  if (!state || !code || !browserState || browserState !== state) return Response.json({ error: 'OAuth state and code are required.' }, { status: 400 });
  const stored = await env.BUDGETS.get(`oauth:state:${state}`, 'json') as { verifier?: string } | null;
  await env.BUDGETS.delete(`oauth:state:${state}`);
  if (!stored?.verifier) return Response.json({ error: 'OAuth state is invalid or expired.' }, { status: 400 });
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: redirectUri(request, env), code_verifier: stored.verifier }) });
  const token = await tokenResponse.json() as { access_token?: string };
  if (!tokenResponse.ok || !token.access_token) return Response.json({ error: 'GitHub token exchange failed.' }, { status: 502 });
  const userResponse = await fetch('https://api.github.com/user', { headers: { authorization: `Bearer ${token.access_token}`, accept: 'application/vnd.github+json', 'user-agent': 'llmfaucet' } });
  const user = await userResponse.json() as { id?: number; login?: string; avatar_url?: string };
  if (!userResponse.ok || !user.id || !user.login) return Response.json({ error: 'GitHub identity lookup failed.' }, { status: 502 });
  const userId = await upsertUser(env, { githubId: String(user.id), login: user.login, avatarUrl: user.avatar_url });
  // Authentication remains usable when the optional Sponsors API is unavailable.
  let sponsor: Awaited<ReturnType<typeof sponsorStatus>> = null;
  let sponsorKnown = false;
  try { sponsor = await sponsorStatus(token.access_token, env); sponsorKnown = true; } catch { /* preserve the last known entitlement during an outage */ }
  if (sponsorKnown) await saveEntitlement(env, sponsor ?? { githubId: String(user.id), login: user.login, tierId: 'registered', tierName: 'registered', active: false });
  const cookie = await sessionCookie({ userId, githubLogin: user.login, exp: Date.now() + 86400000 }, env.GITHUB_SESSION_SECRET!);
  const secure = new URL(request.url).protocol === 'https:';
  const response = new Response(null, { status: 302, headers: { location: '/account', 'set-cookie': setSessionCookie(cookie, secure) } });
  response.headers.append('set-cookie', `llmfaucet_oauth_state=; Max-Age=0; Path=/auth; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax`);
  return response;
}
