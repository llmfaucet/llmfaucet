import { AuthenticationError, LlmFaucetError, PermissionError, RateLimitError } from '../errors';
import type { LlmFaucetConfig, RequestOptions } from '../types/client';

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const done = () => {
      signal?.removeEventListener('abort', abort);
      resolve();
    };
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(signal?.reason ?? new DOMException('The operation was aborted', 'AbortError'));
    };
    const timer = setTimeout(done, ms);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
  });
}

export async function request<T>(
  config: Required<Pick<LlmFaucetConfig, 'baseURL' | 'timeout' | 'maxRetries' | 'baseDelayMs'>> & LlmFaucetConfig,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const fetcher = config.fetch ?? globalThis.fetch;
  if (!fetcher) throw new LlmFaucetError({ message: 'Fetch is not available in this runtime' });
  const retries =
    options.retry === false
      ? 0
      : options.retry === true || options.method === 'GET' || options.method === undefined
        ? config.maxRetries
        : 0;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (options.signal?.aborted)
      throw options.signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    const abort = () => controller.abort(options.signal?.reason);
    if (options.signal) {
      if (options.signal.aborted) abort();
      else options.signal.addEventListener('abort', abort, { once: true });
    }
    try {
      const headers = new Headers(config.headers);
      headers.set('Accept', 'application/json');
      if (options.body) headers.set('Content-Type', 'application/json');
      if (config.apiKey) headers.set('Authorization', `Bearer ${config.apiKey}`);
      new Headers(options.headers).forEach((value, key) => headers.set(key, value));
      let response = await fetcher(`${config.baseURL.replace(/\/$/, '')}${path}`, {
        ...options,
        credentials: options.credentials ?? config.credentials,
        headers,
        signal: controller.signal,
      });
      let body = await response.text();
      if (response.status === 401 && config.onAuthRequired && !new Headers(options.headers).has('authorization')) {
        const token = await config.onAuthRequired();
        headers.set('Authorization', `Bearer ${token}`);
        response = await fetcher(`${config.baseURL.replace(/\/$/, '')}${path}`, {
          ...options,
          headers,
          signal: controller.signal,
        });
        body = await response.text();
      }
      if (!response.ok) {
        let parsed: { message?: string; error?: { message?: string }; code?: string } = {};
        if (body) {
          try {
            parsed = JSON.parse(body) as typeof parsed;
          } catch {
            /* Preserve the HTTP status for non-JSON error bodies. */
          }
        }
        const message = parsed.message ?? parsed.error?.message ?? `Request failed with status ${response.status}`;
        if (response.status === 401) throw new AuthenticationError(message);
        if (response.status === 403) throw new PermissionError(message);
        if (response.status === 429)
          throw new RateLimitError(message, Number(response.headers.get('retry-after') ?? '') || undefined);
        throw new LlmFaucetError({ message, status: response.status, code: parsed.code });
      }
      return (body ? JSON.parse(body) : undefined) as T;
    } catch (error) {
      if (options.signal?.aborted) throw options.signal.reason ?? error;
      lastError = error;
      const retryable =
        error instanceof LlmFaucetError ? !error.status || error.status === 429 || error.status >= 500 : true;
      if (!retryable || attempt === retries)
        throw error instanceof LlmFaucetError
          ? error
          : new LlmFaucetError({ message: error instanceof Error ? error.message : 'Network error', cause: error });
      await wait(config.baseDelayMs * 2 ** attempt, options.signal ?? undefined);
    } finally {
      clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', abort);
    }
  }
  throw lastError;
}

export interface RetryConfig {
  maxRetries: number;
  backoff?: 'linear' | 'exponential';
  delayMs?: number;
}
export async function retryWithBackoff<T>(fn: () => Promise<T>, config: RetryConfig): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      if (!isRetryableError(error) || attempt === config.maxRetries) throw error;
      await wait((config.delayMs ?? 250) * (config.backoff === 'linear' ? attempt + 1 : 2 ** attempt));
    }
  }
  throw last;
}
export function isRetryableError(error: unknown) {
  return !(error instanceof LlmFaucetError) || error.status === 429 || (error.status ?? 0) >= 500;
}
