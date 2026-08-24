import { MODELS } from "./catalog";
import {
  anthropicModels,
  anthropicRequest,
  anthropicResponse,
  anthropicStream,
  embeddingRequest,
  embeddingResponse,
  legacyRequest,
  legacyResponse,
  openAIRequest,
  responsesRequest,
  responsesResponse,
  responsesStream,
} from "./formats";
import { anthropicError, error, responseHeaders } from "./headers";
import { callProvider } from "./providers";
import { capabilityError, selectModel, supportsRequest } from "./router";
import type { Env, NormalizedRequest } from "./types";
import {
  catalog,
  unhealthyProviders,
  recordRequest,
  scheduledMaintenance,
} from "./state";
import { probeProviders, refreshCatalog } from "./probe";
import { githubCallback, startGithub } from "./auth/github-oauth";
import { readSession, revokeSession, invalidateUserSessions } from "./auth/sessions";
import { generateApiKey, hashApiKey, keyPrefix } from "./sponsors/keys";
import { sponsorWebhook } from "./sponsors/webhook";
import { resolveAccessContext } from './auth/verify';
import { PLAN_LIMITS, effectiveDailyLimit, planLimits, type Plan } from './config';
import { hmacSha256, parseTimestamp, sha256 } from './lib/crypto';
import { invalidateUserKeyCaches } from './auth/verify';
import { adminUpdate, adminWaitlist, adminWaitlistDetail, approveWaitlist, createPreviewKey, revokeWaitlist, submitWaitlist, waitlistCsrfAllowed, waitlistMe } from './waitlist';
import { githubRepository, publicMetrics } from './lib/public-metrics';
import { onboardingAction, preferences, updatePreferences } from './preferences';
import { entitlementFor, planForTier } from './sponsors/entitlements';
export { QuotaLimiter } from './durable/quota-limiter';

const MAX_REQUEST_BYTES = 1_048_576;
async function readBoundedBody(request: Request): Promise<{ text: string; tooLarge: boolean }> {
  const reader = request.body?.getReader();
  if (!reader) return { text: '', tooLarge: false };
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    total += next.value.byteLength;
    if (total > MAX_REQUEST_BYTES) {
      await reader.cancel();
      return { text: '', tooLarge: true };
    }
    chunks.push(next.value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return { text: new TextDecoder().decode(bytes), tooLarge: false };
}

const headerObject = (headers?: Headers): Record<string, string> => {
  const out: Record<string, string> = {};
  headers?.forEach((value, key) => {
    out[key] = value;
  });
  return out;
};
const userSubject = (userId: string): string => `user:${userId}`;
const json = (data: unknown, status = 200, headers?: Headers): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: new Headers({
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      ...headerObject(headers),
    }),
  });
