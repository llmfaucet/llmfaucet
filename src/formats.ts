import type { NormalizedRequest } from './types';
import { normalize } from './router';

export function openAIRequest(body: Record<string, unknown>): NormalizedRequest { return normalize(body, 'chat'); }
export function legacyRequest(body: Record<string, unknown>): NormalizedRequest { return { ...normalize(body, 'completion'), wire: 'legacy' }; }
export function anthropicRequest(body: Record<string, unknown>): NormalizedRequest {
  const messages = anthropicMessagesToOpenAI(body.messages);
  if (typeof body.system === 'string' || Array.isArray(body.system)) messages.unshift({ role: 'system', content: body.system });
  return normalize({ ...body, messages, max_tokens: body.max_tokens ?? body.max_output_tokens, tools: translateTools(body.tools, 'anthropic'), tool_choice: translateToolChoice(body.tool_choice, 'anthropic'), model: body.model ?? 'auto' }, 'chat');
}
export function responsesRequest(body: Record<string, unknown>): NormalizedRequest {
  return normalize({ ...body, messages: responsesInputToMessages(body.input), max_tokens: body.max_tokens ?? body.max_output_tokens, tools: translateTools(body.tools, 'responses'), tool_choice: translateToolChoice(body.tool_choice, 'responses'), stream: body.stream }, 'chat');
}

function translateTools(value: unknown, source: 'anthropic' | 'responses'): unknown[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((tool) => {
    if (!tool || typeof tool !== 'object') return tool;
    const item = tool as Record<string, unknown>;
    if (source === 'anthropic') { if (typeof item.name !== 'string' || !item.input_schema) throw new Error('Invalid Anthropic tool definition'); return { type: 'function', function: { name: item.name, description: item.description, parameters: item.input_schema } }; }
    if (item.type === 'function' && item.function) return item;
    if (source === 'responses' && item.type !== 'function') throw new Error('Unsupported Responses tool type');
    return { type: 'function', function: { name: item.name, description: item.description, parameters: item.parameters } };
  });
}

function translateToolChoice(value: unknown, source: 'anthropic' | 'responses'): unknown {
  if (source === 'anthropic') {
    if (value === 'any') return 'required';
    if (value === 'auto' || value === 'none') return value;
    if (value && typeof value === 'object' && (value as Record<string, unknown>).type === 'tool') return { type: 'function', function: { name: (value as Record<string, unknown>).name } };
  }
  if (value && typeof value === 'object' && (value as Record<string, unknown>).type === 'function') return { type: 'function', function: { name: (value as Record<string, unknown>).name } };
  return value;
}

function anthropicMessagesToOpenAI(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw): Array<Record<string, unknown>> => {
    if (!raw || typeof raw !== 'object') return [];
    const message = raw as Record<string, unknown>;
    if (!Array.isArray(message.content)) return [message];
    const blocks = message.content.filter((block): block is Record<string, unknown> => Boolean(block && typeof block === 'object'));
    const toolUses = blocks.filter((block) => block.type === 'tool_use');
    const toolResults = blocks.filter((block) => block.type === 'tool_result');
    if (toolResults.length) return toolResults.map((block) => ({ role: 'tool', tool_call_id: block.tool_use_id, content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content ?? '') }));
    if (toolUses.length) return [{ ...message, content: blocks.filter((block) => block.type === 'text').map((block) => block.text).join(''), tool_calls: toolUses.map((block) => ({ id: block.id, type: 'function', function: { name: block.name, arguments: JSON.stringify(block.input ?? {}) } })) }];
    return [message];
  });
}

function contentPart(part: Record<string, unknown>): Record<string, unknown> {
  if (part.type === 'input_text' || part.type === 'output_text') return { type: 'text', text: String(part.text ?? '') };
  if (part.type === 'input_image') return { type: 'image_url', image_url: { url: String(part.image_url ?? part.url ?? '') } };
  return part;
}

