import { findModel, MODELS } from './catalog';
import type { Model, NormalizedRequest } from './types';

const aliases: Record<string, string> = { fastest: 'fast', smart: 'smart', coding: 'coding', fast: 'fast', auto: 'auto' };

export function normalize(body: Record<string, unknown>, capability: NormalizedRequest['capability'] = 'chat'): NormalizedRequest {
  const messages = Array.isArray(body.messages) ? body.messages as any[] : typeof body.prompt === 'string' ? [{ role: 'user', content: body.prompt }] : [];
  if (messages.some((message) => !message || typeof message !== 'object' || typeof message.role !== 'string')) throw new Error('messages must contain role-bearing objects');
  if (body.max_tokens !== undefined && (typeof body.max_tokens !== 'number' || !Number.isInteger(body.max_tokens) || body.max_tokens < 1)) throw new Error('max_tokens must be a positive integer');
  const hasVision = messages.some((m) => Array.isArray(m?.content) && m.content.some((part: any) => part?.type === 'image_url' || part?.type === 'image'));
  return { model: String(body.model ?? 'auto'), messages, stream: body.stream === true, max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : undefined, temperature: typeof body.temperature === 'number' ? body.temperature : undefined, tools: Array.isArray(body.tools) ? body.tools : undefined, tool_choice: body.tool_choice, response_format: body.response_format, capability: hasVision ? 'vision' : capability, selector: String(body.model ?? 'auto').toLowerCase(), raw: body };
}

export function supportsRequest(req: NormalizedRequest, model: Model): boolean {
  if (!model.capabilities.includes(req.capability)) return false;
  if (req.capability !== 'embeddings' && !model.supported_parameters.includes('max_tokens')) return false;
  if (req.stream && !model.supported_parameters.includes('stream')) return false;
  if (req.tools && !model.capabilities.includes('tools')) return false;
  if (req.response_format && !model.supported_parameters.includes('response_format')) return false;
  if (req.temperature !== undefined && !model.supported_parameters.includes('temperature')) return false;
  return true;
}

export function selectModel(req: NormalizedRequest, unhealthy = new Set<string>(), models = MODELS): Model | undefined {
  const requested = findModel(req.model, models);
  if (requested && supportsRequest(req, requested) && !unhealthy.has(requested.provider)) return requested;
  const selector = aliases[req.selector.replace(/^auto:?/, '')] ?? 'auto';
  const rank = (model: Model): number => {
    const provider = (model.provider_priority ?? 0) * 0.1 + Math.log(model.provider_weight ?? 1);
    const coding = selector === 'coding' && /(coder|code|deepseek)/i.test(model.id) ? 5 : 0;
    if (selector === 'fast') return model.speed + provider;
    if (selector === 'smart') return model.quality + provider;
    return coding + model.quality * 3 + model.speed * 2 + provider;
  };
  return models.filter((m) => supportsRequest(req, m) && !unhealthy.has(m.provider)).sort((a, b) => {
    return rank(b) - rank(a);
  })[0];
}

export function capabilityError(capability: string, wire: 'openai' | 'anthropic' = 'openai'): Response {
  return wire === 'anthropic'
    ? Response.json({ type: 'error', error: { type: 'invalid_request_error', message: `No model supports ${capability}` } }, { status: 422 })
    : Response.json({ error: { message: `No model supports ${capability}`, type: 'invalid_request_error', code: `no_${capability}_model` } }, { status: 422 });
}
