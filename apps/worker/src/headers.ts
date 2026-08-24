export function responseHeaders(remaining: number, reset: number, provider?: string, attempts = 1): Headers {
  const h = new Headers({ 'x-ratelimit-remaining': String(remaining), 'x-ratelimit-reset': String(Math.floor(reset / 1000)), 'access-control-allow-origin': '*', 'access-control-expose-headers': 'X-Routed-Via, X-Fallback-Attempts, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-LLMFaucet-Plan' });
  if (provider) { h.set('x-routed-via', provider); h.set('x-fallback-attempts', String(attempts)); }
  return h;
}

const exposed = 'Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset';
export function error(message: string, status: number, headers?: HeadersInit): Response { const merged = new Headers({ 'access-control-allow-origin': '*', 'access-control-expose-headers': exposed, ...headers }); const code = merged.get('x-error-code'); return Response.json({ error: { message, type: status === 429 ? 'rate_limit_error' : 'invalid_request_error', param: null, code } }, { status, headers: merged }); }
export function anthropicError(message: string, status: number, headers?: HeadersInit): Response { const merged = new Headers({ 'access-control-allow-origin': '*', 'access-control-expose-headers': exposed, ...headers }); return Response.json({ type: 'error', error: { type: status === 429 ? 'rate_limit_error' : 'invalid_request_error', message } }, { status, headers: merged }); }