function responsesInputToMessages(input: unknown): Array<Record<string, unknown>> {
  if (typeof input === 'string') return [{ role: 'user', content: input }];
  if (!Array.isArray(input)) return [{ role: 'user', content: String(input ?? '') }];
  return input.flatMap((item): Array<Record<string, unknown>> => {
    if (!item || typeof item !== 'object') return [];
    const value = item as Record<string, unknown>;
    if (typeof value.role === 'string' || value.type === 'message') return [{ role: String(value.role ?? 'user'), content: Array.isArray(value.content) ? value.content.map((part) => part && typeof part === 'object' ? contentPart(part as Record<string, unknown>) : part) : value.content }];
    if (value.type === 'function_call') return [{ role: 'assistant', content: null, tool_calls: [{ id: value.call_id, type: 'function', function: { name: value.name, arguments: value.arguments } }] }];
    if (value.type === 'function_call_output') return [{ role: 'tool', tool_call_id: value.call_id, content: String(value.output ?? '') }];
    if (value.type === 'input_text') return [{ role: 'user', content: String(value.text ?? '') }];
    if (value.type === 'input_image') return [{ role: 'user', content: [contentPart(value)] }];
    return [];
  });
}
export function embeddingRequest(body: Record<string, unknown>): NormalizedRequest { return { ...normalize(body, 'embeddings'), wire: 'embeddings' }; }

export function openAIResponse(data: unknown, model: string): unknown { return { id: `chatcmpl-${crypto.randomUUID()}`, object: 'chat.completion', created: Math.floor(Date.now() / 1000), model, choices: [{ index: 0, message: { role: 'assistant', content: typeof data === 'string' ? data : data }, finish_reason: 'stop' }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } }; }

export function anthropicResponse(data: any, model: string): unknown {
  const choice = data?.choices?.[0];
  const stopReason = choice?.finish_reason === 'stop' ? 'end_turn' : choice?.finish_reason === 'length' ? 'max_tokens' : choice?.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn';
  const message = choice?.message ?? {};
  const content = [{ type: 'text', text: typeof message.content === 'string' ? message.content : '' }, ...(message.tool_calls ?? []).map((tool: any) => ({ type: 'tool_use', id: tool.id, name: tool.function?.name, input: parseToolArguments(tool.function?.arguments) }))];
  return { id: data?.id ?? `msg_${crypto.randomUUID()}`, type: 'message', role: 'assistant', model, content, stop_reason: stopReason, stop_sequence: null, usage: { input_tokens: data?.usage?.prompt_tokens ?? 0, output_tokens: data?.usage?.completion_tokens ?? 0 } };
}

function parseToolArguments(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string') return {};
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Upstream returned invalid tool arguments');
  return parsed as Record<string, unknown>;
}

