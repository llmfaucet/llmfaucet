import { AuthenticationError, LlmFaucetError, PermissionError, RateLimitError } from '../errors';

export async function* parseSse<T>(response: Response): AsyncGenerator<T> {
  if (!response.ok) {
    const payload = (await response
      .clone()
      .json()
      .catch(() => null)) as { message?: string; error?: { message?: string } } | null;
    const message = payload?.message ?? payload?.error?.message ?? `Stream failed with status ${response.status}`;
    if (response.status === 401) throw new AuthenticationError(message);
    if (response.status === 403) throw new PermissionError(message);
    if (response.status === 429)
      throw new RateLimitError(message, Number(response.headers.get('retry-after') ?? '') || undefined);
    throw new LlmFaucetError({ status: response.status, message });
  }
  const reader = response.body?.getReader();
  if (!reader) throw new LlmFaucetError({ message: 'Stream response has no body' });
  const decoder = new TextDecoder();
  let buffer = '';
  const emit = async function* (line: string): AsyncGenerator<T> {
    const value = line.trim();
    if (!value.startsWith('data:') || value === 'data: [DONE]') return;
    const json = value.slice(5).trim();
    if (!json) return;
    try {
      yield JSON.parse(json) as T;
    } catch (cause) {
      throw new LlmFaucetError({ message: 'Malformed SSE data received from llmfaucet', cause });
    }
  };
  let completed = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) yield* emit(line);
      if (done) {
        completed = true;
        break;
      }
    }
    if (buffer) yield* emit(buffer);
  } finally {
    if (!completed) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export async function* streamSSE<T>(url: string, options: RequestInit = {}): AsyncGenerator<T> {
  const response = await fetch(url, { ...options, headers: { ...options.headers, Accept: 'text/event-stream' } });
  yield* parseSse<T>(response);
}
