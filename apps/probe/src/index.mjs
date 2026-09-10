#!/usr/bin/env node

const staticProviders = {
  pollinations: process.env.POLLINATIONS_URL || 'https://text.pollinations.ai/openai',
  llm7: process.env.LLM7_URL || 'https://api.llm7.io/v1/chat/completions',
  'opencode-zen': process.env.OPENCODE_ZEN_URL || 'https://opencode.ai/zen/v1/chat/completions',
  ovh: process.env.OVH_URL || 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
  'ai-horde': process.env.AI_HORDE_URL
    ? process.env.AI_HORDE_URL.replace(/\/generate\/async$/, '/status')
    : 'https://aihorde.net/api/v2/status',
};
const staticAdapterTypes = {
  pollinations: 'pollinations',
  llm7: 'llm7',
  'opencode-zen': 'opencode-zen',
  ovh: 'ovh',
  'ai-horde': 'ai-horde',
};
const interval = Number(process.env.PROBE_INTERVAL_MS || 3600000);
const modelSyncInterval = Number(process.env.PROVIDER_MODEL_SYNC_INTERVAL_MS || 21600000);
const once = process.argv.includes('--once');
const builtinOrigins = new Set([
  'https://text.pollinations.ai',
  'https://api.llm7.io',
  'https://opencode.ai',
  'https://oai.endpoints.kepler.ai.cloud.ovh.net',
  'https://aihorde.net',
]);
const secretRef = (value) => typeof value === 'string' && /^PROVIDER_[A-Z0-9_]{1,96}$/.test(value);
const isAllowedURL = (value) => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname.includes('..')) return false;
    const allowed = new Set(builtinOrigins);
    for (const origin of (process.env.PROVIDER_EGRESS_ALLOWLIST || '').split(',')) {
      const trimmed = origin.trim().replace(/\/$/, '');
      if (trimmed) allowed.add(trimmed);
    }
    return allowed.has(url.origin);
  } catch {
    return false;
  }
};
const addProviderSecret = (headers, provider) => {
  const header = (provider.api_key_header || 'authorization').toLowerCase();
  const secret = secretRef(provider.api_key_secret_ref) ? process.env[provider.api_key_secret_ref] : undefined;
  if (secret) headers[header] = header === 'authorization' ? `Bearer ${secret}` : secret;
};

async function queryD1(sql, params = []) {
  const { CF_API_TOKEN: token, CF_ACCOUNT_ID: account, CF_D1_DATABASE_ID: database } = process.env;
  if (!token || !account || !database) return null;
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ sql, params }),
    },
  );
  if (!response.ok) throw new Error(`Cloudflare D1 query failed: ${response.status}`);
  const payload = await response.json();
  return payload?.result?.[0]?.results || [];
}

async function loadProviders() {
  try {
    const rows = await queryD1(
      `SELECT id, name, base_url, adapter_type, api_key_required, api_key_header, api_key_secret_ref, supports_chat, supports_embeddings, supports_streaming FROM providers WHERE is_enabled = 1 ORDER BY priority DESC, weight DESC`,
    );
    if (rows !== null) return Object.fromEntries(rows.map((row) => [row.name, row]));
  } catch (error) {
    console.warn(`Dynamic provider load failed; using static probe list: ${error.message}`);
  }
  return Object.fromEntries(
    Object.entries(staticProviders).map(([name, url]) => [
      name,
      { id: name, name, base_url: url, adapter_type: staticAdapterTypes[name] },
    ]),
  );
}

function endpoint(provider) {
  const configured = process.env[`${provider.name.toUpperCase().replace(/-/g, '_')}_URL`] || provider.base_url;
  const adapterType = provider.adapter_type || provider.name;
  if (adapterType === 'ai-horde') return configured.replace(/\/generate\/async$/, '/status');
  if (adapterType === 'pollinations' && /\/openai\/?$/.test(configured)) return configured.replace(/\/$/, '');
  if (/\/chat\/completions$/.test(configured)) return configured;
  return `${configured.replace(/\/$/, '')}/v1/chat/completions`;
}

function modelsEndpoint(provider) {
  const configured = process.env[`${provider.name.toUpperCase().replace(/-/g, '_')}_URL`] || provider.base_url;
  const adapterType = provider.adapter_type || provider.name;
  if (adapterType === 'pollinations' && /\/openai\/?$/.test(configured))
    return configured.replace(/\/openai\/?$/, '/models');
  const url = endpoint(provider);
  return url.replace(/\/chat\/completions$/, '/models');
}