const accountJson = (request: Request, env: Env, data: unknown, status = 200, headers?: Headers): Response => {
  const response = json(data, status, headers);
  const origin = request.headers.get('origin');
  const expected = allowedOrigin(request, env);
  if (expected) { response.headers.set('access-control-allow-origin', expected); response.headers.set('access-control-allow-credentials', 'true'); response.headers.set('vary', 'Origin'); } else response.headers.delete('access-control-allow-origin');
  return response;
};
const allowedOrigin = (request: Request, env: Env): string | undefined => { const origin = request.headers.get('origin'); if (!origin) return undefined; const configured = [env.PUBLIC_BASE_URL, ...(env.PUBLIC_WEB_ORIGINS ?? '').split(',')].filter((value): value is string => Boolean(value)).map(value => { try { return new URL(value).origin; } catch { return undefined; } }); return configured.includes(origin) ? origin : undefined; };
const csrfAllowed = (request: Request, env: Env): boolean => {
  return Boolean(allowedOrigin(request, env));
};
const credentialCors = (request: Request, env: Env): Record<string, string> => {
  const origin = allowedOrigin(request, env);
  return origin ? { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', vary: 'Origin' } : {};
};
const accountError = (request: Request, env: Env, message: string, status = 401): Response => {
  const response = error(message, status);
  for (const [key, value] of Object.entries(credentialCors(request, env))) response.headers.set(key, value);
  return response;
};
const accountResponse = (request: Request, env: Env, response: Response): Response => {
  const origin = allowedOrigin(request, env);
  if (origin) { response.headers.set('access-control-allow-origin', origin); response.headers.set('access-control-allow-credentials', 'true'); response.headers.set('vary', 'Origin'); }
  return response;
};
const account = async (request: Request, env: Env): Promise<Response> => {
  const session = await readSession(request, env);
  if (!session || !env.DB)
    return accountError(request, env, "A valid account session is required.", 401);
  const user = await env.DB.prepare(
    "SELECT github_id, github_login, avatar_url FROM users WHERE id = ?",
  )
    .bind(session.userId)
    .first<{ github_id: string; github_login: string; avatar_url: string | null }>();
      const entitlement = await env.DB.prepare(
    "SELECT e.plan, e.sponsorship_status AS status, e.requests_per_day, e.queue_priority, e.expires_at, se.status AS sponsor_status, se.expires_at AS sponsor_expires_at, se.updated_at AS sponsor_updated_at, se.tier_id AS sponsor_tier_id, se.tier_name AS sponsor_tier_name FROM entitlements e LEFT JOIN sponsor_entitlements se ON se.github_id = ? WHERE e.user_id = ?",
  )
    .bind(user?.github_id, session.userId)
    .first<{ plan: string; status: string; requests_per_day: number; queue_priority: number; expires_at: string | null; sponsor_status?: string | null; sponsor_expires_at?: string | null; sponsor_updated_at?: string | null; sponsor_tier_id?: string | null; sponsor_tier_name?: string | null }>();
  const entitlementExpired = entitlement?.plan === 'early_tester' && (!Number.isFinite(parseTimestamp(entitlement.expires_at)) || parseTimestamp(entitlement.expires_at) <= Date.now());
  const sponsorExpiresAt = parseTimestamp(entitlement?.sponsor_expires_at);
  const sponsorUpdatedAt = parseTimestamp(entitlement?.sponsor_updated_at);
  const sponsorFresh = entitlement?.sponsor_status === 'active' && ((Number.isFinite(sponsorExpiresAt) && sponsorExpiresAt > Date.now()) || (!Number.isFinite(sponsorExpiresAt) && Number.isFinite(sponsorUpdatedAt) && sponsorUpdatedAt + 86400000 > Date.now()));
  const sponsorPlan = sponsorFresh ? planForTier(entitlement?.sponsor_tier_name, entitlement?.sponsor_tier_id, env) : 'registered';
  const paidExpired = (entitlement?.plan === 'supporter' || entitlement?.plan === 'pro') && !sponsorFresh;
  const normalizedPlan = entitlementExpired ? sponsorPlan : 'registered';
  if (entitlementExpired || paidExpired) {
    const limits = entitlementFor(normalizedPlan);
    await env.DB.prepare("UPDATE entitlements SET plan=?, requests_per_day=?, queue_priority=?, sponsorship_status=?, expires_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(normalizedPlan, limits.requestsPerDay, limits.queuePriority, normalizedPlan === 'registered' ? 'none' : 'active', session.userId).run();
    await invalidateUserKeyCaches(env, session.userId);
  }
  const keys = await env.DB.prepare(
    "SELECT id, key_prefix, label, status, created_at, last_used_at FROM api_keys WHERE user_id = ? AND status = 'active'",
  )
    .bind(session.userId)
    .all();
  return accountJson(request, env, {
    user,
    entitlement: entitlementExpired || paidExpired ? { plan: normalizedPlan, status: normalizedPlan === 'registered' ? 'registered' : 'active', requests_per_day: effectiveDailyLimit(env as unknown as Record<string, string | undefined>, normalizedPlan, entitlementFor(normalizedPlan).requestsPerDay), queue_priority: entitlementFor(normalizedPlan).queuePriority, expires_at: null } : entitlement ? { ...entitlement, requests_per_day: effectiveDailyLimit(env as unknown as Record<string, string | undefined>, entitlement.plan as Plan, entitlement.requests_per_day) } : {
      tier_name: "Registered",
      status: "registered",
      requests_per_day: 50,
      queue_priority: 10,
    },
    keys: keys.results,
  });
};

export function candidatesFor(
  normalized: NormalizedRequest,
  selected: ReturnType<typeof selectModel>,
  models: typeof MODELS,
  unhealthy: Set<string>,
): typeof MODELS {
  if (!selected) return [];
  const family =
    normalized.capability === "embeddings"
      ? (selected.family ?? selected.id.split("/").slice(1).join("/"))
      : undefined;
  return [
    selected,
    ...models.filter(
      (m) =>
        m.provider !== selected.provider &&
        supportsRequest(normalized, m) &&
        (family === undefined ||
          (m.family ?? m.id.split("/").slice(1).join("/")) === family) &&
        !unhealthy.has(m.provider),
    ),
  ]
    .filter(
      (m, i, all) => all.findIndex((x) => x.provider === m.provider) === i,
    )
    .slice(0, 3);
}

async function run(
  req: Request,
  env: Env,
  normalized: NormalizedRequest,
  wire: "openai" | "anthropic" | "responses" = "openai",
  models = MODELS,
): Promise<Response> {
  const wireError = (
    message: string,
    status: number,
    headers?: HeadersInit,
  ): Response =>
    wire === "anthropic"
      ? anthropicError(message, status, headers)
      : error(message, status, headers);
  let access: Awaited<ReturnType<typeof resolveAccessContext>>;
  let remaining: number;
  let reset: number;
  let leaseId: string | undefined;
  let limit: ReturnType<typeof planLimits>;
  if (env.QUOTA_LIMITER) {
    try { access = await resolveAccessContext(req, env); } catch (cause) { const code = cause instanceof Error ? cause.message : 'invalid_api_key'; if (code === 'account_suspended') return wireError('Account suspended.', 403, { 'x-error-code': code }); if (code === 'invalid_api_key') return wireError('Invalid API key.', 401, { 'x-error-code': code }); return wireError('Authentication service unavailable.', 503, { 'x-error-code': 'authentication_unavailable' }); }
    limit = planLimits(env as unknown as Record<string, string | undefined>, access.plan);
    if (normalized.max_tokens && normalized.max_tokens > limit.maxTokens) return wireError(`max_tokens exceeds the ${limit.maxTokens} limit for the ${access.plan} plan.`, 400, { 'x-error-code': 'max_tokens_exceeded' });
  } else return wireError('Strict quota service unavailable.', 503, { 'x-error-code': 'quota_unavailable' });
  const unhealthy = await unhealthyProviders(env);
  const model = selectModel(normalized, unhealthy, models);
  if (!model)
    return capabilityError(
      normalized.capability,
      wire === "anthropic" ? "anthropic" : "openai",
    );
  if (normalized.stream && model.provider === "ai-horde")
    return wireError(
      "AI Horde does not support streaming in this gateway.",
      422,
      { "x-error-code": "unsupported_stream_provider" },
    );
  const quota = env.QUOTA_LIMITER.get(env.QUOTA_LIMITER.idFromName(access.subject));
  const requestedLeaseId = normalized.stream ? crypto.randomUUID() : undefined;
  const quotaResponse = await quota.fetch(normalized.stream ? 'https://quota/acquire' : 'https://quota/consume', { method: 'POST', body: JSON.stringify({ action: normalized.stream ? 'acquire' : 'consume', limit: access.requestsPerDay, edgeLimit: limit.edgePerMinute, plan: access.plan, streams: limit.streams, leaseId: requestedLeaseId }) });
  const decision = await quotaResponse.json<{ allowed: boolean; remaining: number; resetAt: string; retryAfterSeconds: number; code?: string; leaseId?: string }>();
  leaseId = decision.leaseId ?? requestedLeaseId;
  remaining = decision.remaining; reset = Date.parse(decision.resetAt);
  const baseHeaders = responseHeaders(remaining, reset);
  baseHeaders.set('x-ratelimit-limit', String(access.requestsPerDay)); baseHeaders.set('x-llmfaucet-plan', access.plan);
  if (!decision.allowed) return wireError('Daily request limit reached.', 429, { ...headerObject(responseHeaders(0, reset)), 'x-ratelimit-limit': String(access.requestsPerDay), 'x-llmfaucet-plan': access.plan, 'retry-after': String(decision.retryAfterSeconds), 'x-error-code': decision.code ?? 'daily_limit_exceeded' });
  let attempts = 0;
  const started = Date.now();
  const candidates = candidatesFor(
    normalized,
    model,
    models as typeof MODELS,
    unhealthy,
  ).slice(0, PLAN_LIMITS[access.plan].fallbackAttempts);
  let quotaStub: DurableObjectStub | undefined;
  if (normalized.stream && env.QUOTA_LIMITER) {
    quotaStub = env.QUOTA_LIMITER.get(env.QUOTA_LIMITER.idFromName(access.subject));
  }
  for (const candidate of candidates) {
    attempts++;
    let result: Awaited<ReturnType<typeof callProvider>>;
    try {
      result = await callProvider(candidate, normalized, env);
    } catch {
      void recordRequest(env, { provider: candidate.provider, model: candidate.id, status: 503, latency: Date.now() - started });
      continue;
    }
    try {
      void recordRequest(env, {
        provider: result.provider,
        model: result.model.id,
        status: result.response.status,
        latency: Date.now() - started,
      });
      const headers = responseHeaders(
        remaining,
        reset,
        `${result.provider}/${result.model.id.split("/").slice(1).join("/")}`,
        attempts,
      );
      headers.set('x-ratelimit-limit', String(access.requestsPerDay)); headers.set('x-llmfaucet-plan', access.plan);
      if (normalized.stream) {
        const body = result.response.body; const renew = quotaStub && leaseId ? setInterval(() => { void quotaStub?.fetch('https://quota/renew', { method: 'POST', body: JSON.stringify({ action: 'renew', leaseId, limit: access.requestsPerDay, plan: access.plan }) }); }, 60000) : undefined; let released = false; const release = async () => { if (released) return; released = true; if (renew) clearInterval(renew); if (quotaStub && leaseId) { try { await quotaStub.fetch('https://quota/release', { method: 'POST', body: JSON.stringify({ action: 'release', leaseId, limit: access.requestsPerDay, plan: access.plan }) }); } catch { /* lease expiry remains the final safeguard */ } } };
        if (body) { const reader = body.getReader(); result.response = new Response(new ReadableStream({ async pull(controller) { try { const part = await reader.read(); if (part.done) { await release(); controller.close(); } else controller.enqueue(part.value); } catch (error) { await release(); controller.error(error); } }, cancel() { void release(); void reader.cancel(); } }), result.response); } else await release();
        for (const key of ["cache-control", "connection"]) {
          const value = result.response.headers.get(key);
          if (value) headers.set(key, value);
        }
        headers.set("content-type", "text/event-stream");
        headers.set("access-control-allow-origin", "*");
        if (wire === "responses" || wire === "anthropic") {
          const streamed =
            wire === "responses"
              ? responsesStream(result.response, result.model.id)
              : anthropicStream(result.response, result.model.id);
          headers.forEach((value, key) => streamed.headers.set(key, value));
          return streamed;
        }
        return new Response(result.response.body, {
          status: result.response.status,
          headers,
        });
      }
      const data = await result.response.json();
      const converted =
        wire === "anthropic"
          ? anthropicResponse(data, result.model.id)
          : wire === "responses"
            ? responsesResponse(data, result.model.id)
            : normalized.wire === "legacy"
              ? legacyResponse(data, result.model.id)
              : normalized.wire === "embeddings"
                ? embeddingResponse(data, result.model.id)
                : data;
      return json(converted, result.response.status, headers);
    } catch {
      void recordRequest(env, { provider: result.provider, model: result.model.id, status: 502, latency: Date.now() - started });
      if (quotaStub && leaseId) void quotaStub.fetch('https://quota/release', { method: 'POST', body: JSON.stringify({ action: 'release', leaseId, limit: access.requestsPerDay, plan: access.plan }) });
      return wireError('The upstream response could not be converted to the requested format.', 502, { ...headerObject(baseHeaders), 'x-error-code': 'upstream_contract_error' });
    }
  }
  if (quotaStub && leaseId) void quotaStub.fetch('https://quota/release', { method: 'POST', body: JSON.stringify({ action: 'release', leaseId, limit: access.requestsPerDay, plan: access.plan }) });
  void recordRequest(env, { status: 503, latency: Date.now() - started });
  return wireError("All compatible upstream providers are unavailable.", 503, {
    ...headerObject(baseHeaders),
    "retry-after": "30",
  });
}

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS")
      return new Response(null, {
        headers: {
          ...credentialCors(request, env),
          "access-control-allow-methods": "DELETE,GET,PATCH,POST,OPTIONS",
          "access-control-allow-headers":
            "authorization,content-type,anthropic-version",
        },
      });
    const url = new URL(request.url);
    if ((url.pathname.startsWith('/v1/') || url.pathname.startsWith('/api/public/')) && env.EDGE_LIMITER) {
      if (!env.IP_HASH_SECRET && env.ENVIRONMENT !== 'development' && env.ENVIRONMENT !== 'test') return error('Anonymous identity service unavailable.', 503, { 'x-error-code': 'ip_hash_secret_missing' });
      const edgeIdentity = await hmacSha256(env.IP_HASH_SECRET ?? 'development-only-ip-secret', `edge-ip:v1:${env.ENVIRONMENT}:${new Date().toISOString().slice(0, 10)}:${request.headers.get('CF-Connecting-IP') ?? 'unknown'}`);
      const edgeKey = await sha256(edgeIdentity);
      const limited = await env.EDGE_LIMITER.limit({ key: edgeKey });
      if (!limited.success) return error('Short-window rate limit exceeded.', 429, { 'retry-after': '60', 'x-ratelimit-limit': '120', 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60), 'x-error-code': 'rate_limit_exceeded' });
    }
    if (url.pathname === "/auth/github" && request.method === "GET")
      return startGithub(request, env);
    if (url.pathname === "/auth/github/callback" && request.method === "GET")
      return githubCallback(request, env);
    if (
      url.pathname === "/webhooks/github-sponsors" &&
      request.method === "POST"
    )
      return sponsorWebhook(request, env);
    if (url.pathname === "/account" && request.method === "GET")
      return account(request, env);
    if (url.pathname === '/auth/logout' && request.method === 'POST') {
      await revokeSession(request, env);
      return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json', 'set-cookie': 'llmfaucet_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax', ...credentialCors(request, env) } });
    }
    if (url.pathname === '/account/keys' && request.method === 'GET') {
      const session = await readSession(request, env); if (!session || !env.DB) return accountError(request, env, 'A valid account session is required.', 401);
      const keys = await env.DB.prepare('SELECT id, key_prefix AS prefix, label, status, created_at AS createdAt, last_used_at AS lastUsedAt FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').bind(session.userId).all();
      return accountJson(request, env, { keys: keys.results });
    }
    if (url.pathname === '/account/usage' && request.method === 'GET') {
      const session = await readSession(request, env);
      if (!session || !env.QUOTA_LIMITER) return accountError(request, env, 'A valid account session is required.', 401);
      const user = await env.DB?.prepare('SELECT github_id FROM users WHERE id=?').bind(session.userId).first<{ github_id: string }>();
      const entitlement = await env.DB?.prepare('SELECT e.plan, e.requests_per_day, e.expires_at, se.status AS sponsor_status, se.expires_at AS sponsor_expires_at, se.updated_at AS sponsor_updated_at, se.tier_id AS sponsor_tier_id, se.tier_name AS sponsor_tier_name FROM entitlements e LEFT JOIN sponsor_entitlements se ON se.github_id=? WHERE e.user_id=?').bind(user?.github_id, session.userId).first<{ plan: Plan; requests_per_day: number; expires_at?: string | null; sponsor_status?: string | null; sponsor_expires_at?: string | null; sponsor_updated_at?: string | null; sponsor_tier_id?: string | null; sponsor_tier_name?: string | null }>();
      const earlyExpired = entitlement?.plan === 'early_tester' && (!Number.isFinite(parseTimestamp(entitlement.expires_at)) || parseTimestamp(entitlement.expires_at) <= Date.now());
      const sponsorExpires = parseTimestamp(entitlement?.sponsor_expires_at); const sponsorUpdated = parseTimestamp(entitlement?.sponsor_updated_at);
      const sponsorFresh = entitlement?.sponsor_status === 'active' && ((Number.isFinite(sponsorExpires) && sponsorExpires > Date.now()) || (!Number.isFinite(sponsorExpires) && Number.isFinite(sponsorUpdated) && sponsorUpdated + 86400000 > Date.now()));
      const sponsorPlan = sponsorFresh ? planForTier(entitlement?.sponsor_tier_name, entitlement?.sponsor_tier_id, env) : 'registered';
      const resolvedPlan: Plan = earlyExpired ? sponsorPlan : (entitlement?.plan ?? 'registered');
      const storedLimit = earlyExpired ? entitlementFor(resolvedPlan).requestsPerDay : entitlement?.requests_per_day;
      const quota = env.QUOTA_LIMITER.get(env.QUOTA_LIMITER.idFromName(userSubject(session.userId)));
          const usage = await quota.fetch('https://quota/usage', { method: 'POST', body: JSON.stringify({ action: 'usage', limit: effectiveDailyLimit(env as unknown as Record<string, string | undefined>, resolvedPlan, storedLimit), plan: resolvedPlan }) });
      return accountResponse(request, env, json(await usage.json()));
    }
    if (url.pathname === "/account/keys" && request.method === "POST") {
      if (!csrfAllowed(request, env))
        return accountError(request, env, "Origin validation failed.", 403);
      const session = await readSession(request, env);
      if (!session || !env.DB)
        return accountError(request, env, "A valid account session is required.", 401);
      let label = 'default';
      try {
        const body = await request.json() as { label?: unknown };
        if (body.label !== undefined) {
          if (typeof body.label !== 'string' || body.label.trim().length === 0 || body.label.length > 80) return accountError(request, env, 'Key label must be 1–80 characters.', 400);
          label = body.label.trim();
        }
      } catch {
        return accountError(request, env, 'Invalid JSON.', 400);
      }
      const raw = generateApiKey();
      const keyId = crypto.randomUUID();
      await env.DB.prepare(
        "INSERT INTO api_keys (id, user_id, key_prefix, key_hash, label) VALUES (?, ?, ?, ?, ?)",
      )
        .bind(
          keyId,
          session.userId,
          keyPrefix(raw),
          await hashApiKey(raw),
          label,
        )
        .run();
      const hashes = await env.BUDGETS.get<string[]>(`user:key-hashes:${session.userId}`, 'json') ?? [];
      const rawHash = await sha256(raw);
      if (!hashes.includes(rawHash)) await env.BUDGETS.put(`user:key-hashes:${session.userId}`, JSON.stringify([...hashes, rawHash]), { expirationTtl: 900 });
      return accountJson(request, env,
        {
          id: keyId,
          label,
          prefix: keyPrefix(raw),
          key: raw,
          createdAt: new Date().toISOString(),
          warning: "Store this key now. It will not be shown again.",
        },
        201,
      );
    }
    const revoke = url.pathname.match(/^\/account\/keys\/([^/]+)$/);
    if (revoke && request.method === "DELETE") {
      if (!csrfAllowed(request, env))
        return accountError(request, env, "Origin validation failed.", 403);
      const session = await readSession(request, env);
      if (!session || !env.DB)
        return accountError(request, env, "A valid account session is required.", 401);
      await env.DB.prepare(
        "UPDATE api_keys SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
      )
        .bind(revoke[1], session.userId)
        .run();
      await invalidateUserKeyCaches(env, session.userId);
      return accountJson(request, env, { ok: true });
    }
    if (url.pathname === '/account' && request.method === 'DELETE') {
      if (!csrfAllowed(request, env)) return accountError(request, env, 'Origin validation failed.', 403);
      const session = await readSession(request, env); if (!session || !env.DB) return accountError(request, env, 'A valid account session is required.', 401);
      let body: { confirm?: string }; try { body = await request.json() as { confirm?: string }; } catch { return accountError(request, env, 'Confirmation is required.', 400); }
      if (body.confirm !== 'DELETE MY ACCOUNT') return accountError(request, env, 'Confirmation is required.', 400);
      await invalidateUserKeyCaches(env, session.userId); await env.BUDGETS.delete(`user:key-hashes:${session.userId}`);
      await env.DB.batch([
        env.DB.prepare('DELETE FROM waitlist_events WHERE application_id IN (SELECT id FROM waitlist_applications WHERE user_id = ?)').bind(session.userId),
        env.DB.prepare('DELETE FROM waitlist_applications WHERE user_id = ?').bind(session.userId),
        env.DB.prepare('DELETE FROM api_keys WHERE user_id = ?').bind(session.userId),
        env.DB.prepare('DELETE FROM entitlements WHERE user_id = ?').bind(session.userId),
        env.DB.prepare('DELETE FROM user_preferences WHERE user_id = ?').bind(session.userId),
        env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(session.userId),
        env.DB.prepare('DELETE FROM audit_events WHERE user_id = ?').bind(session.userId),
        env.DB.prepare('UPDATE waitlist_events SET actor_user_id = NULL WHERE actor_user_id = ?').bind(session.userId),
        env.DB.prepare('DELETE FROM sponsor_entitlements WHERE github_id = (SELECT github_id FROM users WHERE id = ?)').bind(session.userId),
        env.DB.prepare('DELETE FROM webhook_events WHERE github_id = (SELECT github_id FROM users WHERE id = ?)').bind(session.userId),
        env.DB.prepare('DELETE FROM users WHERE id = ?').bind(session.userId),
      ]);
      if (env.QUOTA_LIMITER) await env.QUOTA_LIMITER.get(env.QUOTA_LIMITER.idFromName(`user:${session.userId}`)).fetch('https://quota/reset', { method: 'POST', body: JSON.stringify({ action: 'reset' }) });
      await invalidateUserSessions(env, session.userId); await revokeSession(request, env);
      return new Response(JSON.stringify({ deleted: true }), { headers: { 'content-type': 'application/json', 'set-cookie': 'llmfaucet_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax', ...credentialCors(request, env) } });
    }
    if (
      url.pathname === "/account/sync-sponsorship" &&
      request.method === "POST"
    ) {
      if (!csrfAllowed(request, env))
        return error("Origin validation failed.", 403);
      if (!(await readSession(request, env)))
        return error("A valid account session is required.", 401);
      return Response.redirect(
        `${new URL(request.url).origin}/auth/github`,
        303,
      );
    }
    if (url.pathname === "/v1/usage" && request.method === "GET") {
      const token = request.headers
        .get("authorization")
        ?.replace(/^Bearer\s+/i, "");
      if (!token || token === "free" || !env.DB)
        return error("A registered API key is required.", 401);
      if (env.QUOTA_LIMITER) {
        try {
          const access = await resolveAccessContext(request, env);
          if (access.isAnonymous) return error("A registered API key is required.", 401);
          const quota = env.QUOTA_LIMITER.get(env.QUOTA_LIMITER.idFromName(access.subject));
          const quotaResponse = await quota.fetch('https://quota/usage', { method: 'POST', body: JSON.stringify({ action: 'usage', limit: access.requestsPerDay, plan: access.plan }) });
          return json(await quotaResponse.json());
        } catch (cause) {
          const code = cause instanceof Error ? cause.message : 'usage_unavailable';
          if (code === 'invalid_api_key') return error('Invalid or revoked API key.', 401, { 'x-error-code': code });
          if (code === 'account_suspended') return error('Account suspended.', 403, { 'x-error-code': code });
          return error('Usage service unavailable.', 503, { 'x-error-code': 'usage_unavailable' });
        }
      }
      return error('Strict quota service unavailable.', 503, { 'x-error-code': 'quota_unavailable' });
    }
    if (url.pathname === '/account/preferences' && request.method === 'GET') return preferences(request, env);
    if (url.pathname === '/account/preferences' && request.method === 'PATCH') {
      if (!csrfAllowed(request, env)) return accountError(request, env, 'Origin validation failed.', 403);
      return updatePreferences(request, env);
    }
    if (url.pathname === '/account/onboarding/complete' && request.method === 'POST') {
      if (!csrfAllowed(request, env)) return accountError(request, env, 'Origin validation failed.', 403);
      return onboardingAction(request, env, 'complete');
    }
    if (url.pathname === '/account/onboarding/dismiss' && request.method === 'POST') {
      if (!csrfAllowed(request, env)) return accountError(request, env, 'Origin validation failed.', 403);
      return onboardingAction(request, env, 'dismiss');
    }
    if (url.pathname === '/account/onboarding/replay' && request.method === 'POST') {
      if (!csrfAllowed(request, env)) return accountError(request, env, 'Origin validation failed.', 403);
      return onboardingAction(request, env, 'replay');
    }
    if (url.pathname === '/api/public/github' && request.method === 'GET') return json(await githubRepository(env));
    if (url.pathname === '/api/public/sponsors' && request.method === 'GET') {
      if (!env.DB) return json({ sponsors: [], source: 'unavailable' }, 200);
      const sponsors = await env.DB.prepare("SELECT github_login AS login FROM sponsor_entitlements WHERE status='active' ORDER BY github_login COLLATE NOCASE").all<{ login: string }>();
      const specialSponsors = (env.GITHUB_SPECIAL_SPONSORS ?? '').split(',').map((login) => login.trim()).filter(Boolean);
      const currentSponsors = sponsors.results.map((sponsor) => sponsor.login);
      return json({ sponsors: currentSponsors, currentSponsors, specialSponsors, source: 'd1' });
    }
    if (url.pathname === '/api/public/metrics' && request.method === 'GET') {
      const currentModels = await catalog(env);
      const providers = [...new Set(currentModels.map((model) => model.provider))];
      return json(await publicMetrics(env, { providers, models: currentModels }));
    }
    if (url.pathname === '/api/waitlist' && request.method === 'POST') return accountResponse(request, env, await submitWaitlist(request, env));
    if (url.pathname === '/api/waitlist/me' && request.method === 'PATCH') return accountResponse(request, env, await submitWaitlist(request, env));
    if (url.pathname === '/api/waitlist/me' && request.method === 'GET') return accountResponse(request, env, await waitlistMe(request, env));
    if (url.pathname === '/api/waitlist/me/key' && request.method === 'POST') { if (!waitlistCsrfAllowed(request, env)) return accountError(request, env, 'Origin validation failed.', 403); return accountResponse(request, env, await createPreviewKey(request, env)); }
    if (url.pathname === '/api/admin/waitlist' && request.method === 'GET') return accountResponse(request, env, await adminWaitlist(request, env));
    const adminDetail = url.pathname.match(/^\/api\/admin\/waitlist\/([^/]+)$/);
    if (adminDetail && request.method === 'GET') return accountResponse(request, env, await adminWaitlistDetail(request, env, adminDetail[1]));
    if (adminDetail && request.method === 'PATCH') { const body = await request.clone().json().catch(() => ({})) as { status?: string }; if (body.status === 'approved' || body.status === 'revoked') return accountError(request, env, 'Use the dedicated approval or revocation action.', 409); return accountResponse(request, env, await adminUpdate(request, env, adminDetail[1])); }
    const adminApprove = url.pathname.match(/^\/api\/admin\/waitlist\/([^/]+)\/approve$/);
    if (adminApprove && request.method === 'POST') return accountResponse(request, env, await approveWaitlist(request, env, adminApprove[1]));
    const adminRevoke = url.pathname.match(/^\/api\/admin\/waitlist\/([^/]+)\/revoke$/);
    if (adminRevoke && request.method === 'POST') return accountResponse(request, env, await revokeWaitlist(request, env, adminRevoke[1]));
    const models = await catalog(env);
    if (url.pathname === "/health" || url.pathname === "/status") {
      const providers = models.map((m) => m.provider).filter((p, i, a) => a.indexOf(p) === i);
      const rows = await Promise.all(providers.map(async provider => {
        const value = await env.BUDGETS.get<{ status?: string; latency?: number; checked_at?: number | string }>(`health:${provider}`, 'json');
        const checkedMs = parseTimestamp(value?.checked_at);
        const fresh = Number.isFinite(checkedMs) && checkedMs <= Date.now() && Date.now() - checkedMs <= 15 * 60 * 1000;
        return { provider, models: models.filter(model => model.provider === provider).length, status: fresh ? value?.status ?? 'unknown' : 'unknown', latencyMs: fresh ? value?.latency ?? null : null, checkedAt: Number.isFinite(checkedMs) ? new Date(checkedMs).toISOString() : null };
      }));
      const known = rows.filter(row => row.status === 'healthy' || row.status === 'degraded');
      const checkedAt = rows.map(row => row.checkedAt).filter((value): value is string => value !== null).sort().at(-1) ?? null;
      return json({ status: known.length === 0 ? 'unavailable' : known.length < rows.length || rows.some(row => row.status === 'degraded') ? 'degraded' : 'operational', environment: env.ENVIRONMENT, checkedAt, providers: rows });
    }
    if (url.pathname === "/v1/models" && request.method === "GET")
      return request.headers.has("anthropic-version")
        ? json(anthropicModels(models))
        : json({
            object: "list",
            data: models.map((m) => ({
              id: m.id,
              object: "model",
              created: 0,
              owned_by: m.provider,
              capabilities: m.capabilities,
              context_window: m.context,
              status: 'catalogued',
              supported_parameters: m.supported_parameters,
            })),
          });
    if (request.method !== "POST" || !url.pathname.startsWith("/v1/"))
      return error("Not found", 404);
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 1_048_576) return error('Request body is too large.', 413, { 'x-error-code': 'request_too_large' });
    let body: Record<string, unknown>;
    try {
      const bounded = await readBoundedBody(request);
      if (bounded.tooLarge) return error('Request body is too large.', 413, { 'x-error-code': 'request_too_large' });
      const parsed = JSON.parse(bounded.text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        return error("Request body must be a JSON object.", 400);
      body = parsed as Record<string, unknown>;
    } catch {
      return error("Request body must be valid JSON.", 400);
    }
    if (url.pathname.endsWith("/count_tokens")) {
      if (env.QUOTA_LIMITER) {
        try {
          const access = await resolveAccessContext(request, env);
          const quota = env.QUOTA_LIMITER.get(env.QUOTA_LIMITER.idFromName(access.subject));
          const quotaResponse = await quota.fetch('https://quota/consume', { method: 'POST', body: JSON.stringify({ action: 'consume', limit: access.requestsPerDay, edgeLimit: planLimits(env as unknown as Record<string, string | undefined>, access.plan).edgePerMinute, plan: access.plan }) });
          const decision = await quotaResponse.json<{ allowed: boolean; remaining: number; resetAt: string; retryAfterSeconds: number; code?: string }>();
          const headers = responseHeaders(decision.remaining, Date.parse(decision.resetAt)); headers.set('x-ratelimit-limit', String(access.requestsPerDay)); headers.set('x-llmfaucet-plan', access.plan);
          if (!decision.allowed) return anthropicError('Daily request limit reached.', 429, { ...headerObject(headers), 'retry-after': String(decision.retryAfterSeconds), 'x-error-code': decision.code ?? 'daily_limit_exceeded' });
          return json({ input_tokens: Math.ceil(JSON.stringify(body.messages ?? []).length / 4) }, 200, headers);
        } catch (cause) { const code = cause instanceof Error ? cause.message : 'invalid_api_key'; if (code === 'account_suspended') return anthropicError('Account suspended.', 403, { 'x-error-code': code }); return anthropicError(code === 'invalid_api_key' ? 'Invalid or revoked API key.' : 'Authentication service unavailable.', code === 'invalid_api_key' ? 401 : 503, { 'x-error-code': code === 'invalid_api_key' ? code : 'authentication_unavailable' }); }
      }
      return anthropicError('Strict quota service unavailable.', 503, { 'x-error-code': 'quota_unavailable' });
    }
    try {
      if (url.pathname.endsWith("/chat/completions")) {
        if (!Array.isArray(body.messages))
          return error("messages must be an array.", 400);
        return run(request, env, openAIRequest(body), "openai", models);
      }
      if (url.pathname.endsWith("/completions")) {
        if (typeof body.prompt !== "string")
          return error("prompt must be a string.", 400);
        return run(request, env, legacyRequest(body), "openai", models);
      }
      if (url.pathname.endsWith("/messages")) {
        if (!Array.isArray(body.messages))
          return anthropicError("messages must be an array.", 400);
        return run(request, env, anthropicRequest(body), "anthropic", models);
      }
      if (url.pathname.endsWith("/responses")) {
        if (!("input" in body)) return error("input is required.", 400);
        return run(request, env, responsesRequest(body), "responses", models);
      }
      if (url.pathname.endsWith("/embeddings")) {
        if (!("input" in body)) return error("input is required.", 400);
        return run(request, env, embeddingRequest(body), "openai", models);
      }
    } catch {
      return error("Invalid request shape.", 400);
    }
    return error("Not found", 404);
  },
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const models = await catalog(env);
    await scheduledMaintenance(env);
    await probeProviders(env, models);
    await refreshCatalog(env, models);
  },
  async queue(batch: MessageBatch<unknown>): Promise<void> {
    for (const message of batch.messages) message.ack();
  },
};

export default handler;
