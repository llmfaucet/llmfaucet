#!/usr/bin/env node

const providers = {
  pollinations: process.env.POLLINATIONS_URL || 'https://text.pollinations.ai/openai',
  llm7: process.env.LLM7_URL || 'https://api.llm7.io/v1/chat/completions',
  'opencode-zen': process.env.OPENCODE_ZEN_URL || 'https://opencode.ai/zen/v1/chat/completions',
  ovh: process.env.OVH_URL || 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
  'ai-horde': 'https://aihorde.net/api/v2/status'
};
const interval = Number(process.env.PROBE_INTERVAL_MS || 3600000);
const once = process.argv.includes('--once');

async function probe(name, url) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const horde = name === 'ai-horde';
    const response = await fetch(url, horde
      ? { headers: { apikey: '0000000000' }, signal: controller.signal }
      : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'health-check', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 }), signal: controller.signal });
    return { provider: name, status: response.ok ? 'healthy' : 'degraded', latency: Date.now() - started, checked_at: Date.now() };
  } catch (error) {
    return { provider: name, status: 'unhealthy', latency: Date.now() - started, checked_at: Date.now(), error: error?.name === 'AbortError' ? 'timeout' : 'request_failed' };
  } finally { clearTimeout(timer); }
}

async function publish(results) {
  const token = process.env.CF_API_TOKEN;
  const account = process.env.CF_ACCOUNT_ID;
  const namespace = process.env.CF_KV_NAMESPACE_ID;
  if (!token || !account || !namespace) return false;
  const base = `https://api.cloudflare.com/client/v4/accounts/${account}/storage/kv/namespaces/${namespace}/values`;
  await Promise.all(results.map(async (result) => {
    const response = await fetch(`${base}/health:${result.provider}`, { method: 'PUT', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(result) });
    if (!response.ok) throw new Error(`Cloudflare KV publish failed for ${result.provider}: ${response.status}`);
  }));
  return true;
}

async function run() {
  const results = await Promise.all(Object.entries(providers).map(([name, url]) => probe(name, url)));
  const published = await publish(results);
  console.log(JSON.stringify({ results, published }));
}

await run();
if (!once) setInterval(run, interval);
