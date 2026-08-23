import type { NormalizedRequest } from './types';
import { normalize } from './router';

export function openAIRequest(body: Record<string, unknown>): NormalizedRequest { return normalize(body, 'chat'); }
export function legacyRequest(body: Record<string, unknown>): NormalizedRequest { return { ...normalize(body, 'completion'), wire: 'legacy' }; }
export function anthropicRequest(body: Record<string, unknown>): NormalizedRequest { return normalize({ ...body, messages: body.messages, model: body.model ?? 'auto' }, 'chat'); }
export function responsesRequest(body: Record<string, unknown>): NormalizedRequest {
  const input = Array.isArray(body.input) ? body.input : [{ role: 'user', content: String(body.input ?? '') }];
  return normalize({ ...body, messages: input, stream: body.stream }, 'chat');
}
export function embeddingRequest(body: Record<string, unknown>): NormalizedRequest { return { ...normalize(body, 'embeddings'), wire: 'embeddings' }; }

export function openAIResponse(data: unknown, model: string): unknown { return { id: `chatcmpl-${crypto.randomUUID()}`, object: 'chat.completion', created: Math.floor(Date.now() / 1000), model, choices: [{ index: 0, message: { role: 'assistant', content: typeof data === 'string' ? data : data }, finish_reason: 'stop' }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } }; }

export function anthropicResponse(data: any, model: string): unknown {
  const choice = data?.choices?.[0];
  return { id: data?.id ?? `msg_${crypto.randomUUID()}`, type: 'message', role: 'assistant', model, content: [{ type: 'text', text: choice?.message?.content ?? '' }], stop_reason: choice?.finish_reason ?? 'end_turn', stop_sequence: null, usage: { input_tokens: data?.usage?.prompt_tokens ?? 0, output_tokens: data?.usage?.completion_tokens ?? 0 } };
}

export function responsesResponse(data: any, model: string): unknown {
  const text = data?.choices?.[0]?.message?.content ?? '';
  return { id: data?.id ?? `resp_${crypto.randomUUID()}`, object: 'response', model, status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }], usage: data?.usage };
}

export function legacyResponse(data: any, model: string): unknown { const choice = data?.choices?.[0]; return { id: data?.id ?? `cmpl-${crypto.randomUUID()}`, object: 'text_completion', created: Math.floor(Date.now() / 1000), model, choices: [{ text: choice?.message?.content ?? choice?.text ?? '', index: 0, finish_reason: choice?.finish_reason ?? 'stop' }], usage: data?.usage }; }

export function embeddingResponse(data: any, model: string): unknown { if (data?.object === 'list') return data; return { object: 'list', data: [{ object: 'embedding', index: 0, embedding: data?.data?.[0]?.embedding ?? [] }], model, usage: data?.usage ?? { prompt_tokens: 0, total_tokens: 0 } }; }

export function responsesStream(response: Response, model: string): Response {
  const reader = response.body?.getReader();
  if (!reader) return new Response(null, { status: 502 });
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const id = `resp_${crypto.randomUUID()}`;
  let buffer = '';
  let completed = false;
  let started = false;
  const event = (type: string, data: unknown): Uint8Array => encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const chunk = await reader.read();
      if (chunk.done) {
        if (!completed) controller.enqueue(event('response.failed', { type: 'response.failed', response: { id, object: 'response', model, status: 'failed' } }));
        controller.close();
        return;
      }
      if (!started) { started = true; controller.enqueue(event('response.created', { type: 'response.created', response: { id, object: 'response', model, status: 'in_progress' } })); }
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') {
          completed = true;
          controller.enqueue(event('response.completed', { type: 'response.completed', response: { id, object: 'response', model, status: 'completed' } }));
          continue;
        }
        try {
          const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: unknown } }> };
          const content = parsed.choices?.[0]?.delta?.content;
          if (typeof content === 'string' && content) controller.enqueue(event('response.output_text.delta', { type: 'response.output_text.delta', item_id: id, output_index: 0, content_index: 0, delta: content }));
        } catch { /* ignore non-JSON provider comments */ }
      }
    },
    cancel() { void reader.cancel(); }
  });
  return new Response(stream, { status: response.status, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' } });
}

export function anthropicModels(models: Array<{ id: string; provider: string; context: number }>): unknown {
  return { data: models.map((model) => ({ type: 'model', id: model.id, display_name: model.id, created_at: new Date(0).toISOString(), input_token_limit: model.context, output_token_limit: model.context })) };
}
