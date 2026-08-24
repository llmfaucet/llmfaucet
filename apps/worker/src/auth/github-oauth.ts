import type { Env } from '../types';
import { hmac, randomString } from './crypto';
import { createSession, setSessionCookie } from './sessions';
import { sponsorStatus } from './github-sponsors';
import { saveEntitlement, upsertUser } from '../state/users';

const missing = (env: Env): boolean => !env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.OAUTH_STATE_SECRET || !env.SESSION_HMAC_SECRET;
// OAuth callbacks must target the deployed Worker host. PUBLIC_BASE_URL is a browser-origin allowlist, not the API host.
const redirectUri = (request: Request, _env: Env): string => `${new URL(request.url).origin}/auth/github/callback`;
const frontendRedirect = (env: Env, path: string): string => { const origin = env.PUBLIC_FRONTEND_URL ?? (env.PUBLIC_WEB_ORIGINS ?? '').split(',').map(value => value.trim()).find(Boolean); return origin ? `${origin.replace(/\/$/, '')}${path}` : path; };
const allowedReturnTo = (env: Env, value: string | undefined): boolean => {
  if (!value) return false;
  try {
    const url = new URL(value);
    const origins = [env.PUBLIC_FRONTEND_URL, ...(env.PUBLIC_WEB_ORIGINS ?? '').split(',')]
      .filter((origin): origin is string => Boolean(origin))
      .map((origin) => new URL(origin).origin);
    if (origins.includes(url.origin)) return true;
    return env.ENVIRONMENT === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url.origin);
  } catch { return false; }
};
async function verifierChallenge(verifier: string): Promise<string> { return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); }
export async function startGithub(request: Request, env: Env): Promise<Response> {
  if (missing(env) || !env.BUDGETS) return Response.json({ error: 'GitHub OAuth is not configured.' }, { status: 503 });
  const state = await hmac(env.OAUTH_STATE_SECRET!, randomString(24)); const verifier = randomString(48);
  const requestedReturnTo = new URL(request.url).searchParams.get('returnTo');
  const returnTo = frontendRedirect(env, requestedReturnTo && requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//') ? requestedReturnTo : '/dashboard');
  await env.BUDGETS.put(`oauth:state:${state}`, JSON.stringify({ verifier, returnTo, redirectUri: redirectUri(request, env), createdAt: Date.now() }), { expirationTtl: 600 });
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
  const stored = await env.BUDGETS.get(`oauth:state:${state}`, 'json') as { verifier?: string; returnTo?: string; redirectUri?: string } | null;
  await env.BUDGETS.delete(`oauth:state:${state}`);
  if (!stored?.verifier) return Response.json({ error: 'OAuth state is invalid or expired.' }, { status: 400 });
  const callbackUri = stored.redirectUri ?? redirectUri(request, env);
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' }, body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: callbackUri, code_verifier: stored.verifier }) });
  const token = await tokenResponse.json() as { access_token?: string };
  if (!tokenResponse.ok || !token.access_token) return Response.json({ error: 'GitHub token exchange failed.' }, { status: 502 });
  const userResponse = await fetch('https://api.github.com/user', { headers: { authorization: `Bearer ${token.access_token}`, accept: 'application/vnd.github+json', 'user-agent': 'llmfaucet' } });
  const user = await userResponse.json() as { id?: number; login?: string; avatar_url?: string };
  if (!userResponse.ok || !user.id || !user.login) return Response.json({ error: 'GitHub identity lookup failed.' }, { status: 502 });
  const userId = await upsertUser(env, { githubId: String(user.id), login: user.login, avatarUrl: user.avatar_url });
  // Authentication remains usable when the optional Sponsors API is unavailable.
  let sponsor: Awaited<ReturnType<typeof sponsorStatus>> = null;
  let sponsorKnown = false;
  try { sponsor = await sponsorStatus(token.access_token, env); sponsorKnown = true; } catch { /* keep the last verified sponsor plan for its bounded verification window */ }
  if (sponsorKnown) await saveEntitlement(env, sponsor ?? { githubId: String(user.id), login: user.login, tierId: 'registered', tierName: 'registered', active: false });
  const cookie = await createSession(env, userId, user.login);
  const secure = new URL(request.url).protocol === 'https:';
  const returnTo = allowedReturnTo(env, stored.returnTo) ? stored.returnTo! : frontendRedirect(env, '/dashboard');
  const response = new Response(null, { status: 302, headers: { location: returnTo, 'set-cookie': setSessionCookie(cookie, secure) } });
  response.headers.append('set-cookie', `llmfaucet_oauth_state=; Max-Age=0; Path=/auth; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax`);
  return response;
}