async function probe(provider) {
  const name = provider.name;
  const url = endpoint(provider);
  if (!isAllowedURL(url))
    return {
      id: provider.id || name,
      provider: name,
      status: 'unhealthy',
      latency: 0,
      checked_at: Date.now(),
      error: 'provider_egress_not_allowed',
    };
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const horde = (provider.adapter_type || name) === 'ai-horde';
    const headers = { 'content-type': 'application/json' };
    addProviderSecret(headers, provider);
    const response = await fetch(
      url,
      horde
        ? { headers: { ...headers, apikey: '0000000000' }, signal: controller.signal }
        : {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: 'health-check',
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 1,
            }),
            signal: controller.signal,
          },
    );
    return {
      id: provider.id || name,
      provider: name,
      status: response.ok ? 'healthy' : 'unhealthy',
      latency: Date.now() - started,
      checked_at: Date.now(),
    };
  } catch (error) {
    return {
      id: provider.id || name,
      provider: name,
      status: 'unhealthy',
      latency: Date.now() - started,
      checked_at: Date.now(),
      error: error?.name === 'AbortError' ? 'timeout' : 'request_failed',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function publish(results) {
  const token = process.env.CF_API_TOKEN;
  const account = process.env.CF_ACCOUNT_ID;
  const namespace = process.env.CF_KV_NAMESPACE_ID;
  if (!token || !account || !namespace) return false;
  const base = `https://api.cloudflare.com/client/v4/accounts/${account}/storage/kv/namespaces/${namespace}/values`;
  await Promise.all(
    results.map(async (result) => {
      const keys = new Set([result.id || result.provider, result.provider]);
      await Promise.all(
        [...keys].map(async (key) => {
          const response = await fetch(`${base}/health:${key}`, {
            method: 'PUT',
            headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
            body: JSON.stringify(result),
          });
          if (!response.ok) throw new Error(`Cloudflare KV publish failed for ${key}: ${response.status}`);
        }),
      );
    }),
  );
  return true;
}

async function syncModels(providers) {
  if (!process.env.CF_D1_DATABASE_ID) return;
  for (const provider of Object.values(providers)) {
    if ((provider.adapter_type || provider.name) === 'ai-horde') continue;
    const modelsURL = modelsEndpoint(provider);
    if (!isAllowedURL(modelsURL)) continue;
    const headers = {};
    addProviderSecret(headers, provider);
    try {
      const response = await fetch(modelsURL, { headers, signal: AbortSignal.timeout(5000) });
      if (!response.ok) continue;
      const payload = await response.json();
      const models = Array.isArray(payload?.data) ? payload.data : [];
      const ids = models.filter((model) => model?.id).map((model) => model.id);
      for (const model of models) {
        if (!model?.id) continue;
        await queryD1(
          `INSERT INTO provider_models (id, provider_id, model_id, model_name, model_display_name, context_window, metadata_json, is_deprecated, last_synced_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(provider_id, model_id) DO UPDATE SET model_name=excluded.model_name, model_display_name=excluded.model_display_name, context_window=excluded.context_window, is_deprecated=0, last_synced_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP`,
          [
            `${provider.id}:${model.id}`,
            provider.id,
            model.id,
            model.name || model.id,
            model.display_name || model.name || model.id,
            model.context_window || null,
            JSON.stringify({
              capabilities: Array.isArray(model.capabilities)
                ? model.capabilities
                : Number(provider.supports_embeddings) === 1
                  ? ['chat', 'embeddings']
                  : ['chat'],
              supported_parameters: Array.isArray(model.supported_parameters)
                ? model.supported_parameters
                : ['stream', 'temperature', 'max_tokens'],
              ...(typeof model.family === 'string' ? { family: model.family } : {}),
            }),
          ],
        );
      }
      if (ids.length === 0) {
        await queryD1('UPDATE provider_models SET is_deprecated=1, updated_at=CURRENT_TIMESTAMP WHERE provider_id=?', [
          provider.id,
        ]);
      } else {
        await queryD1(
          `UPDATE provider_models SET is_deprecated=1, updated_at=CURRENT_TIMESTAMP WHERE provider_id=? AND model_id NOT IN (${ids.map(() => '?').join(',')})`,
          [provider.id, ...ids],
        );
      }
    } catch (error) {
      console.warn(`Model sync failed for ${provider.name}: ${error.message}`);
    }
  }
}

async function run() {
  const dynamicProviders = await loadProviders();
  const results = await Promise.all(Object.values(dynamicProviders).map((provider) => probe(provider)));
  const published = await publish(results);
  const lastSync = Number(process.env.PROVIDER_MODEL_SYNC_LAST_RUN || 0);
  let synced = false;
  if (Date.now() - lastSync >= modelSyncInterval) {
    await syncModels(dynamicProviders);
    process.env.PROVIDER_MODEL_SYNC_LAST_RUN = String(Date.now());
    synced = true;
  }
  console.log(
    JSON.stringify({
      results,
      published,
      dynamic:
        Object.keys(dynamicProviders).length !== Object.keys(staticProviders).length ||
        Object.keys(dynamicProviders).some((name) => !staticProviders[name]),
      modelsSynced: synced,
    }),
  );
}

await run();
if (!once) setInterval(run, interval);