export function responsesResponse(data: any, model: string): unknown {
  const message = data?.choices?.[0]?.message ?? {};
  const text = typeof message.content === 'string' ? message.content : '';
  const output = [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }, ...(message.tool_calls ?? []).map((tool: any) => ({ type: 'function_call', call_id: tool.id, name: tool.function?.name, arguments: tool.function?.arguments ?? '' }))];
  return { id: data?.id ?? `resp_${crypto.randomUUID()}`, object: 'response', model, status: 'completed', output, usage: data?.usage };
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
  let text = '';
  let textItemStarted = false;
  const tools = new Map<number, { id?: string; callId?: string; name?: string; arguments: string }>();
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
          if (textItemStarted) { controller.enqueue(event('response.output_text.done', { type: 'response.output_text.done', item_id: id, output_index: 0, content_index: 0, text })); controller.enqueue(event('response.content_part.done', { type: 'response.content_part.done', item_id: id, output_index: 0, content_index: 0, part: { type: 'output_text', text } })); controller.enqueue(event('response.output_item.done', { type: 'response.output_item.done', output_index: 0, item: { type: 'message', id, role: 'assistant', status: 'completed', content: [{ type: 'output_text', text }] } })); }
          for (const [index, tool] of tools) {
            controller.enqueue(event('response.function_call_arguments.done', { type: 'response.function_call_arguments.done', item_id: tool.id, output_index: index, call_id: tool.callId, name: tool.name, arguments: tool.arguments }));
            controller.enqueue(event('response.output_item.done', { type: 'response.output_item.done', output_index: index, item: { type: 'function_call', id: tool.id, call_id: tool.callId, name: tool.name, arguments: tool.arguments, status: 'completed' } }));
          }
          controller.enqueue(event('response.completed', { type: 'response.completed', response: { id, object: 'response', model, status: 'completed' } }));
          continue;
        }
        try {
          const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: unknown; tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }> } }> };
          const delta = parsed.choices?.[0]?.delta;
          const content = delta?.content;
          if (typeof content === 'string' && content) { if (!textItemStarted) { textItemStarted = true; controller.enqueue(event('response.output_item.added', { type: 'response.output_item.added', output_index: 0, item: { type: 'message', id, role: 'assistant', status: 'in_progress', content: [] } })); controller.enqueue(event('response.content_part.added', { type: 'response.content_part.added', item_id: id, output_index: 0, content_index: 0, part: { type: 'output_text', text: '' } })); } text += content; controller.enqueue(event('response.output_text.delta', { type: 'response.output_text.delta', item_id: id, output_index: 0, content_index: 0, delta: content })); }
          for (const tool of delta?.tool_calls ?? []) {
            const index = (tool.index ?? 0) + 1;
            const current = tools.get(index) ?? { id: tool.id ?? `fc_${crypto.randomUUID()}`, callId: tool.id, name: undefined, arguments: '' };
            if (tool.function?.name) { current.name = tool.function.name; controller.enqueue(event('response.output_item.added', { type: 'response.output_item.added', output_index: index, item: { type: 'function_call', id: current.id, call_id: current.callId, name: current.name, arguments: '', status: 'in_progress' } })); }
            if (tool.function?.arguments) { current.arguments += tool.function.arguments; controller.enqueue(event('response.function_call_arguments.delta', { type: 'response.function_call_arguments.delta', item_id: current.id, output_index: index, delta: tool.function.arguments, call_id: current.callId })); }
            tools.set(index, current);
          }
        } catch { /* ignore non-JSON provider comments */ }
      }
    },
    cancel() { void reader.cancel(); }
  });
  return new Response(stream, { status: response.status, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' } });
}

export function anthropicStream(response: Response, model: string): Response {
  const reader = response.body?.getReader();
  if (!reader) return new Response(null, { status: 502 });
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const id = `msg_${crypto.randomUUID()}`;
  let buffer = '';
  let started = false;
  let stopped = false;
  let textStarted = false;
  const toolIndexes = new Set<number>();
  let sawTool = false;
  const event = (type: string, data: unknown): Uint8Array => encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const chunk = await reader.read();
      if (chunk.done) {
        if (!stopped) controller.enqueue(event('error', { type: 'error', error: { type: 'api_error', message: 'Upstream stream ended unexpectedly.' } }));
        controller.close();
        return;
      }
      if (!started) {
        started = true;
        controller.enqueue(event('message_start', { type: 'message_start', message: { id, type: 'message', role: 'assistant', model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 0, output_tokens: 0 } } }));
      }
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') {
          stopped = true;
          if (textStarted) controller.enqueue(event('content_block_stop', { type: 'content_block_stop', index: 0 }));
          for (const index of toolIndexes) controller.enqueue(event('content_block_stop', { type: 'content_block_stop', index }));
          controller.enqueue(event('message_delta', { type: 'message_delta', delta: { stop_reason: sawTool ? 'tool_use' : 'end_turn', stop_sequence: null }, usage: { output_tokens: 0 } }));
          controller.enqueue(event('message_stop', { type: 'message_stop' }));
          continue;
        }
        try {
          const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: unknown; tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }> } }> };
          const delta = parsed.choices?.[0]?.delta;
          const content = delta?.content;
          if (typeof content === 'string' && content) { if (!textStarted) { textStarted = true; controller.enqueue(event('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })); } controller.enqueue(event('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: content } })); }
          for (const tool of delta?.tool_calls ?? []) {
            const index = (tool.index ?? 0) + 1;
            toolIndexes.add(index);
            sawTool = true;
            if (tool.function?.name) controller.enqueue(event('content_block_start', { type: 'content_block_start', index, content_block: { type: 'tool_use', id: tool.id, name: tool.function.name, input: {} } }));
            if (tool.function?.arguments) controller.enqueue(event('content_block_delta', { type: 'content_block_delta', index, delta: { type: 'input_json_delta', partial_json: tool.function.arguments } }));
          }
        } catch { /* ignore provider comments */ }
      }
    },
    cancel() { void reader.cancel(); }
  });
  return new Response(stream, { status: response.status, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' } });
}

export function anthropicModels(models: Array<{ id: string; provider: string; context: number }>): unknown {
  return { data: models.map((model) => ({ type: 'model', id: model.id, display_name: model.id, created_at: new Date(0).toISOString(), input_token_limit: model.context, output_token_limit: model.context })) };
}
