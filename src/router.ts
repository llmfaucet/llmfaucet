import { findModel, MODELS } from './catalog';
import type { Model, NormalizedRequest } from './types';

const aliases: Record<string, string> = { fastest: 'fast', cheapest: 'fast', smart: 'smart', coding: 'coding', fast: 'fast', auto: 'auto' };

export function normalize(body: Record<string, unknown>, capability: NormalizedRequest['capability'] = 'chat'): NormalizedRequest {
  const messages = Array.isArray(body.messages) ? body.messages as any[] : typeof body.prompt === 'string' ? [{ role: 'user', content: body.prompt }] : [];
  if (messages.some((message) => !message || typeof message !== 'object' || typeof message.role !== 'string')) throw new Error('messages must contain role-bearing objects');
  if (body.max_tokens !== undefined && (typeof body.max_tokens !== 'number' || !Number.isInteger(body.max_tokens) || body.max_tokens < 1)) throw new Error('max_tokens must be a positive integer');
  const hasVision = messages.some((m) => Array.isArray(m?.content) && m.content.some((part: any) => part?.type === 'image_url' || part?.type === 'image'));
  return { model: String(body.model ?? 'auto'), messages, stream: body.stream === true, max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : undefined, temperature: typeof body.temperature === 'number' ? body.temperature : undefined, tools: Array.isArray(body.tools) ? body.tools : undefined, tool_choice: body.tool_choice, response_format: body.response_format, capability: hasVision ? 'vision' : capability, selector: String(body.model ?? 'auto').toLowerCase(), raw: body };
}

export function selectModel(req: NormalizedRequest, unhealthy = new Set<string>(), models = MODELS): Model | undefined {
  const requested = findModel(req.model, models);
  if (requested && requested.capabilities.includes(req.capability) && !(req.stream && requested.provider === 'ai-horde') && !unhealthy.has(requested.provider)) return requested;
  const selector = aliases[req.selector.replace(/^auto:?/, '')] ?? 'auto';
  return models.filter((m) => m.capabilities.includes(req.capability) && !(req.stream && m.provider === 'ai-horde') && (!req.tools || m.capabilities.includes('tools')) && !unhealthy.has(m.provider)).sort((a, b) => {
    const ac = selector === 'coding' && /(coder|code|deepseek)/i.test(a.id) ? 5 : 0;
    const bc = selector === 'coding' && /(coder|code|deepseek)/i.test(b.id) ? 5 : 0;
    return selector === 'fast' ? b.speed - a.speed : selector === 'smart' ? b.quality - a.quality : (bc + b.quality * 3 + b.speed * 2) - (ac + a.quality * 3 + a.speed * 2);
  })[0];
}

export function capabilityError(capability: string): Response { return Response.json({ error: { message: `No model supports ${capability}`, type: 'invalid_request_error', code: `no_${capability}_model` } }, { status: 422 }); }
