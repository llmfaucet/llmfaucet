import { consumeBudget } from "./budget";
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
import { capabilityError, selectModel } from "./router";
import type { Env, NormalizedRequest } from "./types";
import {
  catalog,
  unhealthyProviders,
  recordRequest,
  scheduledMaintenance,
} from "./state";
import { probeProviders, refreshCatalog } from "./probe";
import { githubCallback, startGithub } from "./auth/github-oauth";
import { readSession } from "./auth/sessions";
import { generateApiKey, hashApiKey, keyPrefix } from "./sponsors/keys";
import { sponsorWebhook } from "./sponsors/webhook";

const headerObject = (headers?: Headers): Record<string, string> => {
  const out: Record<string, string> = {};
  headers?.forEach((value, key) => {
    out[key] = value;
  });
  return out;
};
const json = (data: unknown, status = 200, headers?: Headers): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: new Headers({
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      ...headerObject(headers),
    }),
  });
const csrfAllowed = (request: Request, env: Env): boolean => {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const expected = env.PUBLIC_BASE_URL
    ? new URL(env.PUBLIC_BASE_URL).origin
    : new URL(request.url).origin;
  return origin === expected;
};
const account = async (request: Request, env: Env): Promise<Response> => {
  const session = await readSession(request, env);
  if (!session || !env.DB)
    return error("A valid account session is required.", 401);
  const user = await env.DB.prepare(
    "SELECT github_login, avatar_url FROM users WHERE id = ?",
  )
    .bind(session.userId)
    .first<{ github_login: string; avatar_url: string | null }>();
  const entitlement = await env.DB.prepare(
    "SELECT tier_name, status, requests_per_day, queue_priority FROM sponsor_entitlements WHERE github_id = (SELECT github_id FROM users WHERE id = ?)",
  )
    .bind(session.userId)
    .first();
  const keys = await env.DB.prepare(
    "SELECT id, key_prefix, label, status, created_at, last_used_at FROM api_keys WHERE user_id = ? AND status = 'active'",
  )
    .bind(session.userId)
    .all();
  return json({
    user,
    entitlement: entitlement ?? {
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
        m.capabilities.includes(normalized.capability) &&
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
  const budget = await consumeBudget(req, env);
  const baseHeaders = responseHeaders(budget.remaining, budget.reset);
  if (budget.invalidKey)
    return wireError(
      "Invalid or revoked API key.",
      401,
      headerObject(baseHeaders),
    );
  if (!budget.allowed)
    return wireError(
      "Daily request budget exhausted. Try again after reset.",
      429,
      {
        ...headerObject(baseHeaders),
        "retry-after": String(
          Math.max(1, Math.ceil((budget.reset - Date.now()) / 1000)),
        ),
      },
    );
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
  let attempts = 0;
  const started = Date.now();
  const candidates = candidatesFor(
    normalized,
    model,
    models as typeof MODELS,
    unhealthy,
  );
  for (const candidate of candidates) {
    attempts++;
    try {
      const result = await callProvider(candidate, normalized, env);
      void recordRequest(env, {
        provider: result.provider,
        model: result.model.id,
        status: result.response.status,
        latency: Date.now() - started,
      });
      const headers = responseHeaders(
        budget.remaining,
        budget.reset,
        `${result.provider}/${result.model.id.split("/").slice(1).join("/")}`,
        attempts,
      );
      if (normalized.stream) {
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
      /* fail over to the next compatible upstream */
    }
  }
  if (env.QUEUE) {
    if (normalized.stream)
      return wireError(
        "Streaming requests cannot enter the waiting room; retry without stream or later.",
        503,
        { "retry-after": "30" },
      );
    const requestId = crypto.randomUUID();
    await env.BUDGETS.put(
      `queue:${requestId}`,
      JSON.stringify({
        status: "pending",
        normalized,
        wire,
        created_at: Date.now(),
      }),
      { expirationTtl: 600 },
    );
    await env.QUEUE.send({
      request_id: requestId,
      model: normalized.model,
      priority: budget.priority,
      created_at: Date.now(),
    });
    return json(
      {
        id: requestId,
        object: "queue.response",
        status: "queued",
        message: "All compatible providers are busy.",
        retry_after: 30,
      },
      202,
      new Headers({ ...headerObject(baseHeaders), "retry-after": "30" }),
    );
  }
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
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers":
            "authorization,content-type,anthropic-version",
        },
      });
    const url = new URL(request.url);
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
    if (url.pathname === "/account/keys" && request.method === "POST") {
      if (!csrfAllowed(request, env))
        return error("Origin validation failed.", 403);
      const session = await readSession(request, env);
      if (!session || !env.DB)
        return error("A valid account session is required.", 401);
      const raw = generateApiKey();
      await env.DB.prepare(
        "INSERT INTO api_keys (id, user_id, key_prefix, key_hash) VALUES (?, ?, ?, ?)",
      )
        .bind(
          crypto.randomUUID(),
          session.userId,
          keyPrefix(raw),
          await hashApiKey(raw),
        )
        .run();
      return json(
        {
          key: raw,
          warning: "Store this key now. It will not be shown again.",
        },
        201,
      );
    }
    const revoke = url.pathname.match(/^\/account\/keys\/([^/]+)$/);
    if (revoke && request.method === "DELETE") {
      if (!csrfAllowed(request, env))
        return error("Origin validation failed.", 403);
      const session = await readSession(request, env);
      if (!session || !env.DB)
        return error("A valid account session is required.", 401);
      await env.DB.prepare(
        "UPDATE api_keys SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
      )
        .bind(revoke[1], session.userId)
        .run();
      return json({ ok: true });
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
      const keyHash = await hashApiKey(token);
      const activeKey = await env.DB.prepare(
        "SELECT id FROM api_keys WHERE key_hash = ? AND status = 'active'",
      )
        .bind(keyHash)
        .first();
      if (!activeKey) return error("Invalid or revoked API key.", 401);
      const id = [
        ...new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(`token:${token}`),
          ),
        ),
      ]
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
      const reset = Math.ceil(Date.now() / 86400000) * 86400000;
      const key = `budget:${id}:${new Date(reset).toISOString().slice(0, 10)}`;
      const row = await env.DB.prepare("SELECT used FROM budgets WHERE key = ?")
        .bind(key)
        .first<{ used: number }>();
      const used = row?.used ?? Number((await env.BUDGETS.get(key)) ?? 0);
      return json({ used, reset: new Date(reset).toISOString() });
    }
    const queueMatch = url.pathname.match(/^\/v1\/queue\/([\w-]+)$/);
    if (queueMatch && request.method === "GET") {
      const value = (await env.BUDGETS.get(
        `queue:${queueMatch[1]}`,
        "json",
      )) as any;
      if (!value) return error("Queue request not found or expired.", 404);
      if (value.status === "pending")
        return json({
          id: queueMatch[1],
          status: "pending",
          created_at: value.created_at,
        });
      return json(value);
    }
    const models = await catalog(env);
    if (url.pathname === "/health" || url.pathname === "/status")
      return json({
        status: "ok",
        environment: env.ENVIRONMENT,
        providers: models
          .map((m) => m.provider)
          .filter((p, i, a) => a.indexOf(p) === i),
      });
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
              supported_parameters: m.supported_parameters,
            })),
          });
    if (request.method !== "POST" || !url.pathname.startsWith("/v1/"))
      return error("Not found", 404);
    let body: Record<string, unknown>;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        return error("Request body must be a JSON object.", 400);
      body = parsed as Record<string, unknown>;
    } catch {
      return error("Request body must be valid JSON.", 400);
    }
    if (url.pathname.endsWith("/count_tokens")) {
      const budget = await consumeBudget(request, env);
      if (budget.invalidKey)
        return anthropicError("Invalid or revoked API key.", 401);
      if (!budget.allowed)
        return anthropicError(
          "Daily request budget exhausted. Try again after reset.",
          429,
          {
            ...headerObject(responseHeaders(0, budget.reset)),
            "retry-after": String(
              Math.max(1, Math.ceil((budget.reset - Date.now()) / 1000)),
            ),
          },
        );
      return json(
        {
          input_tokens: Math.ceil(
            JSON.stringify(body.messages ?? []).length / 4,
          ),
        },
        200,
        responseHeaders(budget.remaining, budget.reset),
      );
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
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    for (const message of [...batch.messages].sort((a, b) => (b.body?.priority ?? 0) - (a.body?.priority ?? 0))) {
      const id = message.body?.request_id;
      const stored = id
        ? ((await env.BUDGETS.get(`queue:${id}`, "json")) as any)
        : null;
      if (!stored || stored.status !== "pending") {
        message.ack();
        continue;
      }
      try {
        const models = await catalog(env);
        const unhealthy = await unhealthyProviders(env);
        const selected = selectModel(stored.normalized, unhealthy, models);
        const candidates = candidatesFor(
          stored.normalized,
          selected,
          models as typeof MODELS,
          unhealthy,
        );
        if (!candidates.length) throw new Error("no compatible model");
        let result: Awaited<ReturnType<typeof callProvider>> | undefined;
        for (const candidate of candidates) {
          try {
            result = await callProvider(candidate, stored.normalized, env);
            break;
          } catch {}
        }
        if (!result) throw new Error("all compatible upstreams unavailable");
        const text = await result.response.text();
        let response: any = text;
        try {
          response = JSON.parse(text);
        } catch {}
        response =
          stored.wire === "anthropic"
            ? anthropicResponse(response, result.model.id)
            : stored.wire === "responses"
              ? responsesResponse(response, result.model.id)
              : stored.normalized.wire === "legacy"
                ? legacyResponse(response, result.model.id)
                : stored.normalized.wire === "embeddings"
                  ? embeddingResponse(response, result.model.id)
                  : response;
        await env.BUDGETS.put(
          `queue:${id}`,
          JSON.stringify({
            status: "complete",
            response,
            provider: result.provider,
            model: result.model.id,
            completed_at: Date.now(),
          }),
          { expirationTtl: 600 },
        );
        message.ack();
      } catch (cause) {
        if ((message as any).attempts >= 3) {
          await env.BUDGETS.put(
            `queue:${id}`,
            JSON.stringify({
              status: "failed",
              message:
                cause instanceof Error ? cause.message : "upstream failure",
              completed_at: Date.now(),
            }),
            { expirationTtl: 600 },
          );
          message.ack();
        } else message.retry({ delaySeconds: 30 });
      }
    }
  },
};

export default handler;
