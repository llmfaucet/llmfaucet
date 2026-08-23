import type { Env, Model, NormalizedRequest, ProviderResult } from './types';

const defaults: Record<string, string> = { pollinations: 'https://text.pollinations.ai/openai', llm7: 'https://api.llm7.io/v1/chat/completions', 'opencode-zen': 'https://opencode.ai/zen/v1/chat/completions', ovh: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions', 'ai-horde': 'https://aihorde.net/api/v2/generate/async' };
const envKeys: Record<string, keyof Env> = { pollinations: 'POLLINATIONS_URL', llm7: 'LLM7_URL', 'opencode-zen': 'OPENCODE_ZEN_URL', ovh: 'OVH_URL', 'ai-horde': 'AI_HORDE_URL' };

function endpoint(provider: string, env: Env): string { return env[envKeys[provider]] as string || defaults[provider]; }

export async function callProvider(model: Model, req: NormalizedRequest, env: Env): Promise<ProviderResult> {
  const headers = new Headers({ 'content-type': 'application/json', accept: req.stream ? 'text/event-stream' : 'application/json' });
  const input = req.raw.input ?? req.raw.prompt;
  const passThrough = ['top_p', 'stop', 'frequency_penalty', 'presence_penalty', 'seed', 'stream_options'];
  const extras = Object.fromEntries(passThrough.filter((key) => req.raw[key] !== undefined).map((key) => [key, req.raw[key]]));
  const body = req.capability === 'embeddings' ? { model: model.id.split('/').slice(1).join('/'), input } : {
    ...extras,
    model: model.id.split('/').slice(1).join('/'), messages: req.messages, stream: req.stream,
    ...(req.max_tokens === undefined ? {} : { max_tokens: req.max_tokens }), ...(req.temperature === undefined ? {} : { temperature: req.temperature }),
    ...(req.tools === undefined ? {} : { tools: req.tools }), ...(req.tool_choice === undefined ? {} : { tool_choice: req.tool_choice }), ...(req.response_format === undefined ? {} : { response_format: req.response_format })
  };
  if (model.provider === 'ai-horde') return horde(model, req, env);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  const target = req.capability === 'embeddings' ? endpoint(model.provider, env).replace(/\/chat\/completions$/, '/embeddings') : endpoint(model.provider, env);
  try { response = await fetch(target, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal }); } finally { clearTimeout(timer); }
  if (!response.ok) throw new Error(`${model.provider} returned ${response.status}`);
  return { response, model, provider: model.provider };
}

async function horde(model: Model, req: NormalizedRequest, env: Env): Promise<ProviderResult> {
  const base = endpoint('ai-horde', env).replace(/\/generate\/async$/, '');
  const headers = { 'content-type': 'application/json', apikey: '0000000000' };
  const submitted = await fetch(`${base}/generate/async`, { method: 'POST', headers, body: JSON.stringify({ prompt: req.messages.map((m) => `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`).join('\n'), models: [model.id.replace(/^horde\//, '')], params: { max_length: req.max_tokens ?? 512, temperature: req.temperature ?? 0.7 } }) });
  if (!submitted.ok) throw new Error(`ai-horde returned ${submitted.status}`);
  const { id } = await submitted.json() as { id: string };
  for (let i = 0; i < 20; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const status = await fetch(`${base}/generate/status/${id}`, { headers: { apikey: '0000000000' } });
    const data = await status.json() as any;
    if (data.done) return { response: Response.json({ choices: [{ message: { role: 'assistant', content: data.generations?.[0]?.text ?? '' }, finish_reason: 'stop' }] }), model, provider: model.provider };
  }
  throw new Error('ai-horde timed out');
}
