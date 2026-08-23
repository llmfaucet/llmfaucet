export function responseHeaders(remaining: number, reset: number, provider?: string, attempts = 1): Headers {
  const h = new Headers({ 'x-ratelimit-remaining': String(remaining), 'x-ratelimit-reset': String(Math.floor(reset / 1000)), 'access-control-allow-origin': '*', 'access-control-expose-headers': 'X-Routed-Via, X-Fallback-Attempts, X-RateLimit-Remaining, X-RateLimit-Reset' });
  if (provider) { h.set('x-routed-via', provider); h.set('x-fallback-attempts', String(attempts)); }
  return h;
}

export function error(message: string, status: number, headers?: HeadersInit): Response { return Response.json({ error: { message, type: status === 429 ? 'rate_limit_error' : 'invalid_request_error' } }, { status, headers: { 'access-control-allow-origin': '*', ...headers } }); }
